/**
 * Better Auth React client (story 1-4) — for the UI phase (đăng nhập / gắn node screens).
 * Client-side only; talks to app/api/auth/[...all]. Same-origin baseURL by default.
 */
import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [usernameClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
