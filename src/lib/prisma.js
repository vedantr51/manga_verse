// Prisma client for MangaVerse (Prisma 5)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma_mangaverse ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma_mangaverse = prisma;
}
