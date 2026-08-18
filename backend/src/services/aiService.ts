import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Ensure the API key is set
if (!process.env.AI_API_KEY) {
  console.warn('Warning: AI_API_KEY is not set in the environment variables.');
}

const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      description: "A list of actionable tasks, assignments, or to-dos extracted from the email.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A short, concise title for the task." },
          description: { type: Type.STRING, description: "Additional details, links, or context." },
          dueDate: { type: Type.STRING, description: "Deadline in ISO 8601 format, or null." },
          priority: { type: Type.STRING, description: "'High', 'Medium', or 'Low'." },
          category: { type: Type.STRING, description: "'Education', 'Work', 'Finance', 'Personal', or 'Other'." }
        },
        required: ["title"]
      }
    },
    events: {
      type: Type.ARRAY,
      description: "A list of calendar events, meetings, or appointments extracted from the email.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Title of the event or meeting." },
          eventDate: { type: Type.STRING, description: "Date and time of the event in ISO 8601 format." },
          eventTime: { type: Type.STRING, description: "Human readable time string, e.g. '3:00 PM'." },
          location: { type: Type.STRING, description: "Location or virtual meeting link." }
        },
        required: ["title", "eventDate"]
      }
    },
    bills: {
      type: Type.ARRAY,
      description: "A list of financial bills, invoices, or subscriptions that need to be paid.",
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING, description: "Company or service name (e.g. 'Netflix', 'Electricity')." },
          amount: { type: Type.NUMBER, description: "The amount due. Provide a number only." },
          currency: { type: Type.STRING, description: "Currency symbol or code (e.g. '$', 'USD', 'EUR')." },
          dueDate: { type: Type.STRING, description: "The deadline for the bill in ISO 8601 format." },
          type: { type: Type.STRING, description: "'Utility', 'Subscription', 'Credit Card', or 'Other'." }
        },
        required: ["company"]
      }
    },
    isSpam: {
      type: Type.BOOLEAN,
      description: "True if the email appears to be spam, phishing, unwanted marketing, or generic newsletter."
    },
    needsReply: {
      type: Type.BOOLEAN,
      description: "True if the email is from a real person or company that requires a response (e.g., questions, meeting requests, client inquiries). False for newsletters, receipts, or automated alerts."
    },
    suggestedReplyText: {
      type: Type.STRING,
      description: "If needsReply is true, generate a professional, contextual draft response from the user. Otherwise, return an empty string."
    }
  }
};

export async function extractEntitiesFromEmail(subject: string, sender: string, body: string, date: Date) {
  try {
    const prompt = `
    Analyze the following email and extract any of the following if they exist:
    1. Tasks or action items that require the user to do something.
    2. Calendar events, meetings, flights, or appointments.
    3. Bills, invoices, or subscriptions that require payment.
    4. Determine if the email is spam/marketing.
    5. Determine if the email warrants a human response, and if so, draft a professional reply.
    
    If nothing is found for a category, return an empty array for that category.
    
    Email Date: ${date.toISOString()}
    From: ${sender}
    Subject: ${subject}
    Body:
    ${body}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: extractionSchema,
        temperature: 0.1,
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { tasks: [], events: [], bills: [] };
  } catch (error) {
    console.error('Error extracting entities with Gemini:', error);
    return { tasks: [], events: [], bills: [] };
  }
}
