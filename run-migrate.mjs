import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Load env
const envFile = readFileSync('/home/ubuntu/workout-plan/.env', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

console.log('Connecting to database...');
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log('Running migrations...');
try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations applied successfully!');
} catch (err) {
  console.error('Migration error:', err.message);
  // If already applied, that's fine
  if (err.message?.includes('already exists') || err.message?.includes('Duplicate')) {
    console.log('Columns already exist - migration was already applied manually.');
  } else {
    process.exit(1);
  }
}

await connection.end();
