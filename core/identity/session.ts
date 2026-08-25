/**
 * AD-24 — the core reads identity from the session; it NEVER accepts it as an argument.
 *
 * No exposed core operation takes clan, viewer node, or role as a parameter. Instead every
 * `core/<module>/index.ts` entry point starts with `resolveSession()` / `requireAttached()`,
 * then opens `withClanContext(session.clanId, ...)` itself.
 *
 * Layering rule (documented in docs/build-contract.md): the internal `ops.ts` files DO take a
 * `SessionContext` — but they are internal to core and not importable by adapters. Only
 * `index.ts` surfaces are. Tests may exercise ops directly with a fabricated context.
 *
 * Single-clan era: PRD NFR-7 keeps one clan in the data. clanId comes from DATA, never a
 * constant (AD-14) — cụ thể là bảng `clan` trong database, đọc qua `soleClanId()`. Tài khoản đã
 * gắn node thì `attachment` cấp thêm `personId` và `role`; tài khoản chưa gắn, và khách vãng
 * lai, vẫn đứng trong đúng dòng họ ấy để đọc phần công khai.
 *
 * (Trước 25/08/2026 id nằm ở biến môi trường `GIAPHA_CLAN_ID`, và chú thích chỗ này từng ghi là
 * "attachment đặt tên cho clan" — không đúng với mã lúc ấy. Nay cả hai đã khớp.)
 */
import { cache } from 'react';
import { headers } from 'next/headers';

export type Role = 'admin' | 'branch-head' | 'member' | 'guest';

export type SessionContext = {
  accountId: string;
  clanId: string;
  /** Node attachment — null until vouched (AD-8). A permanent possible state, not a transition. */
  personId: string | null;
  role: Role;
};

/** Guest view of the sole clan — for public, unauthenticated reads (FR-11: xem không cần đăng ký). */
export type GuestContext = {
  accountId: null;
  clanId: string;
  personId: null;
  role: 'guest';
};

export type ViewerContext = SessionContext | GuestContext;

/**
 * Resolve the authenticated session, or null. Implemented over Better Auth in auth.ts
 * (identity module). Wrapped in React cache() per request.
 */
export const resolveSession: () => Promise<SessionContext | null> = cache(async () => {
  const { resolveSessionImpl } = await import('./auth');
  return resolveSessionImpl(await headers());
});

/** Viewer context that always exists: session if any, else guest scoped to the sole clan. */
export const resolveViewer: () => Promise<ViewerContext | null> = cache(async () => {
  const session = await resolveSession();
  if (session) return session;
  const { guestContextImpl } = await import('./auth');
  return guestContextImpl();
});
