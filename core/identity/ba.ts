/**
 * Better Auth instance — the ACCOUNT layer only (AD-8). It proves control of an email or
 * social identity; it grants no genealogy access. Membership, role, and privacy radius come
 * from `attachment` (clan-partitioned, vouched) — see auth.ts / attachment.ts.
 *
 * Storage: drizzleAdapter over `dbGlobal` (identity tables carry no clanId and no RLS —
 * db/schema/auth.ts). The schema map hands Better Auth our table objects under the model
 * names it expects (`user`, `session`, `account`, `verification`) — the shapes were dumped
 * from `getAuthTables({ plugins: [username()] })` and must stay in sync with the plugin list
 * here.
 *
 * Google sign-in: structure ready, active ONLY when GOOGLE_CLIENT_ID/SECRET exist in the
 * environment (PRD allows deferring the provider registration).
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins/username';
import { dbGlobal } from '@/db';
import { authAccount, authSession, authUser, authVerification } from '@/db/schema';

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

/**
 * ── Origin được tin, ngoài `baseURL` ────────────────────────────────────────────────────────
 *
 * Better Auth chỉ kiểm origin khi request CÓ COOKIE
 * (`node_modules/better-auth/dist/api/middlewares/origin-check.mjs`: `if (!(forceValidate ||
 * useCookies)) return;`). Đó là chỗ nó cắn, vì nó làm lỗi trông như ngẫu nhiên:
 *
 *   · phiên sạch (curl, Playwright mới mở, tab ẩn danh) ⇒ không cookie ⇒ **200**;
 *   · trình duyệt đã từng vào phả ⇒ có cookie ⇒ kiểm bật ⇒ **403 INVALID_ORIGIN**.
 *
 * Và cookie **không phân biệt cổng**: đã vào `:3000` một lần thì trình duyệt gửi cookie ấy sang
 * `:3100` cùng host. Nên một bản dựng tạm ở cổng khác (bộ đo giao diện, `docs/van-hanh.md § Bộ đo`)
 * đăng nhập được từ máy sạch mà **403 với đúng người đang cần dùng nó**. Đo được 28/08/2026.
 *
 * Khai thêm bằng `BETTER_AUTH_TRUSTED_ORIGINS`, ngăn cách bằng dấu phẩy. KHÔNG có ký tự đại diện
 * và không có mặc định: mỗi origin phải được viết ra một cách có chủ ý.
 */
const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  ...(trustedOrigins.length > 0 ? { trustedOrigins } : {}),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(dbGlobal, {
    provider: 'pg',
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
    },
  }),
  emailAndPassword: { enabled: true },
  plugins: [username()],
  socialProviders:
    googleId && googleSecret
      ? { google: { clientId: googleId, clientSecret: googleSecret } }
      : {},
  telemetry: { enabled: false },
});
