/**
 * Better Auth handler (story 1-4) — the account layer's only HTTP surface (AD-8).
 * Adapter only: everything flows through core/identity (AD-1).
 */
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/core/identity';

export const { GET, POST } = toNextJsHandler(auth.handler);
