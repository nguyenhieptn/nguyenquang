/**
 * Task G1 — person read surface + identity conveniences. Real DB, pattern from
 * core/tree/tree.test.ts: fresh uuidv7 clan per run, data prefixed G1, ops exercised with
 * fabricated viewer contexts (build contract § layering), cleanup via ownerPool.
 *
 * Seed graph (main fragment):
 *        A (1920–1990)
 *        |
 *        B1 (1945–2000) ⚭ W (living 1948)     [union U1]
 *        |
 *        C1 (living 1975) ⚭ S (living 1976)   [union U2]
 *        |
 *        M (living minor 2015)
 * Tombstone: D (mergedInto C1). Assertions about C1 carry document + told-by sources.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { eq } from 'drizzle-orm';
import { dbGlobal, ownerPool, withClanContext, type Tx } from '@/db';
import {
  assertion,
  attachment,
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
import type { GuestContext, SessionContext, ViewerContext } from '@/core/identity/session';
import { getClanInfoOp, getMyAttachmentOp, getMyPersonFlagsOp } from '@/core/identity/info';
import { lookupAccountNames } from '@/core/assertion/ops';
import { getPersonOps } from './read-ops';

const owner = ownerPool();
const clanId = uuidv7();
const acc = `g1-acc-${uuidv7()}`;
const accUnattached = `g1-acc2-${uuidv7()}`;

const src1 = uuidv7(); // document
const src2 = uuidv7(); // told-by W
const U1 = uuidv7();
const U2 = uuidv7();

const A = uuidv7();
const B1 = uuidv7();
const W = uuidv7();
const C1 = uuidv7();
const S = uuidv7();
const M = uuidv7();
const D = uuidv7();

const NAME = {
  A: 'G1 Nguyễn Văn Tổ',
  B1: 'G1 Nguyễn Văn Bá',
  W: 'G1 Trần Thị Dâu',
  C1: 'G1 Nguyễn Văn Cả',
  S: 'G1 Lê Thị Sen',
  M: 'G1 Nguyễn Văn Măng',
  D: 'G1 Nguyễn Văn Cả Trùng',
};

const memberC1: ViewerContext = { accountId: acc, clanId, personId: C1, role: 'member' };
const guest: GuestContext = { accountId: null, clanId, personId: null, role: 'guest' };

function personRow(
  id: string,
  fullName: string,
  o: { birth?: string; death?: string; living?: boolean; mergedInto?: string } = {},
) {
  return {
    id,
    clanId,
    mergedInto: o.mergedInto ?? null,
    fullName,
    nameFolded: chuanHoa(fullName),
    nameTier: 'official' as Tier,
    nameConfidence: 'chac-chan' as const,
    birthDate: o.birth ?? null,
    deathDate: o.death ?? null,
    isLiving: o.living ?? false,
  };
}

function assertionRow(o: {
  subject: string;
  kind: 'name' | 'gender' | 'birth' | 'death' | 'parent-child' | 'union-partner' | 'note';
  object?: string;
  unionId?: string;
  value?: unknown;
  sourceId?: string;
  status?: 'live' | 'hidden';
  tier?: Tier;
}) {
  return {
    id: uuidv7(),
    clanId,
    subjectPersonId: o.subject,
    kind: o.kind,
    objectPersonId: o.object ?? null,
    unionId: o.unionId ?? null,
    value: o.value ?? {},
    sourceId: o.sourceId ?? src1,
    confidence: 'theo-loi-ke' as const,
    tier: o.tier ?? ('tentative' as Tier),
    status: o.status ?? ('live' as const),
    createdByAccountId: acc,
  };
}

const run = <T>(fn: (tx: Tx) => Promise<T>) => withClanContext(clanId, fn);

beforeAll(async () => {
  await run(async (tx) => {
    await tx.insert(clan).values({
      id: clanId,
      name: 'G1 Dòng Họ Thử',
      settings: {
        surname: 'Nguyễn',
        middleName: 'Quang',
        motto: 'Ẩm hà tư nguyên',
        mottoPhonetic: 'Uống nước nhớ nguồn',
        extra: 123, // non-contract key — must be dropped
        empty: '',
      },
    });
    await tx.insert(person).values([
      personRow(A, NAME.A, { birth: '1920-01-01', death: '1990-01-01' }),
      personRow(B1, NAME.B1, { birth: '1945-01-01', death: '2000-01-01' }),
      personRow(W, NAME.W, { birth: '1948-01-01', living: true }),
      personRow(C1, NAME.C1, { birth: '1975-01-01', living: true }),
      personRow(S, NAME.S, { birth: '1976-01-01', living: true }),
      personRow(M, NAME.M, { birth: '2015-06-01', living: true }),
      personRow(D, NAME.D, { birth: '1975-01-01', living: true, mergedInto: C1 }),
    ]);
    await tx.insert(source).values([
      { id: src1, clanId, kind: 'document', description: 'G1 gia phả giấy 1998', createdByAccountId: acc },
      {
        id: src2,
        clanId,
        kind: 'told-by',
        description: 'G1 bà Dâu kể',
        toldByPersonId: W,
        createdByAccountId: acc,
      },
    ]);
    await tx.insert(unionTable).values([
      { id: U1, clanId, kind: 'marriage' },
      { id: U2, clanId, kind: 'marriage' },
    ]);
    await tx.insert(assertion).values([
      // Edges (subject = CHILD, object = PARENT — AD-18) + union memberships.
      assertionRow({ subject: B1, kind: 'parent-child', object: A, value: { relation: 'blood' } }),
      assertionRow({ subject: C1, kind: 'parent-child', object: B1, value: { relation: 'blood' } }),
      assertionRow({ subject: M, kind: 'parent-child', object: C1, value: { relation: 'blood' } }),
      assertionRow({ subject: B1, kind: 'union-partner', unionId: U1 }),
      assertionRow({ subject: W, kind: 'union-partner', unionId: U1 }),
      assertionRow({ subject: C1, kind: 'union-partner', unionId: U2 }),
      assertionRow({ subject: S, kind: 'union-partner', unionId: U2 }),
      // Claims about C1 for the assertion panel.
      assertionRow({ subject: C1, kind: 'name', value: { fullName: NAME.C1 }, tier: 'official' }),
      assertionRow({
        subject: C1,
        kind: 'birth',
        value: { date: '1975-01-01', precision: 'approximate' },
        sourceId: src2,
      }),
      assertionRow({ subject: C1, kind: 'note', value: { text: 'giỏi chữ Nho' } }),
      // Hidden claim — must NOT appear (AD-17).
      assertionRow({ subject: C1, kind: 'note', value: { text: 'đã bị ẩn' }, status: 'hidden' }),
    ]);
    // FR-39 attribution for C1 and M.
    await tx.insert(revision).values([
      {
        id: uuidv7(),
        clanId,
        accountId: acc,
        entity: 'person' as const,
        entityId: C1,
        action: 'create' as const,
        after: { fullName: NAME.C1 },
      },
      {
        id: uuidv7(),
        clanId,
        accountId: acc,
        entity: 'person' as const,
        entityId: M,
        action: 'create' as const,
        after: { fullName: NAME.M },
      },
    ]);
  });
  await dbGlobal.insert(authUser).values({
    id: acc,
    name: 'Khánh G1',
    email: `${acc}@test.local`,
  });
});

afterAll(async () => {
  try {
    await owner.query('BEGIN');
    await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
    for (const tbl of ['attachment', 'assertion', 'revision', 'source', 'union', 'person']) {
      await owner.query(`DELETE FROM "${tbl}" WHERE clan_id = $1`, [clanId]);
    }
    await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
    await owner.query('COMMIT');
    await owner.query('DELETE FROM "user" WHERE id = $1', [acc]);
  } finally {
    await owner.end();
  }
});

describe('getPersonOps — full visibility (member on own line)', () => {
  it('returns card + relations + every live assertion, human Vietnamese value text', async () => {
    const res = await run((tx) => getPersonOps(tx, memberC1, C1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const p = res.value;

    expect(p.visibility).toBe('full');
    expect(p.redirectedFrom).toBeUndefined();
    expect(p.card.personId).toBe(C1);
    expect(p.card.fullName).toBe(NAME.C1);
    expect(p.card.lifespan).toBe('sinh 1975'); // living ⇒ year only, even at full (FR-37)
    expect(p.card.generation).toBe(3);
    expect(p.card.attribution).toEqual({ byAccountId: acc, at: expect.any(String) });

    expect(p.relations.parents.map((c) => c.personId)).toEqual([B1]);
    expect(p.relations.parents[0].fullName).toBe(NAME.B1);
    expect(p.relations.children.map((c) => c.personId)).toEqual([M]);
    expect(p.relations.children[0].fullName).toBe(NAME.M); // distance 1 → full, real name
    expect(p.relations.partners.map((c) => c.personId)).toEqual([S]);
    expect(p.relations.partners[0].fullName).toBe(NAME.S);

    // Live claims about C1: parent-child, union-partner, name, birth, note — hidden excluded.
    expect(p.assertions).toBeDefined();
    const byKind = new Map(p.assertions!.map((a) => [a.kind, a]));
    expect(p.assertions).toHaveLength(5);

    expect(byKind.get('name')!.valueText).toBe(`tên ${NAME.C1}`);
    expect(byKind.get('name')!.tier).toBe('official');
    expect(byKind.get('name')!.sourceKind).toBe('document');
    expect(byKind.get('name')!.sourceDescription).toBe('G1 gia phả giấy 1998');

    const birth = byKind.get('birth')!;
    expect(birth.valueText).toBe('năm sinh 1975 (ước chừng)');
    expect(birth.sourceKind).toBe('told-by');
    expect(birth.toldByName).toBe(NAME.W); // resolved inside the tx, radius-filtered
    expect(birth.confidence).toBe('theo-loi-ke');
    expect(birth.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect(byKind.get('parent-child')!.valueText).toBe(`là con ruột của ${NAME.B1}`);
    expect(byKind.get('union-partner')!.valueText).toBe(`vợ/chồng với ${NAME.S}`);
    expect(byKind.get('note')!.valueText).toBe('ghi chú: giỏi chữ Nho');

    // createdByName finishing pattern: account ids resolve via dbGlobal AFTER the tx.
    expect(byKind.get('name')!.createdByAccountId).toBe(acc);
    const names = await lookupAccountNames([acc]);
    expect(names.get(acc)).toBe('Khánh G1');
  });
});

describe('getPersonOps — limited visibility (guest, living adult)', () => {
  it('keeps name + position + birth YEAR, withholds assertions, anonymizes minor child card', async () => {
    const res = await run((tx) => getPersonOps(tx, guest, C1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const p = res.value;

    expect(p.visibility).toBe('limited');
    expect(p.card.fullName).toBe(NAME.C1);
    expect(p.card.lifespan).toBe('sinh 1975'); // year only, never a full date
    expect(p.assertions).toBeUndefined(); // NO assertions outside 'full' (AD-21)

    // Relations still drawn, each card filtered independently: the minor child is a placeholder.
    expect(p.relations.children).toHaveLength(1);
    expect(p.relations.children[0].fullName).toBe(ANONYMOUS_LABEL);
    expect(p.relations.children[0].lifespan).toBe('');
    expect(p.relations.children[0].attribution).toBeNull();
    // The dead parent stays fully named for everyone.
    expect(p.relations.parents[0].fullName).toBe(NAME.B1);
  });
});

describe('getPersonOps — anonymous subject (minor, guest viewer)', () => {
  it('renders the placeholder card, EMPTY relations, no assertions — link kept, detail gone', async () => {
    const res = await run((tx) => getPersonOps(tx, guest, M));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const p = res.value;

    expect(p.visibility).toBe('anonymous');
    expect(p.card.personId).toBe(M);
    expect(p.card.fullName).toBe(ANONYMOUS_LABEL);
    expect(p.card.lifespan).toBe('');
    expect(p.card.attribution).toBeNull(); // attribution would leak who added the child
    expect(p.card.generation).toBe(4); // the genealogical position survives
    expect(p.relations).toEqual({ parents: [], children: [], partners: [] });
    expect(p.assertions).toBeUndefined();
  });
});

describe('getPersonOps — merged tombstone + absent id', () => {
  it('follows mergedInto to the winner and notes redirectedFrom; truly absent → not-found', async () => {
    const res = await run((tx) => getPersonOps(tx, memberC1, D));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.card.personId).toBe(C1);
    expect(res.value.card.fullName).toBe(NAME.C1);
    expect(res.value.redirectedFrom).toBe(D);

    const gone = await run((tx) => getPersonOps(tx, memberC1, uuidv7()));
    expect(gone.ok).toBe(false);
    if (!gone.ok) expect(gone.error.code).toBe('not-found');
  });
});

describe('getMyAttachmentOp — pending → active', () => {
  it('returns null before any request, then the row through both statuses', async () => {
    const ctx: SessionContext = { accountId: accUnattached, clanId, personId: null, role: 'guest' };

    const none = await run((tx) => getMyAttachmentOp(tx, ctx));
    expect(none.ok).toBe(true);
    if (none.ok) expect(none.value).toBeNull();

    const attachmentId = uuidv7();
    await run((tx) =>
      tx.insert(attachment).values({
        id: attachmentId,
        clanId,
        accountId: accUnattached,
        personId: S,
        role: 'member',
        status: 'pending',
      }),
    );
    const pending = await run((tx) => getMyAttachmentOp(tx, ctx));
    expect(pending.ok).toBe(true);
    if (pending.ok)
      expect(pending.value).toEqual({
        attachmentId,
        personId: S,
        personName: NAME.S,
        status: 'pending',
        role: 'member',
      });

    await run((tx) =>
      tx.update(attachment).set({ status: 'active' }).where(eq(attachment.id, attachmentId)),
    );
    const active = await run((tx) => getMyAttachmentOp(tx, ctx));
    expect(active.ok).toBe(true);
    if (active.ok) {
      expect(active.value?.status).toBe('active');
      expect(active.value?.attachmentId).toBe(attachmentId);
    }
  });
});

describe('getClanInfoOp — the site public identity', () => {
  it('serves name + contract settings keys to a GUEST, dropping unknown/non-string keys', async () => {
    const res = await run((tx) => getClanInfoOp(tx, guest));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.name).toBe('G1 Dòng Họ Thử');
    expect(res.value.settings).toEqual({
      surname: 'Nguyễn',
      middleName: 'Quang',
      motto: 'Ẩm hà tư nguyên',
      mottoPhonetic: 'Uống nước nhớ nguồn',
    });
  });
});

describe('getMyPersonFlagsOp — own node only', () => {
  it('returns the FR-55 flags for the session node; unattached → err', async () => {
    const flags = await run((tx) => getMyPersonFlagsOp(tx, memberC1 as SessionContext));
    expect(flags.ok).toBe(true);
    if (flags.ok) expect(flags.value).toEqual({ hiddenFromPublic: false, refusePrint: false });

    await run((tx) =>
      tx.update(person).set({ hiddenFromPublic: true, refusePrint: true }).where(eq(person.id, W)),
    );
    const asW: SessionContext = { accountId: acc, clanId, personId: W, role: 'member' };
    const wFlags = await run((tx) => getMyPersonFlagsOp(tx, asW));
    expect(wFlags.ok).toBe(true);
    if (wFlags.ok) expect(wFlags.value).toEqual({ hiddenFromPublic: true, refusePrint: true });

    const unattached: SessionContext = { accountId: acc, clanId, personId: null, role: 'guest' };
    const nope = await run((tx) => getMyPersonFlagsOp(tx, unattached));
    expect(nope.ok).toBe(false);
    if (!nope.ok) expect(nope.error.code).toBe('unattached');
  });
});
