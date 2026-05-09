import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  hotwordsPrisma?: PrismaClient;
};

export function getPrisma() {
  if (!globalForPrisma.hotwordsPrisma) {
    globalForPrisma.hotwordsPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });
  }

  return globalForPrisma.hotwordsPrisma;
}

export async function disconnectPrisma() {
  if (globalForPrisma.hotwordsPrisma) {
    await globalForPrisma.hotwordsPrisma.$disconnect();
    globalForPrisma.hotwordsPrisma = undefined;
  }
}
