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
  getNeighborhoodOps,
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

/**
 * Hai ca mà fixture gốc KHÔNG có, và vì thế hai lỗi chặn lọt qua tới tận code review 25/08:
 *   · V1 + V2 — hai vợ của B2, để bắt lỗi "một người hai vợ sinh hai node trùng id";
 *   · VX      — vợ của X1, gốc mảnh, để bắt lỗi "cụ tổ có vợ biến khỏi danh sách node".
 */
const V1 = uuidv7();
const V2 = uuidv7();
const VX = uuidv7();
const unionB2V1 = uuidv7();
/** W goá B1 rồi tái giá với em chồng B2 — hôn nhân nối dây, phả cổ chép thật. */
const unionWB2 = uuidv7();
const unionB2V2 = uuidv7();
const unionX1VX = uuidv7();

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
  V1: 'S13 Đỗ Thị Cả',
  V2: 'S13 Đỗ Thị Hai',
  VX: 'S13 Lê Thị Xa',
};

// Quản trị luôn có chỗ — vai đến từ gắn kết đang hoạt động (story 7-1). Chỗ ấy không cần là người trong bộ dữ liệu này.
const adminCtx: ViewerContext = { accountId: acc, clanId, personId: uuidv7(), role: 'admin' };
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

function unionRow(personId: string, uid: string = unionId) {
  return {
    id: uuidv7(),
    clanId,
    subjectPersonId: personId,
    kind: 'union-partner' as const,
    unionId: uid,
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
      personRow(V1, NAME.V1, { birth: '1952-01-01', death: '1990-01-01' }),
      personRow(V2, NAME.V2, { birth: '1960-01-01', death: '2015-01-01' }),
      personRow(VX, NAME.VX, { birth: '1905-01-01', death: '1970-01-01' }),
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
    await tx.insert(unionTable).values([
      { id: unionId, clanId, kind: 'marriage' },
      { id: unionB2V1, clanId, kind: 'marriage' },
      { id: unionWB2, clanId, kind: 'marriage' },
      { id: unionB2V2, clanId, kind: 'marriage' },
      { id: unionX1VX, clanId, kind: 'marriage' },
    ]);
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
      // B2 có HAI vợ; X1 (gốc mảnh) có vợ.
      unionRow(B2, unionB2V1),
      unionRow(V1, unionB2V1),
      unionRow(B2, unionB2V2),
      unionRow(V2, unionB2V2),
      unionRow(X1, unionX1VX),
      unionRow(VX, unionX1VX),
      // W có HAI đời chồng, và cả hai đều thuộc huyết thống — ca mà phép bầu node từng nuốt mất
      // người thứ hai.
      unionRow(W, unionWB2),
      unionRow(B2, unionWB2),
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
    // 11 = A,B1,B2,C1,C2,C3,M + W,WF + V1,V2: union edges pull married-in lines into the
    // fragment (sửa 22/08/2026 — spouses are connected, not "mảnh rời"). D (merged) not counted.
    // V1/V2 thêm 25/08 sau code review — hai vợ của B2, ca đã để lọt lỗi node trùng.
    expect(o.mainFragment?.personCount).toBe(11);
    expect(o.mainFragment?.tentativeCount).toBe(1); // M

    expect(o.unconnectedFragments.map((f) => [f.rootPersonId, f.personCount])).toEqual([
      [X1, 2], // X1 + vợ VX — vẫn tách hẳn khỏi mảnh chính, không có đường máu lẫn hôn nhân sang
    ]);
    expect(o.unconnectedFragments[0].tentativeCount).toBe(1); // X1 nameTier null
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
    const res = await run((tx) => getAncestryPathOps(tx, adminCtx, X1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.steps.map((s) => s.personId)).toEqual([X1]);
    expect(res.value.reachesMainRoot).toBe(false);
    expect(res.value.fragmentRootName).toBe(NAME.X1);
  });

  it('a married-in line walks its own blood path but belongs to the main fragment', async () => {
    const res = await run((tx) => getAncestryPathOps(tx, adminCtx, W));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Blood walk ends at WF (her father) — but the union edge makes the fragment the main one.
    expect(res.value.steps.map((s) => s.personId)).toEqual([W, WF]);
    expect(res.value.reachesMainRoot).toBe(true);
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

describe('vùng lân cận quanh một neo (story 5-2)', () => {
  /**
   * ── Ba bài dưới đây được thêm sau CODE REVIEW 25/08 ───────────────────────────────────
   * Cả ba lỗi chúng bắt đều đã lọt qua bộ test cũ, và lọt vì cùng một lý do: fixture không có
   * ai đa thê, và gốc mảnh duy nhất trong fixture (X1) thì độc thân. Bài test cũ
   * `new Set(ids).size === ids.length` xanh mà không chứng minh được gì.
   */
  it('một người HAI VỢ vẫn chỉ sinh MỘT node — không phát trùng', async () => {
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, B2, 2));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const ids = res.value.nodes.map((n) => n.person.personId);

    // Trước bản vá: vợ-1 phát node B2, rồi vợ-2 chưa bị đánh dấu nên phát node B2 LẦN NỮA.
    // `xepCay` khoá vị trí theo id ⇒ hai thẻ chồng khít lên nhau.
    expect(new Set(ids).size, 'có node trùng id').toBe(ids.length);
    expect(ids.filter((id) => id === B2)).toHaveLength(1);

    const nodeB2 = res.value.nodes.find((n) => n.person.personId === B2)!;
    // Ba: hai bà vợ V1/V2, cộng W — chị dâu goá mà B2 tái giá (hôn nhân nối dây, thêm 25/08 cho
    // bài C3 cửa hai ở cuối file). Cả ba đứng trên MỘT thẻ của B2.
    expect(nodeB2.partners.map((p) => p.personId).sort()).toEqual([V1, V2, W].sort());
    // Và hai người vợ KHÔNG được có node riêng — họ ở chung thẻ với chồng.
    expect(ids).not.toContain(V1);
    expect(ids).not.toContain(V2);
  });

  it('GỐC MẢNH có vợ vẫn là node chính, và vẫn đội vương miện', async () => {
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, X1, 1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Gốc mảnh KHÔNG có mã chi (chỉ con cháu mới có), nên phép bầu chỉ xét mã chi sẽ nhường node
    // cho người vợ — và cụ tổ biến khỏi danh sách, `isFragmentRoot` không bao giờ đúng.
    const nodeX1 = res.value.nodes.find((n) => n.person.personId === X1);
    expect(nodeX1, 'neo vào cụ tổ mà không node nào mang id của cụ').toBeTruthy();
    expect(nodeX1!.isFragmentRoot).toBe(true);
    expect(nodeX1!.partners.map((p) => p.personId)).toEqual([VX]);
    expect(res.value.nodes.map((n) => n.person.personId)).not.toContain(VX);
  });

  it('`exhausted` so TẬP NODE, không so số người trong bán kính', async () => {
    // Ca đúng của lỗi cũ: ở bán kính 1 quanh C1, người vợ W đã hiện trên thẻ B1 nhưng chưa vào
    // `bfsDistances`; sang bán kính 2 cô ấy vào ⇒ phép so cũ báo "chưa cạn" trong khi TẬP NODE
    // có thể không đổi. Nay so đúng thứ màn thật sự bày.
    const r1 = await run((tx) => getNeighborhoodOps(tx, adminCtx, X1, 1));
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    // Mảnh của X1 chỉ có X1 + vợ ⇒ nới thêm không ra node nào.
    expect(r1.value.exhausted).toBe(true);
    expect(r1.value.atMaxRadius).toBe(false);

    const r6 = await run((tx) => getNeighborhoodOps(tx, adminCtx, C1, 6));
    expect(r6.ok).toBe(true);
    if (!r6.ok) return;
    // Ở bán kính tối đa, `exhausted` KHÔNG được dùng để nói "hết người" — nó là chuyện khác.
    expect(r6.value.atMaxRadius).toBe(true);
  });

  it('bán kính 1: chỉ neo và người kề, cha ngoài vùng thành gốc của bố cục', async () => {
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, C1, 1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const v = res.value;

    expect(v.anchorPersonId).toBe(C1);
    expect(v.radius).toBe(1);
    expect(v.nodes.map((n) => n.person.personId).sort()).toEqual([B1, C1].sort());

    const nodeC1 = v.nodes.find((n) => n.person.personId === C1)!;
    const nodeB1 = v.nodes.find((n) => n.person.personId === B1)!;

    expect(nodeC1.distance).toBe(0);
    expect(nodeB1.distance).toBe(1);

    // C1 nhìn thấy cha nó trong vùng ⇒ có cạnh.
    expect(nodeC1.parentNodeId).toBe(B1);
    // Cha của B1 là A, nằm NGOÀI bán kính ⇒ null. Đây là mẹo làm xepCay() chạy cho lát cắt rời:
    // hàm ấy vốn lặp qua nhiều gốc, nên `null` là đủ, không phải sửa hàm bố cục.
    expect(nodeB1.parentNodeId).toBeNull();
    // …nhưng B1 KHÔNG phải cụ tổ của mảnh, nó chỉ đứng ở rìa bán kính. Thẻ không được đội
    // vương miện cho nó.
    expect(nodeB1.isFragmentRoot).toBe(false);

    // Còn nới ra được thì chưa cạn.
    expect(v.exhausted).toBe(false);
  });

  it('bạn đời NGOÀI bán kính vẫn nằm chung thẻ — vợ chồng là một chỗ trong phả', async () => {
    // W cách C1 hai bước (C1–B1–W) nên ở bán kính 1 nó ngoài vùng…
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, C1, 1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const nodeB1 = res.value.nodes.find((n) => n.person.personId === B1)!;
    // …nhưng vẫn phải hiện trên thẻ của B1, kẻo thẻ đọc thành một người goá.
    expect(nodeB1.partners.map((p) => p.personId)).toEqual([W]);
    // Hệ quả phải biết: số node KHÔNG bằng số phần tử BFS trả về.
    expect(res.value.nodes).toHaveLength(2);
  });

  it('vợ chồng cùng trong vùng: MỘT node, và người mang mã chi làm chính', async () => {
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, C1, 2));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const ids = res.value.nodes.map((n) => n.person.personId);

    // B1 (đường máu, mã chi '1') làm chính; W (kết hôn vào họ) là bạn đời trên cùng thẻ.
    expect(ids).toContain(B1);
    expect(ids).not.toContain(W);
    expect(new Set(ids).size).toBe(ids.length);

    const nodeB1 = res.value.nodes.find((n) => n.person.personId === B1)!;
    expect(nodeB1.partners.map((p) => p.personId)).toEqual([W]);

    /**
     * ĐÂY mới là lý do việc chọn ai làm chính không phải chuyện thẩm mỹ. `codeParent` chỉ có cho
     * người trên đường máu — lấy W làm chính thì cạnh nối lên cụ A biến mất, nhánh bị cắt lìa
     * khỏi gốc mà cây vẽ ra vẫn "đẹp", không lỗi, không cảnh báo.
     */
    const nodeA = res.value.nodes.find((n) => n.person.personId === A)!;
    expect(nodeA).toBeTruthy();
    expect(nodeB1.parentNodeId).toBe(nodeA.person.personId);
  });

  it('mảnh một người: cạn ngay ở bán kính 1', async () => {
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, X1, 1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.nodes.map((n) => n.person.personId)).toEqual([X1]);
    expect(res.value.nodes[0].parentNodeId).toBeNull();
    // X1 thì đúng là cụ xa nhất hiện biết của mảnh nó — vương miện ở đây là thật.
    expect(res.value.nodes[0].isFragmentRoot).toBe(true);
    // Nới thêm không ra thêm ai ⇒ nút "mở thêm một đời" phải tắt được.
    expect(res.value.exhausted).toBe(true);
  });

  it('bia mộ chuyển hướng sang người thắng, không phải not-found', async () => {
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, D, 1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.anchorPersonId).toBe(C1);
  });

  it('bán kính ngoài [1,6] là invalid; người không có là not-found', async () => {
    for (const r of [0, 7, 1.5]) {
      const bad = await run((tx) => getNeighborhoodOps(tx, adminCtx, C1, r));
      expect(bad.ok, `bán kính ${r}`).toBe(false);
      if (!bad.ok) expect(bad.error.code).toBe('invalid');
    }
    const missing = await run((tx) => getNeighborhoodOps(tx, adminCtx, uuidv7(), 2));
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe('not-found');
  });

  it('bán kính riêng tư áp trên canvas y như mọi lối đọc khác (AD-13/AD-21)', async () => {
    // M là trẻ vị thành niên còn sống. Khách vãng lai đứng ở C3 vẫn thấy CHỖ của M trên cây —
    // cây không được thủng — nhưng không thấy TÊN.
    const res = await run((tx) => getNeighborhoodOps(tx, guestCtx, C3, 1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const nodeM = res.value.nodes.find((n) => n.person.personId === M);
    expect(nodeM).toBeTruthy();
    expect(nodeM!.person.fullName).toBe(ANONYMOUS_LABEL);
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
    expect(o.value.mainFragment?.personCount).toBe(12); // 11 + P
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

describe('bạn đời chung hai người huyết thống (C3, cửa thứ hai — 25/08)', () => {
  /**
   * W goá B1 rồi tái giá với em chồng B2. Cả hai ông đều thuộc dòng, nên cả hai phải có thẻ.
   *
   * Bản trước nuốt cả `nhom` của người đang xử: vòng của W phát thẻ cho B1 rồi đánh dấu luôn B2
   * là "đã dùng", nên B2 không bao giờ được phát. Triệu chứng y hệt C4 — `getNeighborhood(B2)`
   * trả `anchorPersonId` là B2 mà không node nào mang id ấy — và con của B2 mất cạnh nối, rơi
   * xuống thành gốc bố cục rời.
   *
   * Bài này đỏ trước bản vá 25/08.
   */
  it('cả hai đời chồng đều có node riêng, và W đứng trên cả hai thẻ', async () => {
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, B1, 3));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const ids = res.value.nodes.map((n) => n.person.personId);
    expect(ids).toContain(B1);
    expect(ids).toContain(B2);
    expect(new Set(ids).size).toBe(ids.length); // và KHÔNG thẻ nào trùng id

    const banDoiCua = (id: string) =>
      res.value.nodes.find((n) => n.person.personId === id)?.partners.map((p) => p.personId) ?? [];
    expect(banDoiCua(B1)).toContain(W);
    expect(banDoiCua(B2)).toContain(W);
  });

  it('lấy chính B2 làm neo thì có node mang đúng id ấy', async () => {
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, B2, 2));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.anchorPersonId).toBe(B2);
    expect(res.value.nodes.map((n) => n.person.personId)).toContain(B2);
  });

  it('con của B2 vẫn treo vào thẻ B2, không rơi xuống thành gốc rời', async () => {
    const res = await run((tx) => getNeighborhoodOps(tx, adminCtx, A, 3));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const c3 = res.value.nodes.find((n) => n.person.personId === C3);
    expect(c3?.parentNodeId).toBe(B2);
  });
});
