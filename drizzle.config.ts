import { defineConfig } from 'drizzle-kit';

/**
 * Migrations run as giapha_owner (DATABASE_URL_OWNER) — the app role must not own tables
 * or FORCE RLS would not bind it (AD-20). `npm run db:generate` / `npm run db:migrate`.
 */
export default defineConfig({
  schema: './db/schema',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // eslint-disable-next-line no-restricted-syntax
    url: process.env.DATABASE_URL_OWNER ?? '',
  },
  strict: true,
  verbose: true,
});
