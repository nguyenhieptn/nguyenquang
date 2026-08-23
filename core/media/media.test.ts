/**
 * Story 1-5 — core/media (FR-47, FR-49; AD-11, AD-12) against the real database.
 *
 * Pattern follows core/gates/rls.gate.test.ts: fresh uuidv7 clan per run, seeding under
 * withClanContext, cleanup via ownerPool with SET LOCAL per clan. Ops are exercised directly
 * with fabricated SessionContexts (the documented core layering — index.ts needs Better Auth,
 * story 1-4). All test data is prefixed "1-5".
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { and, eq } from 'drizzle-orm';
import { withClanContext, ownerPool, type Tx } from '@/db';
import { clan, person, revision } from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import type { SessionContext } from '@/core/identity/session';
import {
  MAX_RECORDING_BYTES,
  listRecordingsOp,
  requestPlaybackOp,
  saveRecordingOp,
  updateRecordingAccessOp,
  withdrawRecordingOp,
  type SaveRecordingInput,
} from './ops';
import { mintPlaybackToken, verifyPlaybackToken } from './token';
import { getStorage } from './storage';

const owner = ownerPool();
const storage = getStorage();

const clanId = uuidv7();
const tellerId = uuidv7();
const subjectId = uuidv7();
const recorderPersonId = uuidv7();
const memberPersonId = uuidv7();
const adminPersonId = uuidv7();

const recorderCtx: SessionContext = {
  accountId: '1-5-acc-recorder',
  clanId,
  personId: recorderPersonId,
  role: 'member',
};
const memberCtx: SessionContext = {
  accountId: '1-5-acc-member',
  clanId,
  personId: memberPersonId,
  role: 'member',
};
const tellerCtx: SessionContext = {
  accountId: '1-5-acc-teller',
  clanId,
  personId: tellerId,
  role: 'member',
};
const adminCtx: SessionContext = {
  accountId: '1-5-acc-admin',
  clanId,
  personId: adminPersonId,
  role: 'admin',
};
const unattachedCtx: SessionContext = {
  accountId: '1-5-acc-unattached',
  clanId,
  personId: null,
  role: 'member',
};

/** Keys written to storage this run — removed in afterAll. */
const storedKeys: string[] = [];

const inClan = <T>(fn: (tx: Tx) => Promise<T>) => withClanContext(clanId, fn);

function baseInput(overrides: Partial<SaveRecordingInput> = {}): SaveRecordingInput {
  return {
    bytes: Buffer.from('1-5 tiny webm bytes'),
    mime: 'audio/webm',
    title: '1-5 Chuyện ông kể',
    toldByPersonId: tellerId,
    subjectPersonIds: [subjectId],
    recordedOn: '2026-08-20',
    durationSeconds: 42,
    accessTier: 'public',
    ...overrides,
  };
}

async function save(ctx: SessionContext, overrides: Partial<SaveRecordingInput> = {}) {
  const result = await saveRecordingOp(ctx, baseInput(overrides));
  if (result.ok) storedKeys.push(result.value.recordingId);
  return result;
}

beforeAll(async () => {
  await inClan(async (tx) => {
    await tx.insert(clan).values({ id: clanId, name: '1-5 Clan Lời Kể' });
    const people = [
      { id: tellerId, name: '1-5 Ông Kể Chuyện' },
      { id: subjectId, name: '1-5 Người Được Nhắc' },
      { id: recorderPersonId, name: '1-5 Cháu Ghi Âm' },
      { id: memberPersonId, name: '1-5 Thành Viên Thường' },
      { id: adminPersonId, name: '1-5 Người Trông Coi' },
    ];
    await tx.insert(person).values(
      people.map((p) => ({ id: p.id, clanId, fullName: p.name, nameFolded: chuanHoa(p.name) })),
    );
  });
});

afterAll(async () => {
  for (const key of storedKeys) {
    await storage.delete(key).catch(() => {});
  }
  await owner.query('BEGIN');
  await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
  for (const table of ['recording_subject', 'recording', 'revision', 'person', 'clan']) {
    const col = table === 'clan' ? 'id' : 'clan_id';
    await owner.query(`DELETE FROM "${table}" WHERE ${col} = $1`, [clanId]);
  }
  await owner.query('COMMIT');
  await owner.end();
});

