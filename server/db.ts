import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";
import { env } from "./env.js";

neonConfig.webSocketConstructor = ws;

const connectionString = env.APP_DATABASE_URL ?? env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "APP_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
