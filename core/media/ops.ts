/**
 * core/media/ops — internal operations: (tx, ctx, args). NOT importable by adapters.
 *
 * FR-47 capture, FR-49 consent/sealing/withdrawal. AD-11: bytes go to the storage port,
 * the DB keeps the handle. AD-12: the access tier is enforced HERE, at read time, for every
 * caller — metadata visibility and playback both derive from one rule set so no route can
 * disagree with another:
 *
 *   tier 'public'  → metadata + playback for any ATTACHED member. Guests get nothing —
 *                    recordings are family material.
 *   tier 'admin'   → metadata + playback only for admin | branch-head, the recorder, or the
 *                    teller('s attached account).
 *   tier 'sealed'  → metadata (title, teller, date, "niêm phong tới …") to admin only;
 *                    playback NEVER before sealedUntil — even for admin: the seal is the
 *                    teller's word, not an access level. After the date, admin may play.
 *   withdrawn      → FR-49 right of withdrawal, survives the teller's death: playback for
 *                    NOBODY, ever; metadata stays visible to admin marked "đã rút lại".
 *
 * AD-21 binds media metadata too: the teller's name is person data, so it leaves this module
 * only through the privacy radius (visibilityFor over core/tree's canonical graph), exactly
 * like a tree card. A living teller who is hidden or a minor reads as ANONYMOUS_LABEL to
 * anyone outside 3 bậc — the recording and its link stay, the person does not leak.
 *
 * saveRecording is the one op that manages its own transaction (exception to the (tx, …)
 * shape, documented here on purpose): bytes must be in storage BEFORE the row exists —
 * a row pointing at nothing is corruption, an orphaned object is garbage — so the flow is
 * storage.put → tx(row + subjects + revision) → on failure, best-effort storage.delete.
 */
