/**
 * G2 — merge listings for the bàn duyệt surface (UI stories 3-3/3-4): listProposalsOp shapes,
 * status filter, rights gates; listMergeHistoryOp merge→unmerge trail from the revision log.
 * Real DB (pattern: core/merge/merge.test.ts), fresh uuidv7 clan, cleanup in afterAll.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { dbGlobal, withClanContext, ownerPool } from '@/db';
import { assertion, authUser, clan, person, source } from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import type { Result } from '@/core/types';
import type { SessionContext, ViewerContext } from '@/core/identity/session';
import {
  executeMergeOp,
  listMergeHistoryOp,
  listProposalsOp,
  proposeMergeOp,
  rejectProposalOp,
  unmergeOp,
} from './ops';

const STORY = 'G2M';
const clanId = uuidv7();
const owner = ownerPool();

const adminPerson = uuidv7();
const memberPerson = uuidv7();
const w1 = uuidv7(); // winner: official name, birth 1950
const l1 = uuidv7(); // loser: tentative name, birth 1951
const w2 = uuidv7(); // second pair — gets rejected
const l2 = uuidv7();
const src = uuidv7();
const noteOnLoser = uuidv7(); // one reference on l1 so the merge repoints something

const adminAcc = `${STORY}-acc-admin`;
const memberAcc = `${STORY}-acc-member`;

const adminCtx: SessionContext = { accountId: adminAcc, clanId, personId: adminPerson, role: 'admin' };
const memberCtx: SessionContext = { accountId: memberAcc, clanId, personId: memberPerson, role: 'member' };
const guestCtx: ViewerContext = { accountId: null, clanId, personId: null, role: 'guest' };

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(`expected ok, got ${r.error.code}: ${r.error.message}`);
  return r.value;
}
function unwrapErr<T>(r: Result<T>): { code: string; message: string } {
  if (r.ok) throw new Error('expected err, got ok');
  return r.error;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

let p1 = ''; // w1 ← l1, stays through merge + unmerge
let p2 = ''; // w2 ← l2, rejected

beforeAll(async () => {
  await dbGlobal.insert(authUser).values([
    { id: adminAcc, name: `${STORY} Người Duyệt`, email: `${adminAcc}@test.local` },
    { id: memberAcc, name: `${STORY} Người Đề Xuất`, email: `${memberAcc}@test.local` },
  ]);
  await withClanContext(clanId, async (tx) => {
    await tx.insert(clan).values({ id: clanId, name: `${STORY} Clan Bàn Duyệt` });
    const seed = (id: string, fullName: string, extra: Partial<typeof person.$inferInsert> = {}) => ({
      id,
      clanId,
      fullName,
      nameFolded: chuanHoa(fullName),
      ...extra,
    });
    await tx.insert(person).values([
      seed(adminPerson, `${STORY} Quản Trị`),
      seed(memberPerson, `${STORY} Thành Viên`),
      seed(w1, `${STORY} Chính Thức`, { nameTier: 'official', birthDate: '1950-02-01', birthPrecision: 'exact' }),
      seed(l1, `${STORY} Tồn Nghi`, { nameTier: 'tentative', birthDate: '1951-01-01', birthPrecision: 'year' }),
      seed(w2, `${STORY} Hai Thắng`),
      seed(l2, `${STORY} Hai Thua`),
    ]);
    await tx.insert(source).values({
      id: src,
      clanId,
      kind: 'seed-import',
      description: `${STORY} seed`,
      createdByAccountId: adminAcc,
    });
    await tx.insert(assertion).values({
      id: noteOnLoser,
      clanId,
      subjectPersonId: l1,
      kind: 'note',
      value: { text: `${STORY} ghi chú về người thua` },
      sourceId: src,
      createdByAccountId: adminAcc,
    });
    p1 = unwrap(
      await proposeMergeOp(tx, memberCtx, { winnerId: w1, loserId: l1, reason: `${STORY} cùng một cụ` }),
    ).proposalId;
    p2 = unwrap(
      await proposeMergeOp(tx, memberCtx, { winnerId: w2, loserId: l2, reason: `${STORY} nghi trùng` }),
    ).proposalId;
  });
});

afterAll(async () => {
  await owner.query('BEGIN');
  await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
  for (const tbl of ['notification', 'merge_proposal', 'revision', 'assertion', 'source', 'person']) {
    await owner.query(`DELETE FROM ${tbl} WHERE clan_id = $1`, [clanId]);
  }
  await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
  await owner.query('COMMIT');
  await owner.query('DELETE FROM "user" WHERE id = ANY($1)', [[adminAcc, memberAcc]]);
  await owner.end();
});

describe('listProposalsOp', () => {
  it('is approver-only: member forbidden, guest unauthenticated (rights gate)', async () => {
    await withClanContext(clanId, async (tx) => {
      expect(unwrapErr(await listProposalsOp(tx, memberCtx)).code).toBe('forbidden');
      expect(unwrapErr(await listProposalsOp(tx, guestCtx)).code).toBe('unauthenticated');
    });
  });

  it('returns the full ProposalView shape: person snapshots, evidence, ISO dates, account names', async () => {
    await withClanContext(clanId, async (tx) => {
      const all = unwrap(await listProposalsOp(tx, adminCtx));
      expect(all.length).toBeGreaterThanOrEqual(2);
      // newest first — p2 was proposed after p1
      expect(all.findIndex((p) => p.proposalId === p2)).toBeLessThan(
        all.findIndex((p) => p.proposalId === p1),
      );

      const view = all.find((p) => p.proposalId === p1)!;
      expect(view.status).toBe('open');
      expect(view.reason).toBe(`${STORY} cùng một cụ`);
      expect(view.createdAt).toMatch(ISO_RE);
      expect(view.decidedAt).toBeUndefined();
      expect(view.decidedByName).toBeUndefined();
      expect(view.proposedByName).toBe(`${STORY} Người Đề Xuất`);

      expect(view.winner).toEqual({
        personId: w1,
        fullName: `${STORY} Chính Thức`,
        birthYear: 1950,
        tentative: false,
      });
      expect(view.loser).toEqual({
        personId: l1,
        fullName: `${STORY} Tồn Nghi`,
        birthYear: 1951,
        tentative: true,
      });

      expect(typeof view.evidence.nameSimilarity).toBe('number');
      expect(view.evidence.birthYearDelta).toBe(1);
      expect(typeof view.evidence.sharedRelatives).toBe('number');
    });
  });

  it('filters by status and carries decision fields once decided', async () => {
    await withClanContext(clanId, async (tx) => {
      unwrap(await rejectProposalOp(tx, adminCtx, { proposalId: p2, note: `${STORY} không phải` }));

      const open = unwrap(await listProposalsOp(tx, adminCtx, { status: 'open' }));
      expect(open.map((p) => p.proposalId)).toContain(p1);
      expect(open.map((p) => p.proposalId)).not.toContain(p2);

      const rejected = unwrap(await listProposalsOp(tx, adminCtx, { status: 'rejected' }));
      const view = rejected.find((p) => p.proposalId === p2)!;
      expect(view.status).toBe('rejected');
      expect(view.decidedAt).toMatch(ISO_RE);
      expect(view.decidedByName).toBe(`${STORY} Người Duyệt`);
    });
  });
});

describe('listMergeHistoryOp', () => {
  it('is approver-only (member forbidden)', async () => {
    await withClanContext(clanId, async (tx) => {
      expect(unwrapErr(await listMergeHistoryOp(tx, memberCtx)).code).toBe('forbidden');
    });
  });

  it('shows the merge event with names from the revision images and the repoint count', async () => {
    await withClanContext(clanId, async (tx) => {
      const outcome = unwrap(await executeMergeOp(tx, adminCtx, { proposalId: p1 }));
      expect(outcome.repointedCount).toBeGreaterThanOrEqual(1); // the note on l1 moved

      const events = unwrap(await listMergeHistoryOp(tx, adminCtx));
      expect(events).toHaveLength(1);
      const ev = events[0]!;
      expect(ev.proposalId).toBe(p1);
      expect(ev.action).toBe('merge');
      expect(ev.at).toMatch(ISO_RE);
      expect(ev.byName).toBe(`${STORY} Người Duyệt`);
      expect(ev.winnerName).toBe(`${STORY} Chính Thức`);
      expect(ev.loserName).toBe(`${STORY} Tồn Nghi`);
      expect(ev.repointedCount).toBe(outcome.repointedCount);
    });
  });

  it('shows unmerge after merge, newest first, and honors the limit', async () => {
    await withClanContext(clanId, async (tx) => {
      const reversed = unwrap(await unmergeOp(tx, adminCtx, { proposalId: p1 }));

      const events = unwrap(await listMergeHistoryOp(tx, adminCtx));
      expect(events).toHaveLength(2);
      expect(events.map((e) => e.action)).toEqual(['unmerge', 'merge']);
      expect(events.map((e) => e.proposalId)).toEqual([p1, p1]);
      // unmerge images carry no person rows — names fall back to the current person rows
      expect(events[0]!.winnerName).toBe(`${STORY} Chính Thức`);
      expect(events[0]!.loserName).toBe(`${STORY} Tồn Nghi`);
      expect(events[0]!.repointedCount).toBe(reversed.reversed);

      const limited = unwrap(await listMergeHistoryOp(tx, adminCtx, { limit: 1 }));
      expect(limited).toHaveLength(1);
      expect(limited[0]!.action).toBe('unmerge');
    });
  });
});
