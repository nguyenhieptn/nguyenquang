/**
 * Story 1-7 — core/merge against the real DB (pattern: core/gates/rls.gate.test.ts).
 * Ops are exercised directly with fabricated contexts (build-contract layering); every test
 * datum is prefixed "S1-7" and lives in a fresh uuidv7 clan, cleaned up in afterAll.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { withClanContext, ownerPool } from '@/db';
import {
  assertion,
  attachment,
  clan,
  mergeProposal,
  notification,
  person,
  recording,
  recordingSubject,
  revision,
  source,
} from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import type { Result } from '@/core/types';
import type { SessionContext, ViewerContext } from '@/core/identity/session';
import {
  executeMergeOp,
  proposeMergeOp,
  rejectProposalOp,
  resolveAliasOp,
  suggestDuplicatesOp,
  unmergeOp,
  type RepointEntry,
} from './ops';

const STORY = 'S1-7';
const clanId = uuidv7();
const owner = ownerPool();

// people
const adminPerson = uuidv7();
const memberPerson = uuidv7();
const parent = uuidv7();
const twinA = uuidv7();
const twinB = uuidv7();
const w1 = uuidv7();
const l1 = uuidv7();
const childX = uuidv7();
const w2 = uuidv7();
const l2 = uuidv7();
const childY = uuidv7();
const w3 = uuidv7();
const l3 = uuidv7();
const chainA = uuidv7();
const chainB = uuidv7();
const chainC = uuidv7();

// claims / fixtures
const src1 = uuidv7();
const src2 = uuidv7(); // told by l1
const pcTwinA = uuidv7();
const pcTwinB = uuidv7();
const aSubj = uuidv7(); // note about l1
const aObj = uuidv7(); // childX is child of l1
const bSubj = uuidv7(); // note about l2
const bObj = uuidv7(); // childY is child of l2
const r1 = uuidv7();
const rs1 = uuidv7(); // r1 speaks about l1  (duplicate of rs2 after merge)
const rs2 = uuidv7(); // r1 speaks about w1
const r2 = uuidv7();
const rs3 = uuidv7(); // r2 speaks about l2  (duplicate of rs4 after merge)
const rs4 = uuidv7(); // r2 speaks about w2
const n1 = uuidv7(); // notification owed to l1
const att3w = uuidv7();
const att3l = uuidv7();

const adminAcc = `${STORY}-acc-admin`;
const memberAcc = `${STORY}-acc-member`;

const adminCtx: SessionContext = { accountId: adminAcc, clanId, personId: adminPerson, role: 'admin' };
const memberCtx: SessionContext = { accountId: memberAcc, clanId, personId: memberPerson, role: 'member' };
const unattachedCtx: SessionContext = { accountId: `${STORY}-acc-loose`, clanId, personId: null, role: 'member' };
const guestCtx: ViewerContext = { accountId: null, clanId, personId: null, role: 'guest' };

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(`expected ok, got ${r.error.code}: ${r.error.message}`);
  return r.value;
}
function unwrapErr<T>(r: Result<T>): { code: string; message: string } {
  if (r.ok) throw new Error('expected err, got ok');
  return r.error;
}

function seedPerson(id: string, fullName: string, extra: Partial<typeof person.$inferInsert> = {}) {
  return { id, clanId, fullName, nameFolded: chuanHoa(fullName), ...extra };
}

// proposal ids created during the run
let p1 = '';
let pOther = '';
let p2 = '';
let p3 = '';
let p4 = '';

beforeAll(async () => {
  await withClanContext(clanId, async (tx) => {
    await tx.insert(clan).values({ id: clanId, name: `${STORY} Clan Hợp Nhất` });
    await tx.insert(person).values([
      seedPerson(adminPerson, `${STORY} Quản Trị`),
      seedPerson(memberPerson, `${STORY} Thành Viên`),
      seedPerson(parent, `${STORY} Cha Chung`, { isLiving: false }),
      seedPerson(twinA, `${STORY} Người Trùng Tên`, { birthDate: '1950-01-01', birthPrecision: 'exact' }),
      seedPerson(twinB, `${STORY} Người Trùng Tên`, { birthDate: '1951-06-01', birthPrecision: 'exact' }),
      seedPerson(w1, `${STORY} Một Thắng`),
      seedPerson(l1, `${STORY} Một Thua`),
      seedPerson(childX, `${STORY} Con Của Thua`),
      // w2 starts with an EMPTY projection so the merge fills it from l2:
      { id: w2, clanId, fullName: '', nameFolded: '' },
      seedPerson(l2, `${STORY} Hai Thua`, { nameTier: 'tentative', nameConfidence: 'theo-loi-ke' }),
      seedPerson(childY, `${STORY} Con Của Hai`),
      seedPerson(w3, `${STORY} Ba Thắng`),
      seedPerson(l3, `${STORY} Ba Thua`),
      seedPerson(chainA, `${STORY} Chuỗi A`),
      seedPerson(chainB, `${STORY} Chuỗi B`),
      seedPerson(chainC, `${STORY} Chuỗi C`),
    ]);
    await tx.insert(source).values([
      { id: src1, clanId, kind: 'seed-import', description: `${STORY} seed`, createdByAccountId: adminAcc },
      { id: src2, clanId, kind: 'told-by', description: `${STORY} lời kể`, toldByPersonId: l1, createdByAccountId: adminAcc },
    ]);
    await tx.insert(assertion).values([
      { id: pcTwinA, clanId, subjectPersonId: twinA, kind: 'parent-child', objectPersonId: parent, value: { relation: 'blood' }, sourceId: src1, createdByAccountId: adminAcc },
      { id: pcTwinB, clanId, subjectPersonId: twinB, kind: 'parent-child', objectPersonId: parent, value: { relation: 'blood' }, sourceId: src1, createdByAccountId: adminAcc },
      { id: aSubj, clanId, subjectPersonId: l1, kind: 'note', value: { text: `${STORY} ghi chú` }, sourceId: src1, createdByAccountId: adminAcc },
      { id: aObj, clanId, subjectPersonId: childX, kind: 'parent-child', objectPersonId: l1, value: { relation: 'blood' }, sourceId: src1, createdByAccountId: adminAcc },
      { id: bSubj, clanId, subjectPersonId: l2, kind: 'note', value: { text: `${STORY} ghi chú hai` }, sourceId: src1, createdByAccountId: adminAcc },
      { id: bObj, clanId, subjectPersonId: childY, kind: 'parent-child', objectPersonId: l2, value: { relation: 'blood' }, sourceId: src1, createdByAccountId: adminAcc },
    ]);
    await tx.insert(recording).values([
      { id: r1, clanId, toldByPersonId: l1, recordedByAccountId: adminAcc, recordedOn: '2020-01-01', storageKey: `${STORY}/r1`, mimeType: 'audio/mp4' },
      { id: r2, clanId, toldByPersonId: null, recordedByAccountId: adminAcc, recordedOn: '2020-01-02', storageKey: `${STORY}/r2`, mimeType: 'audio/mp4' },
    ]);
    await tx.insert(recordingSubject).values([
      { id: rs1, clanId, recordingId: r1, personId: l1 },
      { id: rs2, clanId, recordingId: r1, personId: w1 },
      { id: rs3, clanId, recordingId: r2, personId: l2 },
      { id: rs4, clanId, recordingId: r2, personId: w2 },
    ]);
    await tx.insert(notification).values({ id: n1, clanId, personId: l1, kind: 'added-to-tree' });
    await tx.insert(attachment).values([
      { id: att3w, clanId, accountId: `${STORY}-acc-w3`, personId: w3, role: 'member', status: 'active' },
      { id: att3l, clanId, accountId: `${STORY}-acc-l3`, personId: l3, role: 'member', status: 'active' },
    ]);
  });
});

afterAll(async () => {
  await owner.query('BEGIN');
  await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
  for (const tbl of [
    'notification',
    'recording_subject',
    'recording',
    'merge_proposal',
    'revision',
    'assertion',
    'attachment',
    'source',
    'person',
  ]) {
    await owner.query(`DELETE FROM ${tbl} WHERE clan_id = $1`, [clanId]);
  }
  await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
  await owner.query('COMMIT');
  await owner.end();
});

describe('suggestDuplicates', () => {
  it('finds folded-name twins with shared parent; member is forbidden (bàn duyệt surface)', async () => {
    await withClanContext(clanId, async (tx) => {
      const forbidden = await suggestDuplicatesOp(tx, memberCtx);
      expect(unwrapErr(forbidden).code).toBe('forbidden');

      const candidates = unwrap(await suggestDuplicatesOp(tx, adminCtx));
      const pair = candidates.find(
        (c) =>
          (c.a.personId === twinA && c.b.personId === twinB) ||
          (c.a.personId === twinB && c.b.personId === twinA),
      );
      expect(pair, 'twin pair must be suggested').toBeTruthy();
      expect(pair!.evidence.nameSimilarity).toBe(1);
      expect(pair!.evidence.birthYearDelta).toBe(1);
      expect(pair!.evidence.sharedRelatives).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('proposeMerge', () => {
  it('attached member may propose; guest and unattached may not; open duplicates conflict', async () => {
    await withClanContext(clanId, async (tx) => {
      expect(unwrapErr(await proposeMergeOp(tx, guestCtx, { winnerId: w1, loserId: l1, reason: 'x' })).code).toBe('unauthenticated');
      expect(unwrapErr(await proposeMergeOp(tx, unattachedCtx, { winnerId: w1, loserId: l1, reason: 'x' })).code).toBe('unattached');
      expect(unwrapErr(await proposeMergeOp(tx, memberCtx, { winnerId: w1, loserId: w1, reason: 'x' })).code).toBe('invalid');

      const proposed = unwrap(
        await proposeMergeOp(tx, memberCtx, { winnerId: w1, loserId: l1, reason: `${STORY} cùng một người` }),
      );
      p1 = proposed.proposalId;

      const [row] = await tx.select().from(mergeProposal).where(eq(mergeProposal.id, p1));
      expect(row?.status).toBe('open');
      expect(row?.proposedByAccountId).toBe(memberAcc);

      // AD-10: proposal creation logged under entity 'merge', entityId = proposal id.
      const revs = await tx
        .select()
        .from(revision)
        .where(and(eq(revision.entity, 'merge'), eq(revision.entityId, p1), eq(revision.action, 'create')));
      expect(revs).toHaveLength(1);

      // same pair (either direction) while open → conflict
      expect(unwrapErr(await proposeMergeOp(tx, memberCtx, { winnerId: l1, loserId: w1, reason: 'x' })).code).toBe('conflict');

      // a second proposal referencing l1 — will be superseded by executing p1
      pOther = unwrap(
        await proposeMergeOp(tx, memberCtx, { winnerId: parent, loserId: l1, reason: `${STORY} nhầm` }),
      ).proposalId;
    });
  });
});

describe('executeMerge', () => {
  it('is forbidden for a plain member (AD-22)', async () => {
    await withClanContext(clanId, async (tx) => {
      expect(unwrapErr(await executeMergeOp(tx, memberCtx, { proposalId: p1 })).code).toBe('forbidden');
      const [loser] = await tx.select().from(person).where(eq(person.id, l1));
      expect(loser?.mergedInto).toBeNull();
    });
  });

  it('repoints every reference loser → winner and records the COMPLETE list (AD-3)', async () => {
    await withClanContext(clanId, async (tx) => {
      const outcome = unwrap(await executeMergeOp(tx, adminCtx, { proposalId: p1 }));
      expect(outcome.winnerId).toBe(w1);
      expect(outcome.loserId).toBe(l1);

      // repointed rows
      const [noteRow] = await tx.select().from(assertion).where(eq(assertion.id, aSubj));
      expect(noteRow?.subjectPersonId).toBe(w1);
      const [pcRow] = await tx.select().from(assertion).where(eq(assertion.id, aObj));
      expect(pcRow?.objectPersonId).toBe(w1);
      const [srcRow] = await tx.select().from(source).where(eq(source.id, src2));
      expect(srcRow?.toldByPersonId).toBe(w1);
      const [recRow] = await tx.select().from(recording).where(eq(recording.id, r1));
      expect(recRow?.toldByPersonId).toBe(w1);
      const [notifRow] = await tx.select().from(notification).where(eq(notification.id, n1));
      expect(notifRow?.personId).toBe(w1);

      // recording_subject dedupe: loser row dropped, winner row kept
      const subjects = await tx.select().from(recordingSubject).where(eq(recordingSubject.recordingId, r1));
      expect(subjects.map((s) => s.id)).toEqual([rs2]);

      // tombstone keeps its projected name
      const [loser] = await tx.select().from(person).where(eq(person.id, l1));
      expect(loser?.mergedInto).toBe(w1);
      expect(loser?.fullName).toBe(`${STORY} Một Thua`);

      // other open proposal referencing the loser closed as superseded
      const [other] = await tx.select().from(mergeProposal).where(eq(mergeProposal.id, pOther));
      expect(other?.status).toBe('rejected');
      const superseded = await tx
        .select()
        .from(revision)
        .where(and(eq(revision.entity, 'merge'), eq(revision.entityId, pOther), eq(revision.action, 'update')));
      expect(superseded.some((r) => r.note === 'superseded by merge')).toBe(true);

      // the merge revision carries the complete repoint list
      const [mergeRev] = await tx
        .select()
        .from(revision)
        .where(and(eq(revision.entity, 'merge'), eq(revision.entityId, p1), eq(revision.action, 'merge')));
      expect(mergeRev).toBeTruthy();
      const after = mergeRev!.after as { winnerId: string; loserId: string; repointed: RepointEntry[] };
      expect(after.winnerId).toBe(w1);
      expect(after.loserId).toBe(l1);
      expect(after.repointed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ table: 'assertion', rowId: aSubj, column: 'subject_person_id', from: l1, to: w1 }),
          expect.objectContaining({ table: 'assertion', rowId: aObj, column: 'object_person_id', from: l1, to: w1 }),
          expect.objectContaining({ table: 'source', rowId: src2, column: 'told_by_person_id', from: l1, to: w1 }),
          expect.objectContaining({ table: 'recording', rowId: r1, column: 'told_by_person_id', from: l1, to: w1 }),
          expect.objectContaining({ table: 'recording_subject', rowId: rs1, column: 'person_id', kind: 'dropped-duplicate' }),
          expect.objectContaining({ table: 'notification', rowId: n1, column: 'person_id', from: l1, to: w1 }),
          expect.objectContaining({ table: 'merge_proposal', rowId: pOther, column: 'status', from: 'open', to: 'rejected' }),
        ]),
      );
      // every non-drop entry names a column now holding the winner — count sanity
      expect(after.repointed.length).toBe(outcome.repointedCount);
    });
  });

  it('errs with conflict when both persons hold account attachments', async () => {
    await withClanContext(clanId, async (tx) => {
      p3 = unwrap(await proposeMergeOp(tx, memberCtx, { winnerId: w3, loserId: l3, reason: `${STORY} kẹt` })).proposalId;
      const res = await executeMergeOp(tx, adminCtx, { proposalId: p3 });
      expect(unwrapErr(res).code).toBe('conflict');

      // nothing moved, nothing tombstoned, proposal still open
      const [loser] = await tx.select().from(person).where(eq(person.id, l3));
      expect(loser?.mergedInto).toBeNull();
      const [prop] = await tx.select().from(mergeProposal).where(eq(mergeProposal.id, p3));
      expect(prop?.status).toBe('open');
      const [att] = await tx.select().from(attachment).where(eq(attachment.id, att3l));
      expect(att?.personId).toBe(l3);
    });
  });
});

describe('unmerge', () => {
  it('restores the repointed columns EXACTLY (deep-equal row snapshots)', async () => {
    type PersonRow = typeof person.$inferSelect;
    const stripVolatile = (row: PersonRow) => {
      const copy: Record<string, unknown> = { ...row };
      delete copy.updatedAt;
      return copy;
    };

    // snapshots before the merge
    const before = await withClanContext(clanId, async (tx) => {
      const claims = await tx.select().from(assertion).where(eq(assertion.subjectPersonId, l2));
      const pcs = await tx.select().from(assertion).where(eq(assertion.id, bObj));
      const persons = (
        await Promise.all(
          [w2, l2].map(async (id) => (await tx.select().from(person).where(eq(person.id, id)))[0]!),
        )
      ).map(stripVolatile);
      const subjects = (await tx.select().from(recordingSubject).where(eq(recordingSubject.recordingId, r2))).sort(
        (a, b) => a.id.localeCompare(b.id),
      );
      return { claims, pcs, persons, subjects };
    });

    await withClanContext(clanId, async (tx) => {
      p2 = unwrap(await proposeMergeOp(tx, memberCtx, { winnerId: w2, loserId: l2, reason: `${STORY} trùng` })).proposalId;
      unwrap(await executeMergeOp(tx, adminCtx, { proposalId: p2 }));

      // merged state: projection filled onto w2 (empty slots only), AD-15 notification emitted
      const [winner] = await tx.select().from(person).where(eq(person.id, w2));
      expect(winner?.fullName).toBe(`${STORY} Hai Thua`);
      expect(winner?.nameFolded).toBe(chuanHoa(`${STORY} Hai Thua`));
      const notifs = await tx
        .select()
        .from(notification)
        .where(and(eq(notification.personId, w2), eq(notification.kind, 'record-changed')));
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      // dedupe dropped the l2 subject row of r2
      const merged = await tx.select().from(recordingSubject).where(eq(recordingSubject.recordingId, r2));
      expect(merged.map((s) => s.id)).toEqual([rs4]);
    });

    const after = await withClanContext(clanId, async (tx) => {
      const reversed = unwrap(await unmergeOp(tx, adminCtx, { proposalId: p2 }));
      expect(reversed.reversed).toBeGreaterThan(0);

      const claims = await tx.select().from(assertion).where(eq(assertion.subjectPersonId, l2));
      const pcs = await tx.select().from(assertion).where(eq(assertion.id, bObj));
      const persons = (
        await Promise.all(
          [w2, l2].map(async (id) => (await tx.select().from(person).where(eq(person.id, id)))[0]!),
        )
      ).map(stripVolatile);
      const subjects = (await tx.select().from(recordingSubject).where(eq(recordingSubject.recordingId, r2))).sort(
        (a, b) => a.id.localeCompare(b.id),
      );

      const [proposal] = await tx.select().from(mergeProposal).where(eq(mergeProposal.id, p2));
      expect(proposal?.status).toBe('open');
      expect(proposal?.decidedByAccountId).toBeNull();
      expect(proposal?.decidedAt).toBeNull();

      const unmergeRevs = await tx
        .select()
        .from(revision)
        .where(and(eq(revision.entity, 'merge'), eq(revision.entityId, p2), eq(revision.action, 'unmerge')));
      expect(unmergeRevs).toHaveLength(1);

      return { claims, pcs, persons, subjects };
    });

    // EXACT restoration: subject/object ids, person projection, recording subjects
    expect(after.claims).toEqual(before.claims);
    expect(after.pcs).toEqual(before.pcs);
    expect(after.persons).toEqual(before.persons);
    expect(after.subjects).toEqual(before.subjects);
  });
});

describe('rejectProposal', () => {
  it('needs the approval right and closes an open proposal once', async () => {
    await withClanContext(clanId, async (tx) => {
      p4 = unwrap(await proposeMergeOp(tx, memberCtx, { winnerId: twinA, loserId: twinB, reason: `${STORY} sinh đôi` })).proposalId;
      expect(unwrapErr(await rejectProposalOp(tx, memberCtx, { proposalId: p4, note: 'x' })).code).toBe('forbidden');
      unwrap(await rejectProposalOp(tx, adminCtx, { proposalId: p4, note: `${STORY} hai người thật` }));

      const [row] = await tx.select().from(mergeProposal).where(eq(mergeProposal.id, p4));
      expect(row?.status).toBe('rejected');
      expect(row?.decidedByAccountId).toBe(adminAcc);

      expect(unwrapErr(await rejectProposalOp(tx, adminCtx, { proposalId: p4, note: 'x' })).code).toBe('conflict');
    });
  });
});

describe('resolveAlias', () => {
  it('follows tombstone chains to the canonical id, loop-safely', async () => {
    await withClanContext(clanId, async (tx) => {
      await tx.update(person).set({ mergedInto: chainB }).where(eq(person.id, chainA));
      await tx.update(person).set({ mergedInto: chainC }).where(eq(person.id, chainB));

      expect(unwrap(await resolveAliasOp(tx, chainA))).toBe(chainC);
      expect(unwrap(await resolveAliasOp(tx, chainB))).toBe(chainC);
      expect(unwrap(await resolveAliasOp(tx, chainC))).toBe(chainC);

      // the executed merge from earlier also resolves
      expect(unwrap(await resolveAliasOp(tx, l1))).toBe(w1);

      expect(unwrapErr(await resolveAliasOp(tx, uuidv7())).code).toBe('not-found');

      // a cycle (impossible via ops, forced here) terminates instead of hanging
      await tx.update(person).set({ mergedInto: chainA }).where(eq(person.id, chainC));
      const res = await resolveAliasOp(tx, chainA);
      expect(res.ok).toBe(true);
      await tx.update(person).set({ mergedInto: null }).where(eq(person.id, chainC));
    });
  });
});
