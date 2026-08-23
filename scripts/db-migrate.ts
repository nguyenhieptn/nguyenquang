/** Migration runner — chạy bằng giapha_owner. `npm run db:migrate`. */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL_OWNER;
if (!url) throw new Error('DATABASE_URL_OWNER not set');
const pool = new Pool({ connectionString: url, max: 1 });

migrate(drizzle(pool), { migrationsFolder: './db/migrations' })
  .then(() => {
    console.log('migrations applied');
    return pool.end();
  })
  .catch((e) => {
    console.error('MIGRATION FAILED:', e);
    process.exit(1);
  });