describe('saveRecording + listRecordings (FR-47)', () => {
  it('an attached member saves; bytes land in storage; the list shows metadata + revision written', async () => {
    const saved = await save(recorderCtx, { accessTier: 'public' });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const { recordingId } = saved.value;

    // AD-11: bytes live behind the storage port, keyed by the recording id.
    const stored = await storage.get(recordingId);
    expect(stored).not.toBeNull();
    expect(stored!.data.toString()).toBe('1-5 tiny webm bytes');
    expect(stored!.mime).toBe('audio/webm');

    // AD-10: revision in the same transaction as the row.
    const revs = await inClan((tx) =>
      tx
        .select()
        .from(revision)
        .where(and(eq(revision.entity, 'recording'), eq(revision.entityId, recordingId))),
    );
    expect(revs.map((r) => r.action)).toEqual(['create']);

    // Another attached member sees the public row with teller name + subjects.
    const list = await inClan((tx) => listRecordingsOp(tx, memberCtx));
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    const meta = list.value.find((m) => m.recordingId === recordingId);
    expect(meta).toBeTruthy();
    expect(meta!.title).toBe('1-5 Chuyện ông kể');
    expect(meta!.toldByName).toBe('1-5 Ông Kể Chuyện');
    expect(meta!.subjectPersonIds).toEqual([subjectId]);
    expect(meta!.playable).toBe(true);
    expect(meta!.statusLabel).toBeNull();
  });

  it('rejects guests/unattached and invalid input (mime, size, sealed-without-date)', async () => {
    const unattached = await save(unattachedCtx);
    expect(unattached.ok).toBe(false);
    if (!unattached.ok) expect(unattached.error.code).toBe('unattached');

    const badMime = await save(recorderCtx, { mime: 'video/mp4' });
    expect(badMime.ok).toBe(false);
    if (!badMime.ok) expect(badMime.error.code).toBe('invalid');

    const tooBig = await save(recorderCtx, { bytes: Buffer.alloc(MAX_RECORDING_BYTES + 1) });
    expect(tooBig.ok).toBe(false);
    if (!tooBig.ok) expect(tooBig.error.code).toBe('invalid');

    const sealedNoDate = await save(recorderCtx, { accessTier: 'sealed', sealedUntil: undefined });
    expect(sealedNoDate.ok).toBe(false);
    if (!sealedNoDate.ok) expect(sealedNoDate.error.code).toBe('invalid');

    const unknownPerson = await save(recorderCtx, { subjectPersonIds: [uuidv7()] });
    expect(unknownPerson.ok).toBe(false);
    if (!unknownPerson.ok) expect(unknownPerson.error.code).toBe('invalid');
  });
});

