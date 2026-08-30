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
const pNoiA = uuidv7(); // place ids for the journal (story 7-4) — rows only in `revision`, no place row needed
const pNoiB = uuidv7();

const guest: GuestContext = { accountId: null, clanId, personId: null, role: 'guest' };
// Vai `admin` đến từ một gắn kết ĐANG HOẠT ĐỘNG, nên quản trị luôn có `personId` — ngữ cảnh
// `personId: null` kèm vai là trạng thái phiên thật không sinh ra (story 7-1).
const admin: SessionContext = { accountId: accB, clanId, personId: uuidv7(), role: 'admin' };
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
      entity: 'person' | 'assertion' | 'merge' | 'place';
      entityId: string;
      action: 'create' | 'promote' | 'hide' | 'remove' | 'update' | 'merge';
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

      // ── Story 7-4: hàng NƠI CHỐN — sổ chung phải đọc được (nợ 6-4) ──
      rev({ accountId: accB, entity: 'place', entityId: pNoiA, action: 'update', before: { name: '1-6 Dinh Hoa', parentUnit: '' }, after: { name: '1-6 Định Hoá', parentUnit: 'Thái Nguyên' }, at: '2026-04-01T00:00:00Z' }),
      rev({ accountId: accB, entity: 'place', entityId: pNoiB, action: 'merge', before: { mergedInto: null, nhan: '1-6 Quang Trung, Vũng Tàu' }, after: { mergedInto: pNoiA, winnerId: pNoiA, nhanThang: '1-6 Định Hoá, Thái Nguyên' }, at: '2026-04-02T00:00:00Z' }),
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

    // Khách chưa đăng nhập: qua `gateApprover` (story 7-1) là `unauthenticated` — đúng hơn
    // 'forbidden', vì adapter dẫn khách về cửa đăng nhập chứ không nói "không đủ quyền".
    const asGuest = await withClanContext(clanId, (tx) => ops.getTreeAt(tx, guest, new Date()));
    expect(asGuest.ok).toBe(false);
    if (!asGuest.ok) expect(asGuest.error.code).toBe('unauthenticated');
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

