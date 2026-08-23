/**
 * Shared core conventions (Consistency Conventions, ARCHITECTURE-SPINE.md):
 * the core returns typed results — it does not throw for expected outcomes.
 * Adapters translate these to HTTP / UI states.
 */

export type CoreErrorCode =
  | 'not-found'
  | 'forbidden' // viewer lacks the right (approval, radius, tier)
  | 'unauthenticated' // no session at all
  | 'unattached' // has account, no clan node (a PERMANENT state — adapters route to gắn node)
  | 'invalid' // input failed validation
  | 'conflict'; // state no longer allows the operation (e.g. already merged)

export type CoreError = { code: CoreErrorCode; message: string };

export type Result<T> = { ok: true; value: T } | { ok: false; error: CoreError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(code: CoreErrorCode, message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});