describe('tier filtering (AD-12)', () => {
  it("an 'admin'-tier row is hidden from an ordinary member but visible to its recorder, teller, admin", async () => {
    const saved = await save(recorderCtx, { accessTier: 'admin', title: '1-5 Kín trong nhà' });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const id = saved.value.recordingId;

    const has = async (ctx: SessionContext) => {
      const list = await inClan((tx) => listRecordingsOp(tx, ctx));
      expect(list.ok).toBe(true);
      return list.ok ? list.value.some((m) => m.recordingId === id) : false;
    };
    expect(await has(memberCtx)).toBe(false); // ordinary member: not even metadata
    expect(await has(recorderCtx)).toBe(true); // the one who recorded it
    expect(await has(tellerCtx)).toBe(true); // the teller's attached account
    expect(await has(adminCtx)).toBe(true);

    // Playback follows the same rule.
    const denied = await inClan((tx) => requestPlaybackOp(tx, memberCtx, id));
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe('forbidden');
    const allowed = await inClan((tx) => requestPlaybackOp(tx, recorderCtx, id));
    expect(allowed.ok).toBe(true);
  });

  it('a sealed recording never plays before sealedUntil — not even for admin; metadata admin-only', async () => {
    const saved = await save(recorderCtx, {
      accessTier: 'sealed',
      sealedUntil: '2031-01-01',
      title: '1-5 Niêm phong',
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const id = saved.value.recordingId;

    for (const ctx of [adminCtx, recorderCtx, memberCtx]) {
      const play = await inClan((tx) => requestPlaybackOp(tx, ctx, id));
      expect(play.ok).toBe(false);
      if (!play.ok) expect(play.error.code).toBe('forbidden');
    }

    const memberList = await inClan((tx) => listRecordingsOp(tx, memberCtx));
    expect(memberList.ok && memberList.value.some((m) => m.recordingId === id)).toBe(false);

    const adminList = await inClan((tx) => listRecordingsOp(tx, adminCtx));
    expect(adminList.ok).toBe(true);
    if (!adminList.ok) return;
    const meta = adminList.value.find((m) => m.recordingId === id);
    expect(meta).toBeTruthy();
    expect(meta!.statusLabel).toBe('niêm phong tới 2031-01-01');
    expect(meta!.playable).toBe(false);
  });

  it('a withdrawn recording plays for NOBODY; admin still sees it marked "đã rút lại" (FR-49)', async () => {
    const saved = await save(recorderCtx, { accessTier: 'public', title: '1-5 Sẽ rút lại' });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const id = saved.value.recordingId;

    // A non-teller ordinary member may not withdraw.
    const notAllowed = await inClan((tx) => withdrawRecordingOp(tx, memberCtx, id));
    expect(notAllowed.ok).toBe(false);
    if (!notAllowed.ok) expect(notAllowed.error.code).toBe('forbidden');

    // The teller's attached account may.
    const withdrawn = await inClan((tx) => withdrawRecordingOp(tx, tellerCtx, id));
    expect(withdrawn.ok).toBe(true);
    const again = await inClan((tx) => withdrawRecordingOp(tx, tellerCtx, id));
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.code).toBe('conflict');

    for (const ctx of [adminCtx, tellerCtx, recorderCtx, memberCtx]) {
      const play = await inClan((tx) => requestPlaybackOp(tx, ctx, id));
      expect(play.ok).toBe(false);
      if (!play.ok) expect(play.error.code).toBe('forbidden');
    }

    const memberList = await inClan((tx) => listRecordingsOp(tx, memberCtx));
    expect(memberList.ok && memberList.value.some((m) => m.recordingId === id)).toBe(false);

    const adminList = await inClan((tx) => listRecordingsOp(tx, adminCtx));
    expect(adminList.ok).toBe(true);
    if (!adminList.ok) return;
    const meta = adminList.value.find((m) => m.recordingId === id);
    expect(meta).toBeTruthy();
    expect(meta!.withdrawn).toBe(true);
    expect(meta!.statusLabel).toBe('đã rút lại');
    expect(meta!.playable).toBe(false);

    // Withdrawal wrote its revision.
    const revs = await inClan((tx) =>
      tx
        .select()
        .from(revision)
        .where(and(eq(revision.entity, 'recording'), eq(revision.entityId, id))),
    );
    expect(revs.map((r) => r.action).sort()).toEqual(['create', 'withdraw']);
  });

  it('updateRecordingAccess: teller or admin only, revision written', async () => {
    const saved = await save(recorderCtx, { accessTier: 'public', title: '1-5 Đổi mức' });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const id = saved.value.recordingId;

    const notAllowed = await inClan((tx) => updateRecordingAccessOp(tx, memberCtx, id, 'admin'));
    expect(notAllowed.ok).toBe(false);
    if (!notAllowed.ok) expect(notAllowed.error.code).toBe('forbidden');

    const sealedByTeller = await inClan((tx) =>
      updateRecordingAccessOp(tx, tellerCtx, id, 'sealed', '2031-06-01'),
    );
    expect(sealedByTeller.ok).toBe(true);

    // Now sealed: the former public audience lost playback.
    const play = await inClan((tx) => requestPlaybackOp(tx, memberCtx, id));
    expect(play.ok).toBe(false);

    const revs = await inClan((tx) =>
      tx
        .select()
        .from(revision)
        .where(and(eq(revision.entity, 'recording'), eq(revision.entityId, id))),
    );
    expect(revs.map((r) => r.action).sort()).toEqual(['create', 'update']);
  });
});

describe('playback token (AD-12)', () => {
  it('requestPlayback mints a token that verifies back to the recording; tampering and expiry kill it', async () => {
    const saved = await save(recorderCtx, { accessTier: 'public', title: '1-5 Vé nghe' });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const id = saved.value.recordingId;

    const minted = await inClan((tx) => requestPlaybackOp(tx, memberCtx, id));
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;

    const verified = verifyPlaybackToken(minted.value.token);
    expect(verified).toEqual({ recordingId: id });

    // The verified id opens the bytes — the stream route's exact path.
    const stored = await storage.get(verified!.recordingId);
    expect(stored).not.toBeNull();
    expect(stored!.mime).toBe('audio/webm');

    // Tampered payload → null.
    const [payload, sig] = minted.value.token.split('.');
    const flipped = (payload[0] === 'A' ? 'B' : 'A') + payload.slice(1);
    expect(verifyPlaybackToken(`${flipped}.${sig}`)).toBeNull();
    expect(verifyPlaybackToken('rác-không-phải-vé')).toBeNull();

    // Expired (exp in the past) → null.
    expect(verifyPlaybackToken(mintPlaybackToken(id, -60_000))).toBeNull();
  });
});

describe('storage keys (AD-11)', () => {
  it('rejects path-traversal and non-uuid keys outright', async () => {
    await expect(storage.put('../1-5-evil', Buffer.from('x'), 'audio/webm')).rejects.toThrow(/invalid key/);
    await expect(storage.put('..', Buffer.from('x'), 'audio/webm')).rejects.toThrow(/invalid key/);
    await expect(storage.put('a/b', Buffer.from('x'), 'audio/webm')).rejects.toThrow(/invalid key/);
    await expect(storage.get('../../etc/passwd')).rejects.toThrow(/invalid key/);
    await expect(storage.delete('1-5%2e%2e%2fkey')).rejects.toThrow(/invalid key/);
  });
});
