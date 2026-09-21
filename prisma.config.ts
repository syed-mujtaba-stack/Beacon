import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma ORM v7 CLI config.
 * - `schema`: points to the Prisma schema.
 * - `migrations`: stores migration files + runs the seed script.
 * - `datasource.url`: used by CLI commands (`migrate`, `db push`, `studio`).
 *   Use the DIRECT (non-pooled) Neon connection string for CLI commands.
 *   `DIRECT_URL` falls back to `DATABASE_URL`. We intentionally don't use the
 *   `env()` helper so `prisma generate` works in CI even without a database.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});