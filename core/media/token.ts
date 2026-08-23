/**
 * Time-limited playback tokens (AD-12): the ONLY way bytes leave the system.
 *
 * No storage URL is ever public or long-lived. `requestPlayback` (ops.ts) runs the tier check
 * and mints one of these; the stream route verifies it and serves bytes. The token authorizes
 * exactly one recording for TOKEN_TTL_MS — it carries no identity, because the check already
 * happened in the core at mint time against the session (AD-24).
 *
 * Shape: base64url(recordingId:expMillis) + '.' + base64url(HMAC-SHA256(payload, secret)).
 * Secret = BETTER_AUTH_SECRET (one secret to rotate, rotating it invalidates live tokens —
 * acceptable for a 10-minute lifetime).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const TOKEN_TTL_MS = 10 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error('BETTER_AUTH_SECRET not set — playback tokens cannot be signed');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Internal to core/media — only requestPlayback mints. `ttlMs` overridable for tests. */
export function mintPlaybackToken(recordingId: string, ttlMs: number = TOKEN_TTL_MS): string {
  const exp = Date.now() + ttlMs;
  const payload = Buffer.from(`${recordingId}:${exp}`, 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** Verify signature + expiry. Returns the recording id, or null for anything off. */
export function verifyPlaybackToken(token: string): { recordingId: string } | null {
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  const sep = decoded.lastIndexOf(':');
  if (sep <= 0) return null;
  const recordingId = decoded.slice(0, sep);
  const exp = Number(decoded.slice(sep + 1));
  if (!UUID_RE.test(recordingId)) return null;
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  return { recordingId };
}
