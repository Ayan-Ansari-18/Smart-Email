import { prisma } from './src/db';
async function main() {
  const count = await prisma.email.count();
  console.log("TOTAL EMAILS:", count);
}
main().finally(() => prisma.$disconnect());