describe('listJournalOps — sổ nhật ký chung (story 7-4, FR-39)', () => {
  it('quản trị đọc được mọi thực thể, mới nhất trước; hàng nơi chốn có câu đọc được', async () => {
    const r = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, {}));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const at = r.value.entries.map((e) => e.at);
    expect([...at].sort().reverse()).toEqual(at);
    const noi = r.value.entries.filter((e) => e.entity === 'place');
    expect(noi.map((e) => e.summary)).toEqual([
      'gộp nơi "1-6 Quang Trung, Vũng Tàu" vào "1-6 Định Hoá, Thái Nguyên"',
      'sửa nơi "1-6 Dinh Hoa" → "1-6 Định Hoá, Thái Nguyên"',
    ]);
    // Giá trị bị loại đọc lại được, kèm lý do nguyên văn (AD-4).
    const go = r.value.entries.find((e) => e.action === 'remove' && e.entity === 'assertion');
    expect(go?.summary).toContain('gỡ quan hệ cha mẹ – con');
    expect(go?.note).toBe('nhầm đời');
    expect(go?.nguoi?.fullName).toBe('1-6 Nguyễn Văn Trai');
  });

  it('lọc theo loại và hành động đi xuống SQL; lọc theo người dùng CHUNG phép của getPersonHistory', async () => {
    const noi = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { loai: 'place' }));
    expect(noi.ok && noi.value.entries.every((e) => e.entity === 'place') && noi.value.entries.length === 2).toBe(true);
    const go = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { hanh: 'remove' }));
    expect(go.ok && go.value.entries.every((e) => e.action === 'remove')).toBe(true);

    const soChung = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { nguoi: pDead }));
    const motNguoi = await withClanContext(clanId, (tx) => ops.getPersonHistory(tx, admin, pDead));
    expect(soChung.ok && motNguoi.ok).toBe(true);
    if (!soChung.ok || !motNguoi.ok) return;
    expect(soChung.value.entries.map((e) => e.summary)).toEqual(motNguoi.value.map((h) => h.summary));
  });

  it('con trỏ trang: hai trang không chồng nhau, không bỏ sót; hết thì `tiep` null', async () => {
    const t1 = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { limit: 3 }));
    expect(t1.ok && t1.value.entries.length === 3 && t1.value.tiep !== null).toBe(true);
    if (!t1.ok || !t1.value.tiep) return;
    const t2 = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { limit: 100, truoc: t1.value.tiep! }));
    expect(t2.ok).toBe(true);
    if (!t2.ok) return;
    const tatCa = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, {}));
    if (!tatCa.ok) return;
    const ids1 = new Set(t1.value.entries.map((e) => e.id));
    expect(t2.value.entries.some((e) => ids1.has(e.id))).toBe(false);
    expect(t1.value.entries.length + t2.value.entries.length).toBe(tatCa.value.entries.length);
    expect(t2.value.tiep).toBeNull();
  });

  it('thành viên ⇒ forbidden; khách ⇒ unauthenticated (qua gateApprover); id người không phải uuid ⇒ rỗng, không ném', async () => {
    const tv = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, stranger, {}));
    expect(!tv.ok && tv.error.code === 'forbidden').toBe(true);
    const kh = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, guest, {}));
    expect(!kh.ok && kh.error.code === 'unauthenticated').toBe(true);
    const chuaGan = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, { ...admin, personId: null, role: 'guest' }, {}));
    expect(!chuaGan.ok && chuaGan.error.code === 'unattached').toBe(true);
    // Lọc hành động chỉ-trạng-thái (hide): ảnh đầy đủ nằm ở trang khác — vẫn phải ra kind và người.
    const an = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { hanh: 'hide' }));
    expect(an.ok && an.value.entries.length > 0 && an.value.entries.every((e) => !e.summary.endsWith('thông tin') && e.nguoi !== undefined)).toBe(true);
    const xau = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { nguoi: 'không-phải-uuid' }));
    expect(xau.ok && xau.value.entries.length === 0).toBe(true);
  });
});

describe('listJournalOps — con trỏ đủ micro-giây (code review 7-4)', () => {
  it('ba hàng ghi trong MỘT transaction (cùng now() tới µs) không rơi khỏi trang sau', async () => {
    // Ghi ba revision không đặt createdAt: `now()` ổn định trong transaction ⇒ ba mốc bằng nhau ở µs.
    // Đây là hình mà `writeRevision` sinh ra (người + nguồn + khẳng định một lượt) và `T()` ms-tròn
    // của các bài trên không dựng được.
    const ids = [uuidv7(), uuidv7(), uuidv7()];
    await withClanContext(clanId, (tx) =>
      tx.insert(revision).values(ids.map((id) => ({ id, clanId, accountId: accB, entity: 'clan' as const, entityId: clanId, action: 'update' as const, before: null, after: null, note: '7-4 µs' }))),
    );
    const t1 = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { loai: 'clan', limit: 2 }));
    expect(t1.ok && t1.value.entries.length === 2 && t1.value.tiep !== null).toBe(true);
    if (!t1.ok || !t1.value.tiep) return;
    const t2 = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { loai: 'clan', limit: 2, truoc: t1.value.tiep! }));
    expect(t2.ok).toBe(true);
    if (!t2.ok) return;
    const thay = new Set([...t1.value.entries, ...t2.value.entries].map((e) => e.id));
    for (const id of ids) expect(thay.has(id), id).toBe(true);
    // Con trỏ trả về là chuỗi của Postgres (có phần lẻ giây), không phải ISO ms.
    expect(t1.value.tiep.at).toMatch(/\d{2}:\d{2}:\d{2}\.\d+/);
    // Con trỏ hỏng ⇒ invalid, không ném.
    const xau = await withClanContext(clanId, (tx) => ops.listJournalOps(tx, admin, { truoc: { at: '2026-01-01T00:00:00Z', id: 'abc' } }));
    expect(!xau.ok && xau.error.code === 'invalid').toBe(true);
  });
});
