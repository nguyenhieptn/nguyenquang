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
    // (Không cần `eslint-disable`: luật `no-restricted-syntax` chặn `process.env` ở `app/` và
    // `components/`, không chạm tệp cấu hình ở gốc. Chỉ thị thừa làm `npm run lint` cảnh báo.)
    url: process.env.DATABASE_URL_OWNER ?? '',
  },
  strict: true,
  verbose: true,
});
