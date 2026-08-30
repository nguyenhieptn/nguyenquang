/**
 * Story 1-2 — createPersonOp substrate tests. Real DB, pattern from core/gates/rls.gate.test.ts:
 * clan seeded under withClanContext, cleanup via ownerPool with SET LOCAL per clan.
 * All test data is prefixed S12 and the clan id is fresh per run.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { and, eq, inArray } from 'drizzle-orm';
import { withClanContext, ownerPool } from '@/db';
import { assertion, clan, notification, person, revision, source, union } from '@/db/schema';
import type { GuestContext, SessionContext } from '@/core/identity/session';
import { createPersonOp } from './ops';

const owner = ownerPool();
const clanId = uuidv7();

const member: SessionContext = { accountId: 's12-person-member', clanId, personId: uuidv7(), role: 'member' };
const unattached: SessionContext = { accountId: 's12-person-noattach', clanId, personId: null, role: 'guest' }; // như phiên thật (7-1)
const guest: GuestContext = { accountId: null, clanId, personId: null, role: 'guest' };

beforeAll(async () => {
  await withClanContext(clanId, async (tx) => {
    await tx.insert(clan).values({ id: clanId, name: 'S12 Person Test Clan' });
  });
});

afterAll(async () => {
  await owner.query('BEGIN');
  await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
  for (const tbl of ['notification', 'assertion', 'revision', 'source', 'union', 'person']) {
    await owner.query(`DELETE FROM "${tbl}" WHERE clan_id = $1`, [clanId]);
  }
  await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
  await owner.query('COMMIT');
  await owner.end();
});

describe('createPersonOp', () => {
  it('creates a person with a parent link: rows, assertions, revisions, notifications', async () => {
    const { parentId, childId } = await withClanContext(clanId, async (tx) => {
      const parent = await createPersonOp(tx, member, {
        fullName: 'S12 Nguyễn Văn Cả',
        source: { kind: 'document', description: 'S12 gia phả giấy' },
      });
      if (!parent.ok) throw new Error(parent.error.message);
      const child = await createPersonOp(tx, member, {
        fullName: 'S12 Nguyễn Văn Hai',
        gender: 'male',
        birth: { date: '1950-01-01', precision: 'year' },
        parentId: parent.value.personId,
        source: { kind: 'told-by', description: 'S12 bà nội kể' },
      });
      if (!child.ok) throw new Error(child.error.message);
      // name + gender + birth + parent-child
      expect(child.value.assertionIds).toHaveLength(4);
      return { parentId: parent.value.personId, childId: child.value.personId };
    });

    await withClanContext(clanId, async (tx) => {
      const rows = await tx.select().from(person).where(inArray(person.id, [parentId, childId]));
      expect(rows).toHaveLength(2);
      const child = rows.find((r) => r.id === childId)!;
      expect(child.fullName).toBe('S12 Nguyễn Văn Hai');
      expect(child.nameFolded).toBe('s12 nguyen van hai');
      expect(child.nameTier).toBe('tentative');
      expect(child.nameConfidence).toBe('ton-nghi');
      expect(child.gender).toBe('male');
      expect(child.birthDate).toBe('1950-01-01');
      expect(child.birthPrecision).toBe('year');
      expect(child.isLiving).toBe(true);

      // The edge hangs on the child: subject = CHILD, object = PARENT (AD-18).
      const edges = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.subjectPersonId, childId), eq(assertion.kind, 'parent-child')));
      expect(edges).toHaveLength(1);
      expect(edges[0]!.objectPersonId).toBe(parentId);
      expect(edges[0]!.tier).toBe('tentative');
      expect(edges[0]!.value).toEqual({ relation: 'blood' });

      // AD-10: person create ×2, source ×2, one revision per assertion (1 + 4).
      const revs = await tx.select().from(revision).where(eq(revision.clanId, clanId));
      expect(revs.filter((r) => r.entity === 'person' && r.entityId === childId)).toHaveLength(1);
      expect(revs.filter((r) => r.entity === 'person' && r.entityId === parentId)).toHaveLength(1);
      expect(revs.filter((r) => r.entity === 'source')).toHaveLength(2);
      expect(revs.filter((r) => r.entity === 'assertion' && r.action === 'create')).toHaveLength(5);

      // One shared source for the whole child call.
      const childAssertions = await tx.select().from(assertion).where(eq(assertion.subjectPersonId, childId));
      expect(new Set(childAssertions.map((a) => a.sourceId)).size).toBe(1);
      const sources = await tx.select().from(source).where(eq(source.clanId, clanId));
      expect(sources).toHaveLength(2);

      // AD-15: both are living ⇒ both get 'added-to-tree'.
      const notes = await tx
        .select()
        .from(notification)
        .where(inArray(notification.personId, [parentId, childId]));
      expect(notes.map((n) => n.kind)).toEqual(['added-to-tree', 'added-to-tree']);
    });
  });

  it('folds nameFolded through chuanHoa (đ, diacritics, case, whitespace)', async () => {
    const personId = await withClanContext(clanId, async (tx) => {
      const res = await createPersonOp(tx, member, {
        fullName: '  S12  Đặng   Thị Ế ',
        source: { kind: 'self' },
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.value.personId;
    });
    await withClanContext(clanId, async (tx) => {
      const [row] = await tx.select().from(person).where(eq(person.id, personId));
      expect(row!.fullName).toBe('S12  Đặng   Thị Ế'); // stored name keeps its diacritics (AD-16)
      expect(row!.nameFolded).toBe('s12 dang thi e');
    });
  });

  it('partnerId creates one union and TWO union-partner assertions, one per partner', async () => {
    const { aId, bId } = await withClanContext(clanId, async (tx) => {
      const a = await createPersonOp(tx, member, {
        fullName: 'S12 Nguyễn Văn Chồng',
        source: { kind: 'self' },
      });
      if (!a.ok) throw new Error(a.error.message);
      const b = await createPersonOp(tx, member, {
        fullName: 'S12 Trần Thị Vợ',
        partnerId: a.value.personId,
        source: { kind: 'told-by', description: 'S12 chú kể' },
      });
      if (!b.ok) throw new Error(b.error.message);
      // name + own union-partner + partner's union-partner
      expect(b.value.assertionIds).toHaveLength(3);
      return { aId: a.value.personId, bId: b.value.personId };
    });
    await withClanContext(clanId, async (tx) => {
      const memberships = await tx
        .select()
        .from(assertion)
        .where(and(inArray(assertion.subjectPersonId, [aId, bId]), eq(assertion.kind, 'union-partner')));
      expect(memberships).toHaveLength(2);
      expect(memberships.map((m) => m.subjectPersonId).sort()).toEqual([aId, bId].sort());
      const unionIds = new Set(memberships.map((m) => m.unionId));
      expect(unionIds.size).toBe(1);
      const [unionRow] = await tx.select().from(union).where(eq(union.id, [...unionIds][0]!));
      expect(unionRow).toBeTruthy();
      // The union row got its own revision.
      const revs = await tx
        .select()
        .from(revision)
        .where(and(eq(revision.entity, 'union'), eq(revision.entityId, unionRow!.id)));
      expect(revs).toHaveLength(1);
    });
  });

  it('a death claim makes the person not living and suppresses added-to-tree', async () => {
    const personId = await withClanContext(clanId, async (tx) => {
      const res = await createPersonOp(tx, member, {
        fullName: 'S12 Nguyễn Văn Cố',
        death: { date: '1970-02-03', precision: 'exact' },
        source: { kind: 'document', description: 'S12 bia mộ' },
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.value.personId;
    });
    await withClanContext(clanId, async (tx) => {
      const [row] = await tx.select().from(person).where(eq(person.id, personId));
      expect(row!.isLiving).toBe(false);
      expect(row!.deathDate).toBe('1970-02-03');
      expect(row!.deathTier).toBe('tentative');
      const notes = await tx.select().from(notification).where(eq(notification.personId, personId));
      expect(notes).toHaveLength(0);
    });
  });

  it('guests and unattached accounts cannot write', async () => {
    await withClanContext(clanId, async (tx) => {
      const asGuest = await createPersonOp(tx, guest, { fullName: 'S12 Khách', source: { kind: 'self' } });
      expect(asGuest.ok).toBe(false);
      if (!asGuest.ok) expect(asGuest.error.code).toBe('unauthenticated');

      const asUnattached = await createPersonOp(tx, unattached, {
        fullName: 'S12 Chưa Gắn',
        source: { kind: 'self' },
      });
      expect(asUnattached.ok).toBe(false);
      if (!asUnattached.ok) expect(asUnattached.error.code).toBe('unattached');
    });
  });

  it('rejects an empty name and a missing parent without leaving partial rows', async () => {
    await withClanContext(clanId, async (tx) => {
      const noName = await createPersonOp(tx, member, { fullName: '   ', source: { kind: 'self' } });
      expect(noName.ok).toBe(false);
      if (!noName.ok) expect(noName.error.code).toBe('invalid');

      const ghostParent = await createPersonOp(tx, member, {
        fullName: 'S12 Mồ Côi',
        parentId: uuidv7(),
        source: { kind: 'self' },
      });
      expect(ghostParent.ok).toBe(false);
      if (!ghostParent.ok) expect(ghostParent.error.code).toBe('not-found');
    });
    await withClanContext(clanId, async (tx) => {
      const orphanRows = await tx.select().from(person).where(eq(person.nameFolded, 's12 mo coi'));
      expect(orphanRows).toHaveLength(0);
    });
  });
});
