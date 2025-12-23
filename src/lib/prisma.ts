import 'server-only';
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
// Adjust relative path for runtime execution from project root
const connectionUrl = url.startsWith("file:./") && !url.includes("prisma/")
    ? url.replace("file:./", "file:./prisma/")
    : url;

const adapter = new PrismaLibSql({
    url: connectionUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
