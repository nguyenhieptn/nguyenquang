/**
 * core/media — lời kể (FR-47 capture, FR-49 consent/sealing/withdrawal).
 *
 * Adapter surface. AD-24: NO identity parameters — every entry point resolves the session
 * itself, then opens the clan context. AD-12: the access tier is enforced here in the core at
 * read time; bytes leave ONLY through a 10-minute HMAC token minted by requestPlayback and
 * spent at app/api/media/stream/[token]. No storage URL is ever public or long-lived.
 *
 * Recording is browser-side: the client records fully, then uploads the finished file
 * (app/api/media/upload) — there is no intake session to manage.
 */
import { err, ok, type Result } from '@/core/types';
import { resolveSession, type SessionContext } from '@/core/identity/session';
import { withClanContext } from '@/db';
import {
  listRecordingsOp,
  requestPlaybackOp,
  saveRecordingOp,
  updateRecordingAccessOp,
  withdrawRecordingOp,
  type AccessTier,
  type RecordingMeta,
  type SaveRecordingInput,
} from './ops';
import { getStorage } from './storage';
import { verifyPlaybackToken } from './token';

export type { AccessTier, RecordingMeta, RecordingMime, SaveRecordingInput } from './ops';
export { ACCESS_TIERS, MAX_RECORDING_BYTES, RECORDING_MIMES } from './ops';
export { verifyPlaybackToken } from './token';

async function requireSession(): Promise<Result<SessionContext>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập trước đã.');
  return ok(session);
}

/** FR-47: any attached member records; storage first, then row + subjects + revision in one tx. */
export async function saveRecording(input: SaveRecordingInput): Promise<Result<{ recordingId: string }>> {
  const session = await requireSession();
  if (!session.ok) return err(session.error.code, session.error.message);
  return saveRecordingOp(session.value, input);
}

/** FR-47: radius-free metadata list, tier-filtered per AD-12 (see ops.ts header for the rules). */
export async function listRecordings(): Promise<Result<RecordingMeta[]>> {
  const session = await requireSession();
  if (!session.ok) return err(session.error.code, session.error.message);
  return withClanContext(session.value.clanId, (tx) => listRecordingsOp(tx, session.value));
}

/** AD-12: tier check now, then a 10-minute token — the only key that opens the stream route. */
export async function requestPlayback(recordingId: string): Promise<Result<{ token: string }>> {
  const session = await requireSession();
  if (!session.ok) return err(session.error.code, session.error.message);
  return withClanContext(session.value.clanId, (tx) => requestPlaybackOp(tx, session.value, recordingId));
}

/** FR-49: teller's attached account or admin. Withdrawal is forever and beats every tier. */
export async function withdrawRecording(recordingId: string): Promise<Result<void>> {
  const session = await requireSession();
  if (!session.ok) return err(session.error.code, session.error.message);
  return withClanContext(session.value.clanId, (tx) => withdrawRecordingOp(tx, session.value, recordingId));
}

/** FR-49: teller or admin re-tiers a recording; sealedUntil required iff sealing. */
export async function updateRecordingAccess(
  recordingId: string,
  tier: AccessTier,
  sealedUntil?: string,
): Promise<Result<void>> {
  const session = await requireSession();
  if (!session.ok) return err(session.error.code, session.error.message);
  return withClanContext(session.value.clanId, (tx) =>
    updateRecordingAccessOp(tx, session.value, recordingId, tier, sealedUntil),
  );
}

/**
 * Spend a playback token: verify, then read bytes from the storage port. The token IS the
 * authorization (the tier check already ran at mint time, against the session — AD-24/AD-12);
 * its 10-minute life bounds how long a withdrawal or re-seal can lag behind.
 */
export async function openPlaybackStream(
  token: string,
): Promise<Result<{ data: Buffer; mime: string }>> {
  const verified = verifyPlaybackToken(token);
  if (!verified) return err('forbidden', 'Vé nghe không hợp lệ hoặc đã quá hạn.');
  const stored = await getStorage().get(verified.recordingId);
  if (!stored) return err('not-found', 'Không thấy tệp ghi âm.');
  return ok(stored);
}
