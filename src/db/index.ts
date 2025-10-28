import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Guard against missing DATABASE_URL early to avoid confusing runtime errors
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Throwing here fails fast on server startup
  throw new Error('DATABASE_URL is not set. Please configure it in .env.local');
}

// For local dev we typically don't need SSL; in production you may set ?sslmode=require
const client = postgres(connectionString);

export const db = drizzle(client, { schema });

export type Database = typeof db;