import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function createPrismaClient() {
    // Only create if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
        console.warn("DATABASE_URL not configured - database features disabled");
        return null;
    }
    return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
    globalForPrisma.prisma = prisma;
}
