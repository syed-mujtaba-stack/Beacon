import "server-only";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Singleton Prisma Client for the whole serverless process.
 * The client is constructed lazily on first use so `next build` and module
 * imports never touch the database. Missing `DATABASE_URL` produces a clear
 * error at the first query instead of crashing at import time.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Create a Neon database (https://neon.tech) and add DATABASE_URL to your environment.",
    );
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Lazy singleton proxy — the real client (and its Neon connection) is only
 * created on the first property access inside a request handler.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});