/**
 * Story 1-3 — core/tree derived structure, against the real database (pattern: rls.gate.test.ts).
 *
 * Seeds one clan:
 *   Main fragment (7):        A (1920–1990)
 *                            /               \
 *                B1 "1" (1945–2000)     B2 "2" (1950–2005)
 *                 |  ⚭ W (union)              |
 *          C1 "1.1"    C2 "1.2"          C3 "2.1" (living 1972)
 *        (1970–2020) (living 1980)            |
 *                                        M "2.1.1" (living minor 2015, tentative name)
 *   Detached fragment (2):   WF (1920–1980) → W (1948–2010)   [linked to main only by union]
 *   Detached fragment (1):   X1 (1900–1960)
 *   Merged tombstone:        D (mergedInto C1) with a redundant D→B1 edge
 *
 * Tests exercise ops directly with fabricated viewer contexts (the documented layering rule);
 * the final AD-5 test inserts a NEW parent above A and proves every derived number shifts.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { dbGlobal, ownerPool, withClanContext, type Tx } from '@/db';
import {
  assertion,
  authUser,
  clan,
  person,
  revision,
  source,
  union as unionTable,
  type Tier,
} from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import { ANONYMOUS_LABEL } from '@/core/identity/privacy';
import type { ViewerContext } from '@/core/identity/session';
import {
  accountNames,
  getAncestryPathOps,
  getBranchViewOps,
  getClanOverviewOps,
  relationshipDistanceOps,
  searchPersonsOps,
} from './ops';

const clanId = uuidv7();
const acc = `s13-acc-${uuidv7()}`;
const sourceId = uuidv7();
const unionId = uuidv7();

const A = uuidv7();
const B1 = uuidv7();
const B2 = uuidv7();
const W = uuidv7();
const WF = uuidv7();
const C1 = uuidv7();
const C2 = uuidv7();
const C3 = uuidv7();
const M = uuidv7();
const X1 = uuidv7();
const D = uuidv7();
const P = uuidv7(); // inserted mid-suite by the AD-5 test

const NAME = {
  A: 'S13 Nguyễn Quang Tổ',
  B1: 'S13 Nguyễn Quang Bá',
  B2: 'S13 Nguyễn Quang Bính',
  W: 'S13 Trần Thị Dâu',
  WF: 'S13 Trần Văn Nhạc',
  C1: 'S13 Nguyễn Quang Đệ',
  C2: 'S13 Nguyễn Quang Út',
  C3: 'S13 Nguyễn Quang Cả',
  M: 'S13 Nguyễn Quang Măng',
  X1: 'S13 Lê Văn Xa',
  D: 'S13 Nguyễn Quang Đệ Trùng',
  P: 'S13 Nguyễn Quang Thủy',
};

const adminCtx: ViewerContext = { accountId: acc, clanId, personId: null, role: 'admin' };
const guestCtx: ViewerContext = { accountId: null, clanId, personId: null, role: 'guest' };
const memberB2: ViewerContext = { accountId: acc, clanId, personId: B2, role: 'member' };
const memberC1: ViewerContext = { accountId: acc, clanId, personId: C1, role: 'member' };

function personRow(
  id: string,
  fullName: string,
  o: {
    birth?: string;
    death?: string;
    living?: boolean;
    nameTier?: Tier | null;
    mergedInto?: string;
  } = {},
) {
  return {
    id,
    clanId,
    mergedInto: o.mergedInto ?? null,
    fullName,
    nameFolded: chuanHoa(fullName),
    nameTier: o.nameTier === undefined ? ('official' as const) : o.nameTier,
    nameConfidence: 'chac-chan' as const,
    birthDate: o.birth ?? null,
    deathDate: o.death ?? null,
    isLiving: o.living ?? false,
  };
}

function edgeRow(childId: string, parentId: string, tier: Tier = 'official') {
  return {
    id: uuidv7(),
    clanId,
    subjectPersonId: childId,
    kind: 'parent-child' as const,
    objectPersonId: parentId,
    value: { relation: 'blood' },
    sourceId,
    confidence: 'chac-chan' as const,
    tier,
    createdByAccountId: acc,
  };
}

function unionRow(personId: string) {
  return {
    id: uuidv7(),
    clanId,
    subjectPersonId: personId,
    kind: 'union-partner' as const,
    unionId,
    value: {},
    sourceId,
    confidence: 'chac-chan' as const,
    tier: 'official' as const,
    createdByAccountId: acc,
  };
}

const run = <T>(fn: (tx: Tx) => Promise<T>) => withClanContext(clanId, fn);

beforeAll(async () => {
  await run(async (tx) => {
    await tx.insert(clan).values({ id: clanId, name: 'S13 Clan' });
    await tx.insert(person).values([
      personRow(A, NAME.A, { birth: '1920-01-01', death: '1990-01-01' }),
      personRow(B1, NAME.B1, { birth: '1945-02-01', death: '2000-01-01' }),
      personRow(B2, NAME.B2, { birth: '1950-03-01', death: '2005-01-01' }),
      personRow(W, NAME.W, { birth: '1948-01-01', death: '2010-01-01' }),
      personRow(WF, NAME.WF, { birth: '1920-05-01', death: '1980-01-01' }),
      personRow(C1, NAME.C1, { birth: '1970-01-01', death: '2020-01-01' }),
      personRow(C2, NAME.C2, { birth: '1980-06-01', living: true }),
      personRow(C3, NAME.C3, { birth: '1972-01-01', living: true }),
      personRow(M, NAME.M, { birth: '2015-01-01', living: true, nameTier: 'tentative' }),
      personRow(X1, NAME.X1, { birth: '1900-01-01', death: '1960-01-01', nameTier: null }),
      personRow(D, NAME.D, { birth: '1970-01-01', death: '2020-01-01', mergedInto: C1 }),
    ]);
    await tx.insert(source).values({
      id: sourceId,
      clanId,
      kind: 'seed-import',
      description: 'S13 seed',
      createdByAccountId: acc,
    });
    await tx.insert(unionTable).values({ id: unionId, clanId, kind: 'marriage' });
    await tx.insert(assertion).values([
      edgeRow(B1, A),
      edgeRow(B2, A),
      edgeRow(C1, B1),
      edgeRow(C2, B1),
      edgeRow(C3, B2),
      edgeRow(M, C3, 'tentative'),
      edgeRow(W, WF),
      edgeRow(D, B1), // via tombstone — must redirect to C1→B1 and dedupe
      unionRow(B1),
      unionRow(W),
    ]);
    await tx.insert(revision).values({
      id: uuidv7(),
      clanId,
      accountId: acc,
      entity: 'person',
      entityId: C2,
      action: 'create',
      after: { fullName: NAME.C2 },
    });
  });
  await dbGlobal.insert(authUser).values({
    id: acc,
    name: 'Khánh S13',
    email: `${acc}@test.local`,
  });
});

afterAll(async () => {
  const owner = ownerPool();
  try {
    await owner.query('BEGIN');
    await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
    await owner.query('DELETE FROM assertion WHERE clan_id = $1', [clanId]);
    await owner.query('DELETE FROM revision WHERE clan_id = $1', [clanId]);
    await owner.query('DELETE FROM source WHERE clan_id = $1', [clanId]);
    await owner.query('DELETE FROM "union" WHERE clan_id = $1', [clanId]);
    await owner.query('DELETE FROM person WHERE clan_id = $1', [clanId]);
    await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
    await owner.query('COMMIT');
    await owner.query('DELETE FROM "user" WHERE id = $1', [acc]);
  } finally {
    await owner.end();
  }
});

describe('fragments + provisional roots (FR-63, FR-48)', () => {
  it('splits main and unconnected fragments, excludes tombstones, elects roots', async () => {
    const res = await run((tx) => getClanOverviewOps(tx, adminCtx));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const o = res.value;

    expect(o.mainFragment?.rootPersonId).toBe(A);
    expect(o.mainFragment?.rootName).toBe(NAME.A);
    expect(o.mainFragment?.personCount).toBe(7); // D (merged) not counted
    expect(o.mainFragment?.tentativeCount).toBe(1); // M

    expect(o.unconnectedFragments.map((f) => [f.rootPersonId, f.personCount])).toEqual([
      [WF, 2], // W has a parent edge → WF is the provisional root
      [X1, 1],
    ]);
    expect(o.unconnectedFragments[1].tentativeCount).toBe(1); // X1 nameTier null
  });

  it('lists first-generation branches of the MAIN fragment only, in birth order', async () => {
    const res = await run((tx) => getClanOverviewOps(tx, adminCtx));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.branches).toEqual([
      {
        branchCode: '1',
        headName: NAME.B1,
        personCount: 3, // B1, C1, C2
        tentativeCount: 0,
        headPersonId: B1,
      },
      {
        branchCode: '2',
        headName: NAME.B2,
        personCount: 3, // B2, C3, M
        tentativeCount: 1,
        headPersonId: B2,
      },
    ]);
  });
});

describe('branch view (FR-15) — generations, branch codes, couples', () => {
  it('resolves a deep member to its branch head and computes codes 1 / 1.1 / 1.2', async () => {
    const res = await run((tx) => getBranchViewOps(tx, adminCtx, C1)); // C1 → head B1
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const v = res.value;
    expect(v.branchCode).toBe('1');
    expect(v.headPersonId).toBe(B1);
    expect(v.generations.map((g) => g.generation)).toEqual([2, 3]);

    const gen2 = v.generations[0].couples;
    expect(gen2).toHaveLength(1);
    expect(gen2[0].person.personId).toBe(B1);
    expect(gen2[0].person.branchCode).toBe('1');
    expect(gen2[0].partners.map((p) => p.personId)).toEqual([W]); // couple merged on one card
    expect(gen2[0].childrenIds).toEqual([C1, C2]); // birth order 1970 < 1980

    const gen3 = v.generations[1].couples.map((c) => c.person);
    expect(gen3.map((p) => [p.personId, p.branchCode, p.generation])).toEqual([
      [C1, '1.1', 3],
      [C2, '1.2', 3],
    ]);
  });

  it('reports the viewer generation when the viewer is inside the branch', async () => {
    const asMember = await run((tx) => getBranchViewOps(tx, memberB2, B2));
    expect(asMember.ok).toBe(true);
    if (!asMember.ok) return;
    expect(asMember.value.viewerGeneration).toBe(2);
    expect(asMember.value.generations.map((g) => g.generation)).toEqual([2, 3, 4]);
    const codes = asMember.value.generations.flatMap((g) =>
      g.couples.map((c) => c.person.branchCode),
    );
    expect(codes).toEqual(['2', '2.1', '2.1.1']);

    const asAdmin = await run((tx) => getBranchViewOps(tx, adminCtx, B2));
    expect(asAdmin.ok).toBe(true);
    if (!asAdmin.ok) return;
    expect(asAdmin.value.viewerGeneration).toBeNull();
  });
});

describe('ancestry path (FR-13)', () => {
  it('walks from a leaf to the provisional root; the dead stay fully visible to guests', async () => {
    const res = await run((tx) => getAncestryPathOps(tx, guestCtx, M));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const v = res.value;
    expect(v.steps.map((s) => s.personId)).toEqual([M, C3, B2, A]);
    expect(v.steps[0].personId).toBe(M);
    expect(v.steps[0].generation).toBe(4);
    expect(v.reachesMainRoot).toBe(true);
    expect(v.fragmentRootName).toBe(NAME.A);
    // A is dead → full for a guest, including the complete lifespan.
    const a = v.steps[3];
    expect(a.fullName).toBe(NAME.A);
    expect(a.lifespan).toBe('1920–1990');
  });

  it('marks a path inside an unconnected fragment as not reaching the main root', async () => {
    const res = await run((tx) => getAncestryPathOps(tx, adminCtx, W));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.steps.map((s) => s.personId)).toEqual([W, WF]);
    expect(res.value.reachesMainRoot).toBe(false);
    expect(res.value.fragmentRootName).toBe(NAME.WF);
  });
});

describe('relationship distance (AD-13 input)', () => {
  it('siblings=2, spouse=1, spouse-parent=2, self=0, unrelated fragment=null', async () => {
    const d = (a: string, b: string) => run((tx) => relationshipDistanceOps(tx, adminCtx, a, b));
    expect(await d(C1, C2)).toEqual({ ok: true, value: 2 });
    expect(await d(B1, W)).toEqual({ ok: true, value: 1 });
    expect(await d(B1, WF)).toEqual({ ok: true, value: 2 });
    expect(await d(A, A)).toEqual({ ok: true, value: 0 });
    expect(await d(A, X1)).toEqual({ ok: true, value: null });
  });
});

describe('search (FR-11, AD-16)', () => {
  it('finds a diacritic-folded contains match (similar=false), never the tombstone', async () => {
    const res = await run((tx) => searchPersonsOps(tx, adminCtx, 'nguyen quang de'));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const hit = res.value.find((h) => h.personId === C1);
    expect(hit).toBeTruthy();
    expect(hit?.similar).toBe(false);
    expect(hit?.generation).toBe(3);
    expect(hit?.branchCode).toBe('1.1');
    expect(res.value.some((h) => h.personId === D)).toBe(false);
  });

  it('finds a trigram-similar near-miss and marks it similar=true', async () => {
    const res = await run((tx) => searchPersonsOps(tx, adminCtx, 'nguyen quan de'));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const hit = res.value.find((h) => h.personId === C1);
    expect(hit).toBeTruthy();
    expect(hit?.similar).toBe(true);
  });
});

describe('privacy radius on every card (AD-13/AD-21, FR-37)', () => {
  it('guest: living adult is limited (year only, attribution kept), minor is anonymous', async () => {
    const b1 = await run((tx) => getBranchViewOps(tx, guestCtx, B1));
    expect(b1.ok).toBe(true);
    if (!b1.ok) return;
    const c2 = b1.value.generations[1].couples.find((c) => c.person.personId === C2)?.person;
    expect(c2?.fullName).toBe(NAME.C2);
    expect(c2?.lifespan).toBe('sinh 1980'); // year only — never the raw date
    expect(c2?.attribution).toEqual({ byAccountId: acc, at: expect.any(String) });

    const b2 = await run((tx) => getBranchViewOps(tx, guestCtx, B2));
    expect(b2.ok).toBe(true);
    if (!b2.ok) return;
    const cards = b2.value.generations.flatMap((g) => g.couples.map((c) => c.person));
    const m = cards.find((c) => c.personId === M);
    expect(m?.fullName).toBe(ANONYMOUS_LABEL);
    expect(m?.lifespan).toBe('');
    expect(m?.attribution).toBeNull();
    const c3 = cards.find((c) => c.personId === C3);
    expect(c3?.fullName).toBe(NAME.C3);
    expect(c3?.lifespan).toBe('sinh 1972');
  });

  it('member within the radius sees the minor in full; outside the radius, anonymous', async () => {
    const near = await run((tx) => getBranchViewOps(tx, memberB2, B2)); // B2→M distance 2
    expect(near.ok).toBe(true);
    if (!near.ok) return;
    const mNear = near.value.generations
      .flatMap((g) => g.couples.map((c) => c.person))
      .find((c) => c.personId === M);
    expect(mNear?.fullName).toBe(NAME.M);
    expect(mNear?.lifespan).toBe('sinh 2015');

    const far = await run((tx) => getBranchViewOps(tx, memberC1, B2)); // C1→M distance 5
    expect(far.ok).toBe(true);
    if (!far.ok) return;
    const mFar = far.value.generations
      .flatMap((g) => g.couples.map((c) => c.person))
      .find((c) => c.personId === M);
    expect(mFar?.fullName).toBe(ANONYMOUS_LABEL);
  });

  it('search never returns a person the viewer could only see anonymised', async () => {
    const res = await run((tx) => searchPersonsOps(tx, guestCtx, 'nguyen quang mang'));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.some((h) => h.personId === M)).toBe(false);
  });
});

describe('attribution names (FR-39)', () => {
  it('resolves account ids to display names from the identity "user" table', async () => {
    const names = await accountNames([acc, 'no-such-account']);
    expect(names.get(acc)).toBe('Khánh S13');
    expect(names.has('no-such-account')).toBe(false);
  });
});

describe('AD-5 — a parent above the old root shifts everything on the next read', () => {
  it('re-derives root, generations and branch codes with no stored value to go stale', async () => {
    await run(async (tx) => {
      await tx.insert(person).values(personRow(P, NAME.P, { birth: '1900-01-01', death: '1970-01-01' }));
      await tx.insert(assertion).values(edgeRow(A, P));
    });

    const o = await run((tx) => getClanOverviewOps(tx, adminCtx));
    expect(o.ok).toBe(true);
    if (!o.ok) return;
    expect(o.value.mainFragment?.rootPersonId).toBe(P);
    expect(o.value.mainFragment?.personCount).toBe(8);
    expect(o.value.branches).toEqual([
      {
        branchCode: '1',
        headName: NAME.A,
        personCount: 7,
        tentativeCount: 1,
        headPersonId: A,
      },
    ]);

    const path = await run((tx) => getAncestryPathOps(tx, adminCtx, M));
    expect(path.ok).toBe(true);
    if (!path.ok) return;
    expect(path.value.steps.map((s) => s.personId)).toEqual([M, C3, B2, A, P]);
    expect(path.value.steps[0].generation).toBe(5); // was 4 before the new ancestor

    const branch = await run((tx) => getBranchViewOps(tx, adminCtx, B2));
    expect(branch.ok).toBe(true);
    if (!branch.ok) return;
    expect(branch.value.branchCode).toBe('1'); // B2 now sits inside A's (sole) branch
    const b2card = branch.value.generations
      .flatMap((g) => g.couples.map((c) => c.person))
      .find((c) => c.personId === B2);
    expect(b2card?.branchCode).toBe('1.2');
    expect(b2card?.generation).toBe(3);
  });
});
