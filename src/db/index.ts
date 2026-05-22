import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cachedDb: ReturnType<typeof createDb> | null = null;

function getMaxConnections() {
  const configuredMax = Number.parseInt(
    process.env.DATABASE_MAX_CONNECTIONS ?? "",
    10,
  );

  if (Number.isInteger(configuredMax) && configuredMax > 0) {
    return configuredMax;
  }

  return process.env.NODE_ENV === "production" ? 1 : 3;
}

function createDb() {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL is required to initialize Drizzle.",
    );
  }

  const queryClient = postgres(connectionString, {
    idle_timeout: 10,
    max: getMaxConnections(),
    prepare: false,
  });

  return drizzle(queryClient, { schema });
}

export function isDatabaseConfigured() {
  return Boolean(
    process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      process.env.POSTGRES_PRISMA_URL,
  );
}

export function getDb() {
  cachedDb ??= createDb();
  return cachedDb;
}