import { desc, eq, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { withClanContext, type Tx } from '@/db';
import { person, recording, recordingSubject } from '@/db/schema';
import { writeRevision } from '@/core/revision';
import { ok, err, type Result } from '@/core/types';
import { ANONYMOUS_LABEL, PRIVACY_RADIUS, visibilityFor } from '@/core/identity/privacy';
import type { SessionContext } from '@/core/identity/session';
import { bfsDistances, loadTreeData } from '@/core/tree/ops';
import { getStorage } from './storage';
import { mintPlaybackToken } from './token';
import { coQuyenDuyet } from '@/core/identity/privacy';
import { gateWriter } from '@/core/identity/gates';

export const RECORDING_MIMES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'] as const;
export type RecordingMime = (typeof RECORDING_MIMES)[number];

export const ACCESS_TIERS = ['public', 'admin', 'sealed'] as const;
export type AccessTier = (typeof ACCESS_TIERS)[number];

/** FR-47: 100MB cap — a couple of hours of Opus; anything bigger is not a lời kể upload. */
export const MAX_RECORDING_BYTES = 100 * 1024 * 1024;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type SaveRecordingInput = {
  bytes: Buffer;
  mime: string;
  title: string;
  /** Ai kể — a person node; may be unset when the teller is not (yet) in the tree. */
  toldByPersonId?: string;
  /** Nói về ai — zero or more person nodes. */
  subjectPersonIds: string[];
  /** ISO date YYYY-MM-DD. */
  recordedOn: string;
  durationSeconds?: number;
  accessTier: AccessTier;
  /** Required iff accessTier === 'sealed'. ISO date. */
  sealedUntil?: string;
};

/** Radius-free metadata (FR-47 list) — but tier-filtered per AD-12 before it leaves the core. */
export type RecordingMeta = {
  recordingId: string;
  title: string;
  /** The teller's node — kept even when the name is withheld: the link is not the name. */
  toldByPersonId: string | null;
  /** Privacy-filtered (AD-13/AD-21): ANONYMOUS_LABEL when this viewer may not know who. */
  toldByName: string | null;
  recordedOn: string;
  durationSeconds: number | null;
  accessTier: AccessTier;
  sealedUntil: string | null;
  withdrawn: boolean;
  /** Playback available to THIS viewer right now — mirrors requestPlayback exactly. */
  playable: boolean;
  /** UI status string: 'niêm phong tới …' | 'đã rút lại' | null. */
  statusLabel: string | null;
  subjectPersonIds: string[];
  createdAt: string;
};

type RecordingRow = typeof recording.$inferSelect;

// ── The one rule set (AD-12) ────────────────────────────────────────────────────────────────

function isApprover(ctx: SessionContext): boolean {
  return coQuyenDuyet(ctx);
}

/** Recorder, or the teller's own attached account. */
function isOwn(ctx: SessionContext, row: RecordingRow): boolean {
  if (row.recordedByAccountId === ctx.accountId) return true;
  return ctx.personId !== null && row.toldByPersonId !== null && row.toldByPersonId === ctx.personId;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function canSeeMetadata(ctx: SessionContext, row: RecordingRow): boolean {
  if (row.withdrawnAt) return ctx.role === 'admin';
  switch (row.accessTier) {
    case 'public':
      return ctx.personId !== null;
    case 'admin':
      return isApprover(ctx) || isOwn(ctx, row);
    case 'sealed':
      return ctx.role === 'admin';
  }
}

/** Why playback is denied, or null when it may proceed. One function for list AND playback. */
function playbackDenial(ctx: SessionContext, row: RecordingRow): string | null {
  if (row.withdrawnAt) return 'đã rút lại — không phát cho bất kỳ ai';
  switch (row.accessTier) {
    case 'public':
      return ctx.personId !== null ? null : 'chỉ người đã gắn vào phả mới nghe được';
    case 'admin':
      return isApprover(ctx) || isOwn(ctx, row) ? null : 'lời kể giới hạn người trông coi';
    case 'sealed': {
      if (!row.sealedUntil || todayIso() < row.sealedUntil) {
        return `niêm phong tới ${row.sealedUntil ?? '?'} — chưa tới hạn mở`;
      }
      return ctx.role === 'admin' ? null : 'lời kể giới hạn người trông coi';
    }
  }
}

function statusLabel(row: RecordingRow): string | null {
  if (row.withdrawnAt) return 'đã rút lại';
  if (row.accessTier === 'sealed' && row.sealedUntil) return `niêm phong tới ${row.sealedUntil}`;
  return null;
}

// ── FR-47: save ─────────────────────────────────────────────────────────────────────────────

function validateSaveInput(ctx: SessionContext, input: SaveRecordingInput): Result<void> {
  // Any ATTACHED member may record; an account without a node may not (AD-8) — qua cổng (7-1).
  const gate = gateWriter(ctx);
  if (!gate.ok) return gate;
  if (!(RECORDING_MIMES as readonly string[]).includes(input.mime)) {
    return err('invalid', `Định dạng âm thanh không nhận: ${input.mime}`);
  }
  if (input.bytes.byteLength === 0) return err('invalid', 'Tệp ghi âm rỗng.');
  if (input.bytes.byteLength > MAX_RECORDING_BYTES) {
    return err('invalid', 'Tệp ghi âm vượt quá 100MB.');
  }
  if (!ISO_DATE_RE.test(input.recordedOn) || Number.isNaN(Date.parse(input.recordedOn))) {
    return err('invalid', 'Ngày thu không hợp lệ.');
  }
  if (!(ACCESS_TIERS as readonly string[]).includes(input.accessTier)) {
    return err('invalid', `Mức chia sẻ không nhận: ${input.accessTier}`);
  }
  if (input.accessTier === 'sealed') {
    if (!input.sealedUntil || !ISO_DATE_RE.test(input.sealedUntil) || Number.isNaN(Date.parse(input.sealedUntil))) {
      return err('invalid', 'Niêm phong cần ngày mở hợp lệ.');
    }
  } else if (input.sealedUntil !== undefined) {
    return err('invalid', 'Ngày mở niêm phong chỉ đi cùng mức niêm phong.');
  }
  if (
    input.durationSeconds !== undefined &&
    (!Number.isInteger(input.durationSeconds) || input.durationSeconds <= 0)
  ) {
    return err('invalid', 'Thời lượng không hợp lệ.');
  }
  const personIds = [...input.subjectPersonIds, ...(input.toldByPersonId ? [input.toldByPersonId] : [])];
  for (const id of personIds) {
    if (!UUID_RE.test(id)) return err('invalid', 'Mã người không hợp lệ.');
  }
  return ok(undefined);
}

/**
 * Storage first, then row + subject rows + revision in ONE transaction (AD-10);
 * on transaction failure the stored object is best-effort deleted. Opens its own
 * transaction — see the file header for why this op cannot take a tx.
 */
export async function saveRecordingOp(
  ctx: SessionContext,
  input: SaveRecordingInput,
): Promise<Result<{ recordingId: string }>> {
  const valid = validateSaveInput(ctx, input);
  if (!valid.ok) return err(valid.error.code, valid.error.message);

  const storage = getStorage();
  const recordingId = uuidv7();
  // Storage key = recording id: uuid-based (no user input), and the stream route can go from
  // a verified token straight to the object.
  await storage.put(recordingId, input.bytes, input.mime);

  let result: Result<{ recordingId: string }>;
  try {
    result = await withClanContext(ctx.clanId, async (tx) => {
      const wanted = [
        ...new Set([...(input.toldByPersonId ? [input.toldByPersonId] : []), ...input.subjectPersonIds]),
      ];
      if (wanted.length > 0) {
        const found = await tx.select({ id: person.id }).from(person).where(inArray(person.id, wanted));
        if (found.length !== wanted.length) {
          return err('invalid', 'Có người được nhắc tới không có trong phả.');
        }
      }

      const row = {
        id: recordingId,
        clanId: ctx.clanId,
        toldByPersonId: input.toldByPersonId ?? null,
        recordedByAccountId: ctx.accountId,
        recordedOn: input.recordedOn,
        durationSeconds: input.durationSeconds ?? null,
        storageKey: recordingId,
        mimeType: input.mime,
        accessTier: input.accessTier,
        sealedUntil: input.accessTier === 'sealed' ? input.sealedUntil! : null,
        title: input.title.trim(),
      };
      await tx.insert(recording).values(row);

      const subjectIds = [...new Set(input.subjectPersonIds)];
      if (subjectIds.length > 0) {
        await tx.insert(recordingSubject).values(
          subjectIds.map((personId) => ({
            id: uuidv7(),
            clanId: ctx.clanId,
            recordingId,
            personId,
          })),
        );
      }

      await writeRevision(tx, {
        clanId: ctx.clanId,
        accountId: ctx.accountId,
        entity: 'recording',
        entityId: recordingId,
        action: 'create',
        after: { ...row, subjectPersonIds: subjectIds },
      });

      return ok({ recordingId });
    });
  } catch (e) {
    await storage.delete(recordingId).catch(() => {});
    throw e;
  }
  if (!result.ok) await storage.delete(recordingId).catch(() => {});
  return result;
}

// ── AD-13/AD-21: the teller is a person, so the teller's name goes through the radius ───────

/**
 * Distances from the viewer's node over core/tree's canonical AD-13 graph (live parent-child +
 * union edges of any tier, tombstones redirected), capped at PRIVACY_RADIUS; `get` returns null
 * for unknown or beyond — exactly what visibilityFor expects. Same helper shape as core/audit;
 * cross-module ops calls inside one transaction are the sanctioned core layering.
 */
async function viewerDistances(
  tx: Tx,
  viewerPersonId: string,
): Promise<{ get(personId: string): number | null }> {
  const data = await loadTreeData(tx);
  const from = data.redirect(viewerPersonId);
  const dist = from ? bfsDistances(data, from, PRIVACY_RADIUS) : new Map<string, number>();
  return {
    get(personId: string): number | null {
      const to = data.redirect(personId);
      return to !== null ? (dist.get(to) ?? null) : null;
    },
  };
}

// ── FR-47: list (tier-filtered metadata, AD-12) ─────────────────────────────────────────────

export async function listRecordingsOp(tx: Tx, ctx: SessionContext): Promise<Result<RecordingMeta[]>> {
  const rows = await tx
    .select({
      rec: recording,
      tellerName: person.fullName,
      tellerIsLiving: person.isLiving,
      tellerBirthDate: person.birthDate,
      tellerHidden: person.hiddenFromPublic,
    })
    .from(recording)
    .leftJoin(person, eq(recording.toldByPersonId, person.id))
    .orderBy(desc(recording.createdAt), desc(recording.id));

  const visible = rows.filter((r) => canSeeMetadata(ctx, r.rec));

  // The walk is the expensive part, so it runs only when it can change an answer: the dead and
  // privileged viewers are 'full' regardless, and a viewer with no node is outside every radius.
  const privileged = coQuyenDuyet(ctx);
  const viewerNode = ctx.personId;
  const dist =
    !privileged && viewerNode !== null && visible.some((r) => r.tellerIsLiving === true)
      ? await viewerDistances(tx, viewerNode)
      : null;

  const tellerNameOf = (r: (typeof visible)[number]): string | null => {
    const id = r.rec.toldByPersonId;
    // No teller node (the teller is not in the tree), or the row is gone: no name to filter.
    if (id === null || r.tellerIsLiving === null) return null;
    const vis = visibilityFor(
      { role: ctx.role, personId: viewerNode },
      {
        personId: id,
        isLiving: r.tellerIsLiving,
        birthDate: r.tellerBirthDate,
        hiddenFromPublic: r.tellerHidden ?? false,
      },
      dist ? dist.get(id) : null,
    );
    return vis === 'anonymous' ? ANONYMOUS_LABEL : r.tellerName;
  };

  const subjectsByRecording = new Map<string, string[]>();
  const ids = visible.map((r) => r.rec.id);
  if (ids.length > 0) {
    const subjects = await tx
      .select({ recordingId: recordingSubject.recordingId, personId: recordingSubject.personId })
      .from(recordingSubject)
      .where(inArray(recordingSubject.recordingId, ids));
    for (const s of subjects) {
      const list = subjectsByRecording.get(s.recordingId) ?? [];
      list.push(s.personId);
      subjectsByRecording.set(s.recordingId, list);
    }
  }

  return ok(
    visible.map((r) => {
      const rec = r.rec;
      return {
        recordingId: rec.id,
        title: rec.title,
        toldByPersonId: rec.toldByPersonId,
        toldByName: tellerNameOf(r),
        recordedOn: rec.recordedOn,
        durationSeconds: rec.durationSeconds,
        accessTier: rec.accessTier,
        sealedUntil: rec.sealedUntil,
        withdrawn: rec.withdrawnAt !== null,
        playable: playbackDenial(ctx, rec) === null,
        statusLabel: statusLabel(rec),
        subjectPersonIds: subjectsByRecording.get(rec.id) ?? [],
        createdAt: rec.createdAt.toISOString(),
      };
    }),
  );
}

// ── AD-12: playback token ───────────────────────────────────────────────────────────────────

/**
 * THE playback gate: reload the row, run playbackDenial against it. Both ends of the ticket go
 * through here — minting one (requestPlaybackOp) and spending one (index.openPlaybackStream) —
 * so a withdrawal or a re-seal lands on the very next byte request instead of waiting out the
 * ticket's ten minutes. FR-49 withdrawal is forever; "forever, in about ten minutes" is not it.
 */
export async function checkPlaybackOp(
  tx: Tx,
  ctx: SessionContext,
  recordingId: string,
): Promise<Result<void>> {
  if (!UUID_RE.test(recordingId)) return err('invalid', 'Mã lời kể không hợp lệ.');
  const [row] = await tx.select().from(recording).where(eq(recording.id, recordingId));
  if (!row) return err('not-found', 'Không thấy lời kể này.');
  const denial = playbackDenial(ctx, row);
  if (denial !== null) return err('forbidden', denial);
  return ok(undefined);
}

export async function requestPlaybackOp(
  tx: Tx,
  ctx: SessionContext,
  recordingId: string,
): Promise<Result<{ token: string }>> {
  const gate = await checkPlaybackOp(tx, ctx, recordingId);
  if (!gate.ok) return err(gate.error.code, gate.error.message);
  return ok({ token: mintPlaybackToken(recordingId, ctx.clanId) });
}

// ── FR-49: withdrawal — survives death, blocks playback for everyone, forever ───────────────

export async function withdrawRecordingOp(
  tx: Tx,
  ctx: SessionContext,
  recordingId: string,
): Promise<Result<void>> {
  if (!UUID_RE.test(recordingId)) return err('invalid', 'Mã lời kể không hợp lệ.');
  const [row] = await tx.select().from(recording).where(eq(recording.id, recordingId));
  if (!row) return err('not-found', 'Không thấy lời kể này.');
  const isTeller = ctx.personId !== null && row.toldByPersonId === ctx.personId;
  if (!isTeller && ctx.role !== 'admin') {
    return err('forbidden', 'Chỉ người kể hoặc người trông coi mới rút lại được.');
  }
  if (row.withdrawnAt) return err('conflict', 'Lời kể này đã rút lại rồi.');

  const withdrawnAt = new Date();
  await tx.update(recording).set({ withdrawnAt }).where(eq(recording.id, recordingId));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'recording',
    entityId: recordingId,
    action: 'withdraw',
    before: { withdrawnAt: null },
    after: { withdrawnAt: withdrawnAt.toISOString() },
  });
  return ok(undefined);
}

