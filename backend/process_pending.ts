import { prisma } from './src/db';
import { processSingleEmail } from './src/workers/emailWorker';

async function main() {
  const pendingEmails = await prisma.email.findMany({
    where: { status: { in: ['PENDING', 'FAILED'] } }
  });
  
  console.log(`Found ${pendingEmails.length} pending emails.`);
  
  for (const email of pendingEmails) {
    try {
      await processSingleEmail(email.id);
    } catch (e) {
      console.error(e);
    }
  }
  
  console.log("Done processing all pending emails.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
