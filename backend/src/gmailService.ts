import { google } from 'googleapis';
import { prisma } from './db';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const syncEmailsForUser = async (userId: string) => {
  const account = await prisma.gmailAccount.findUnique({
    where: { userId },
  });

  if (!account) {
    throw new Error('Gmail account not connected');
  }

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.tokenExpiry ? account.tokenExpiry.getTime() : null,
  });

  // Handle token refresh automatically by googleapis if refresh_token is present
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.gmailAccount.update({
        where: { userId },
        data: {
          accessToken: tokens.access_token,
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });
    }
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Fetch up to 100,000 emails using pagination (max 500 per page)
  const MAX_EMAILS = 100000;
  const allMessages: any[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const listResponse: any = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 500,
      pageToken: pageToken,
    });

    if (listResponse.data.messages) {
      allMessages.push(...listResponse.data.messages);
    }
    
    pageToken = listResponse.data.nextPageToken || undefined;
  } while (pageToken && allMessages.length < MAX_EMAILS);

  // Cap to MAX_EMAILS just in case the last page pushed us over
  const messages = allMessages.slice(0, MAX_EMAILS);

  for (const message of messages) {
    if (!message.id) continue;

    const existingEmail = await prisma.email.findUnique({
      where: { messageId: message.id },
    });

    if (existingEmail) {
      if (existingEmail.status === 'PENDING') {
        // Re-process stuck emails
        import('./workers/emailWorker').then(({ processSingleEmail }) => {
          processSingleEmail(existingEmail.id).catch(err => console.error("Failed to process existing email inline", err));
        }).catch(err => console.error("Failed to load worker", err));
      }
      continue; // Skip if already PROCESSED or after triggering re-process
    }

    // Fetch full message details
    try {
      const msgData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });

      const headers = msgData.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
      const sender = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
      const dateStr = headers.find((h) => h.name === 'Date')?.value;
      const date = dateStr ? new Date(dateStr) : new Date();
      const snippet = msgData.data.snippet || '';

      // Save to database
      await prisma.email.create({
        data: {
          messageId: message.id,
          userId: userId,
          sender,
          subject,
          snippet,
          date,
          status: 'PENDING',
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Silently ignore if the email was inserted concurrently
      } else {
        console.error(`Failed to fetch or save email ${message.id}:`, err);
      }
    }
  }

  // Trigger sequential processing in background so it doesn't crash the API
  const scriptPath = path.join(__dirname, '../../process_pending.ts');
  const child = spawn('npx', ['tsx', scriptPath], {
    detached: true,
    stdio: 'ignore',
    shell: true
  });
  child.unref();

  // Update last sync time
  await prisma.gmailAccount.update({
    where: { userId },
    data: { lastSync: new Date() },
  });

  return { success: true, count: messages.length };
};
