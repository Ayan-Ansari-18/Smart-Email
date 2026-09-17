"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./src/db");
async function main() {
    const count = await db_1.prisma.email.count();
    console.log("TOTAL EMAILS:", count);
}
main().finally(() => db_1.prisma.$disconnect());