// ── FR-49: teller (or admin) adjusts the access tier ────────────────────────────────────────

export async function updateRecordingAccessOp(
  tx: Tx,
  ctx: SessionContext,
  recordingId: string,
  tier: AccessTier,
  sealedUntil?: string,
): Promise<Result<void>> {
  if (!UUID_RE.test(recordingId)) return err('invalid', 'Mã lời kể không hợp lệ.');
  if (!(ACCESS_TIERS as readonly string[]).includes(tier)) {
    return err('invalid', `Mức chia sẻ không nhận: ${tier}`);
  }
  if (tier === 'sealed') {
    if (!sealedUntil || !ISO_DATE_RE.test(sealedUntil) || Number.isNaN(Date.parse(sealedUntil))) {
      return err('invalid', 'Niêm phong cần ngày mở hợp lệ.');
    }
  } else if (sealedUntil !== undefined) {
    return err('invalid', 'Ngày mở niêm phong chỉ đi cùng mức niêm phong.');
  }

  const [row] = await tx.select().from(recording).where(eq(recording.id, recordingId));
  if (!row) return err('not-found', 'Không thấy lời kể này.');
  const isTeller = ctx.personId !== null && row.toldByPersonId === ctx.personId;
  if (!isTeller && ctx.role !== 'admin') {
    return err('forbidden', 'Chỉ người kể hoặc người trông coi mới đổi mức chia sẻ được.');
  }
  if (row.withdrawnAt) return err('conflict', 'Lời kể đã rút lại — không đổi mức chia sẻ nữa.');

  const next = { accessTier: tier, sealedUntil: tier === 'sealed' ? sealedUntil! : null };
  await tx.update(recording).set(next).where(eq(recording.id, recordingId));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'recording',
    entityId: recordingId,
    action: 'update',
    before: { accessTier: row.accessTier, sealedUntil: row.sealedUntil },
    after: next,
  });
  return ok(undefined);
}
