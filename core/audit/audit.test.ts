/**
 * Story 1-6 — core/audit against the real DB (pattern: core/gates/rls.gate.test.ts).
 *
 * Fresh uuidv7 clan per run; every seeded name carries the "1-6" story prefix; cleanup runs
 * through ownerPool with SET LOCAL per clan (owner is under FORCE RLS too). Ops are exercised
 * directly with fabricated contexts — the index.ts surface needs a real Better Auth session.
 *
 * Seeded revision images mirror what core/person + core/assertion actually write:
 * person 'create' images carry NO name ({ id, clanId }); assertion 'create'/'remove' images are
 * full rows; promote/hide images are tier/status-only — so these tests also prove the
 * enrichment path (status-only revisions summarised via their assertion's full-row image).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { dbGlobal, withClanContext, ownerPool } from '@/db';
import { assertion, authUser, clan, person, revision, source } from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import { ANONYMOUS_LABEL } from '@/core/identity/privacy';
import type { GuestContext, SessionContext } from '@/core/identity/session';
import * as ops from './ops';

const owner = ownerPool();
const clanId = uuidv7();

const accA = `1-6-acc-${uuidv7()}`;
const accB = `1-6-acc-${uuidv7()}`;

const pDead = uuidv7(); // cụ đã mất — history open to everyone
const pLiving = uuidv7(); // living adult
const pRelative = uuidv7(); // living child of pLiving (distance 1)
const pStranger = uuidv7(); // living member node with no edges — out of radius
const pMinor = uuidv7(); // living minor
const pFather = uuidv7(); // dead — getTreeAt replay
const pChild = uuidv7(); // dead — getTreeAt replay

const aBirth = uuidv7(); // birth assertion on pDead (create → promote → hide)
const aNameFather = uuidv7();
const aNameChild = uuidv7();
const aEdgeReplay = uuidv7(); // parent-child assertion whose removal getTreeAt must survive

const guest: GuestContext = { accountId: null, clanId, personId: null, role: 'guest' };
const admin: SessionContext = { accountId: accB, clanId, personId: null, role: 'admin' };
const stranger: SessionContext = { accountId: accA, clanId, personId: pStranger, role: 'member' };
const relative: SessionContext = { accountId: accA, clanId, personId: pRelative, role: 'member' };

const T = (s: string) => new Date(s);

beforeAll(async () => {
  await dbGlobal.insert(authUser).values([
    { id: accA, name: 'Khánh 1-6', email: `${accA}@test.local` },
    { id: accB, name: 'Hạnh 1-6', email: `${accB}@test.local` },
  ]);

  await withClanContext(clanId, async (tx) => {
    await tx.insert(clan).values({ id: clanId, name: 'Họ kiểm thử 1-6' });

    const people = [
      { id: pDead, fullName: '1-6 Nguyễn Văn Cố', birthDate: '1941-01-01', deathDate: '2001-01-01', isLiving: false },
      { id: pLiving, fullName: '1-6 Nguyễn Văn Sống', birthDate: '1980-05-01', isLiving: true },
      { id: pRelative, fullName: '1-6 Nguyễn Văn Con', birthDate: '2004-02-01', isLiving: true },
      { id: pStranger, fullName: '1-6 Nguyễn Văn Xa', birthDate: '1985-01-01', isLiving: true },
      { id: pMinor, fullName: '1-6 Nguyễn Bé Nhỏ', birthDate: '2015-06-01', isLiving: true },
      { id: pFather, fullName: '1-6 Nguyễn Văn Cha', isLiving: false },
      { id: pChild, fullName: '1-6 Nguyễn Văn Trai', isLiving: false },
    ];
    await tx
      .insert(person)
      .values(people.map((p) => ({ ...p, clanId, nameFolded: chuanHoa(p.fullName) })));

    const srcId = uuidv7();
    await tx.insert(source).values({
      id: srcId,
      clanId,
      kind: 'seed-import',
      description: '1-6 nguồn kiểm thử',
      createdByAccountId: accA,
    });

    // Live edge for the radius BFS (read from the assertion TABLE): pRelative is child of pLiving.
    await tx.insert(assertion).values({
      id: uuidv7(),
      clanId,
      subjectPersonId: pRelative,
      kind: 'parent-child',
      objectPersonId: pLiving,
      value: { relation: 'blood' },
      sourceId: srcId,
      confidence: 'chac-chan',
      tier: 'tentative',
      status: 'live',
      createdByAccountId: accA,
    });

    const birthImage = {
      id: aBirth,
      kind: 'birth',
      subjectPersonId: pDead,
      value: { date: '1941-01-01', precision: 'year' },
      confidence: 'ton-nghi',
      tier: 'tentative',
      status: 'live',
    };
    const edgeImage = {
      id: aEdgeReplay,
      kind: 'parent-child',
      subjectPersonId: pChild,
      objectPersonId: pFather,
      value: { relation: 'blood' },
      confidence: 'theo-loi-ke',
      tier: 'tentative',
      status: 'live',
    };
    const nameImage = (id: string, subject: string, fullName: string) => ({
      id,
      kind: 'name',
      subjectPersonId: subject,
      value: { fullName },
      confidence: 'chac-chan',
      tier: 'tentative',
      status: 'live',
    });

    const rev = (row: {
      accountId: string;
      entity: 'person' | 'assertion' | 'merge';
      entityId: string;
      action: 'create' | 'promote' | 'hide' | 'remove';
      before?: unknown;
      after?: unknown;
      note?: string;
      at: string;
    }) => ({
      id: uuidv7(),
      clanId,
      accountId: row.accountId,
      entity: row.entity,
      entityId: row.entityId,
      action: row.action,
      before: row.before ?? null,
      after: row.after ?? null,
      note: row.note ?? '',
      createdAt: T(row.at),
    });

    await tx.insert(revision).values([
      // ── History on pDead: create → birth create → promote → hide (newest-first later) ──
      rev({ accountId: accA, entity: 'person', entityId: pDead, action: 'create', after: { id: pDead, clanId }, at: '2026-01-01T08:00:00Z' }),
      rev({ accountId: accA, entity: 'assertion', entityId: aBirth, action: 'create', after: birthImage, at: '2026-01-02T08:00:00Z' }),
      rev({
        accountId: accB, entity: 'assertion', entityId: aBirth, action: 'promote',
        before: { tier: 'tentative', promotedAt: null, promotedByAccountId: null },
        after: { tier: 'official', promotedAt: '2026-01-03T08:00:00Z', promotedByAccountId: accB },
        at: '2026-01-03T08:00:00Z',
      }),
      rev({
        accountId: accB, entity: 'assertion', entityId: aBirth, action: 'hide',
        before: { status: 'live' }, after: { status: 'hidden' }, note: 'chạm đến người đang sống',
        at: '2026-01-04T08:00:00Z',
      }),

      // ── Replay history: two persons + names, an edge created then REMOVED (AD-4) ──
      rev({ accountId: accA, entity: 'person', entityId: pFather, action: 'create', after: { id: pFather, clanId }, at: '2026-02-01T00:00:00Z' }),
      rev({ accountId: accA, entity: 'assertion', entityId: aNameFather, action: 'create', after: nameImage(aNameFather, pFather, '1-6 Nguyễn Văn Cha'), at: '2026-02-01T00:00:10Z' }),
      rev({ accountId: accA, entity: 'person', entityId: pChild, action: 'create', after: { id: pChild, clanId }, at: '2026-02-01T00:00:20Z' }),
      rev({ accountId: accA, entity: 'assertion', entityId: aNameChild, action: 'create', after: nameImage(aNameChild, pChild, '1-6 Nguyễn Văn Trai'), at: '2026-02-01T00:00:30Z' }),
      rev({ accountId: accA, entity: 'assertion', entityId: aEdgeReplay, action: 'create', after: edgeImage, at: '2026-02-02T00:00:00Z' }),
      rev({ accountId: accB, entity: 'assertion', entityId: aEdgeReplay, action: 'remove', before: edgeImage, note: 'nhầm đời', at: '2026-02-04T00:00:00Z' }),

      // ── Person-create revisions feeding the "Vừa vào phả" box ──
      rev({ accountId: accA, entity: 'person', entityId: pLiving, action: 'create', after: { id: pLiving, clanId }, at: '2026-03-01T00:00:00Z' }),
      rev({ accountId: accA, entity: 'person', entityId: pMinor, action: 'create', after: { id: pMinor, clanId }, at: '2026-03-02T00:00:00Z' }),

      // Later duplicate 'create' for pFather — attributionFor must keep the EARLIEST.
      rev({ accountId: accB, entity: 'person', entityId: pFather, action: 'create', after: { id: pFather, clanId }, at: '2026-03-05T00:00:00Z' }),
    ]);
  });
});

afterAll(async () => {
  await owner.query('BEGIN');
  await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
  for (const tbl of ['revision', 'assertion', 'source', 'person']) {
    await owner.query(`DELETE FROM "${tbl}" WHERE clan_id = $1`, [clanId]);
  }
  await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
  await owner.query('COMMIT');
  await owner.query('DELETE FROM "user" WHERE id = ANY($1)', [[accA, accB]]);
  await owner.end();
});

describe('getPersonHistory', () => {
  it('1-6 lists create + promote + hide with readable Vietnamese summaries, newest first', async () => {
    const res = await withClanContext(clanId, (tx) => ops.getPersonHistory(tx, guest, pDead));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const entries = res.value;
    expect(entries).toHaveLength(4);
    expect(entries.map((e) => e.action)).toEqual(['hide', 'promote', 'create', 'create']);
    // Status-only promote/hide images are summarised via the create image (enrichment path).
    expect(entries[0].summary).toMatch(/ẩn theo báo cáo/);
    expect(entries[0].summary).toMatch(/năm sinh 1941/);
    expect(entries[1].summary).toMatch(/duyệt lên Tầng chính thức/);
    expect(entries[2].summary).toBe('thêm năm sinh 1941 (tồn nghi)');
    expect(entries[3].summary).toMatch(/thêm vào phả/);
    expect(entries[2].byName).toBe('Khánh 1-6');
    expect(entries[0].byName).toBe('Hạnh 1-6');
    expect(entries[0].at > entries[3].at).toBe(true);
  });

  it('1-6 refuses a living person to out-of-radius viewers and guests, allows kin in radius (AD-21)', async () => {
    const forStranger = await withClanContext(clanId, (tx) =>
      ops.getPersonHistory(tx, stranger, pLiving),
    );
    expect(forStranger.ok).toBe(false);
    if (!forStranger.ok) expect(forStranger.error.code).toBe('forbidden');

    const forGuest = await withClanContext(clanId, (tx) => ops.getPersonHistory(tx, guest, pLiving));
    expect(forGuest.ok).toBe(false);
    if (!forGuest.ok) expect(forGuest.error.code).toBe('forbidden');

    // Distance 1 over the live parent-child edge — full visibility, history opens.
    const forRelative = await withClanContext(clanId, (tx) =>
      ops.getPersonHistory(tx, relative, pLiving),
    );
    expect(forRelative.ok).toBe(true);

    const missing = await withClanContext(clanId, (tx) =>
      ops.getPersonHistory(tx, admin, uuidv7()),
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe('not-found');
  });
});

describe('getTreeAt', () => {
  it('1-6 reconstructs the edge before its removal and its absence after (AD-4)', async () => {
    // Before anyone exists.
    const empty = await withClanContext(clanId, (tx) =>
      ops.getTreeAt(tx, admin, T('2026-01-31T00:00:00Z')),
    );
    expect(empty.ok).toBe(true);
    if (empty.ok) {
      expect(empty.value.persons.map((p) => p.personId)).not.toContain(pFather);
    }

    // Between edge creation and removal: the claim is live.
    const during = await withClanContext(clanId, (tx) =>
      ops.getTreeAt(tx, admin, T('2026-02-03T00:00:00Z')),
    );
    expect(during.ok).toBe(true);
    if (during.ok) {
      expect(during.value.parentChildEdges).toContainEqual({ childId: pChild, parentId: pFather });
      const father = during.value.persons.find((p) => p.personId === pFather);
      expect(father?.fullName).toBe('1-6 Nguyễn Văn Cha'); // projected from the name assertion
      expect(father?.tier).toBe('tentative');
    }

    // After removal: the edge is gone from the reconstruction, the persons remain —
    // and the removed claim is still REPLAYABLE from the log (the 'during' read above).
    const after = await withClanContext(clanId, (tx) =>
      ops.getTreeAt(tx, admin, T('2026-02-05T00:00:00Z')),
    );
    expect(after.ok).toBe(true);
    if (after.ok) {
      expect(after.value.parentChildEdges).not.toContainEqual({ childId: pChild, parentId: pFather });
      const ids = after.value.persons.map((p) => p.personId);
      expect(ids).toContain(pFather);
      expect(ids).toContain(pChild);
    }
  });

  it('1-6 is restricted to admin and branch-head', async () => {
    const asMember = await withClanContext(clanId, (tx) => ops.getTreeAt(tx, stranger, new Date()));
    expect(asMember.ok).toBe(false);
    if (!asMember.ok) expect(asMember.error.code).toBe('forbidden');

    const asGuest = await withClanContext(clanId, (tx) => ops.getTreeAt(tx, guest, new Date()));
    expect(asGuest.ok).toBe(false);
    if (!asGuest.ok) expect(asGuest.error.code).toBe('forbidden');
  });
});

describe('getRecentAdditions', () => {
  it('1-6 anonymises living minors for guests, keeps names for the dead and limited-visible adults', async () => {
    const res = await withClanContext(clanId, (tx) => ops.getRecentAdditions(tx, guest, 20));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const minor = res.value.find((e) => e.personId === pMinor);
    expect(minor).toBeTruthy();
    expect(minor?.fullName).toBe(ANONYMOUS_LABEL); // minors: anonymous outside the radius, always
    expect(minor?.byName).toBe('Khánh 1-6'); // the contributor is never hidden

    const living = res.value.find((e) => e.personId === pLiving);
    expect(living?.fullName).toBe('1-6 Nguyễn Văn Sống'); // limited still shows the name

    const dead = res.value.find((e) => e.personId === pDead);
    expect(dead?.fullName).toBe('1-6 Nguyễn Văn Cố'); // the dead are fully visible

    // Newest first.
    const ats = res.value.map((e) => e.at);
    expect([...ats].sort().reverse()).toEqual(ats);

    // Approvers see the minor's real name (one cannot approve what one cannot read).
    const forAdmin = await withClanContext(clanId, (tx) => ops.getRecentAdditions(tx, admin, 20));
    expect(forAdmin.ok).toBe(true);
    if (forAdmin.ok) {
      expect(forAdmin.value.find((e) => e.personId === pMinor)?.fullName).toBe('1-6 Nguyễn Bé Nhỏ');
    }
  });

  it('1-6 respects the limit', async () => {
    const res = await withClanContext(clanId, (tx) => ops.getRecentAdditions(tx, guest, 2));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toHaveLength(2);
  });
});

describe('attributionFor', () => {
  it('1-6 batches earliest person-create attributions; unknown ids are absent', async () => {
    const res = await withClanContext(clanId, (tx) =>
      ops.attributionFor(tx, admin, [pFather, pChild, uuidv7()]),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(Object.keys(res.value)).toHaveLength(2);
    // pFather has a later duplicate create by accB — the EARLIEST (accA) must win.
    expect(res.value[pFather]).toEqual({
      byName: 'Khánh 1-6',
      at: T('2026-02-01T00:00:00Z').toISOString(),
    });
    expect(res.value[pChild]?.byName).toBe('Khánh 1-6');

    const empty = await withClanContext(clanId, (tx) => ops.attributionFor(tx, admin, []));
    expect(empty.ok).toBe(true);
    if (empty.ok) expect(empty.value).toEqual({});
  });
});

describe('malformed ids (Postgres 22P02)', () => {
  it('1-6 a non-uuid person id reads as not-found, never a thrown driver error', async () => {
    for (const bad of ['khong-phai-uuid', '', "'; DROP TABLE person; --", '../../etc/passwd']) {
      const res = await withClanContext(clanId, (tx) => ops.getPersonHistory(tx, admin, bad));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('not-found');
    }
  });

  it('1-6 attributionFor drops non-uuid ids instead of failing the whole batch', async () => {
    const res = await withClanContext(clanId, (tx) =>
      ops.attributionFor(tx, admin, ['khong-phai-uuid', pChild]),
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(Object.keys(res.value)).toEqual([pChild]);
  });
});
