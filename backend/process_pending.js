"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./src/db");
const emailWorker_1 = require("./src/workers/emailWorker");
async function main() {
    const pendingEmails = await db_1.prisma.email.findMany({
        where: { status: { in: ['PENDING', 'FAILED'] } }
    });
    console.log(`Found ${pendingEmails.length} pending emails.`);
    for (const email of pendingEmails) {
        try {
            await (0, emailWorker_1.processSingleEmail)(email.id);
        }
        catch (e) {
            console.error(e);
        }
    }
    console.log("Done processing all pending emails.");
}
main().catch(console.error).finally(() => db_1.prisma.$disconnect());
