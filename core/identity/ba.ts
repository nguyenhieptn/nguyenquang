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

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
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
