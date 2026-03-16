import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    'DATABASE_URL not set. Database features will be unavailable. ' +
    'The app can still run using local snapshot data.',
  );
}

const client = connectionString ? postgres(connectionString) : null;

export const db = client ? drizzle(client) : null;
