import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      process.env.POSTGRES_PRISMA_URL ??
      "",
  },
});
