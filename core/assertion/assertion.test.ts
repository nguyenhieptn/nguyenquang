/**
 * Story 1-2 — assertion write-path tests: projection, promotion, hide/restore, reject, pending
 * queue. Real DB (pattern from core/gates/rls.gate.test.ts). Data prefixed S12, fresh clan id
 * per run, cleanup via ownerPool with SET LOCAL.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { and, eq } from 'drizzle-orm';
import { withClanContext, ownerPool } from '@/db';
import { assertion, clan, notification, person, revision } from '@/db/schema';
import type { GuestContext, SessionContext } from '@/core/identity/session';
import { createPersonOp } from '@/core/person/ops';
import {
  addAssertionOp,
  hideAssertionOp,
  listPendingAssertionsOp,
  promoteAssertionOp,
  rejectAssertionOp,
  restoreAssertionOp,
} from './ops';

const owner = ownerPool();
const clanId = uuidv7();

const member: SessionContext = { accountId: 's12-assert-member', clanId, personId: uuidv7(), role: 'member' };
const admin: SessionContext = { accountId: 's12-assert-admin', clanId, personId: uuidv7(), role: 'admin' };
const guest: GuestContext = { accountId: null, clanId, personId: null, role: 'guest' };

beforeAll(async () => {
  await withClanContext(clanId, async (tx) => {
    await tx.insert(clan).values({ id: clanId, name: 'S12 Assertion Test Clan' });
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

async function makePerson(name: string): Promise<string> {
  return withClanContext(clanId, async (tx) => {
    const res = await createPersonOp(tx, member, { fullName: name, source: { kind: 'self' } });
    if (!res.ok) throw new Error(res.error.message);
    return res.value.personId;
  });
}

describe('assertion ops', () => {
  it('projects the newest tentative until an official one exists; official then beats tentative', async () => {
    const personId = await makePerson('S12 Tên Cũ');
    // Second, newer tentative name → leads while both are tentative.
    const secondNameId = await withClanContext(clanId, async (tx) => {
      const res = await addAssertionOp(tx, member, {
        personId,
        spec: { kind: 'name', fullName: 'S12 Tên Mới' },
        source: { kind: 'told-by', description: 'S12 cô kể' },
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.value.assertionId;
    });
    await withClanContext(clanId, async (tx) => {
      const [row] = await tx.select().from(person).where(eq(person.id, personId));
      expect(row!.fullName).toBe('S12 Tên Mới');
      expect(row!.nameTier).toBe('tentative');
    });

    // Promote the OLD name → official beats the newer tentative.
    const firstNameId = await withClanContext(clanId, async (tx) => {
      const rows = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.subjectPersonId, personId), eq(assertion.kind, 'name')));
      return rows.find((r) => r.id !== secondNameId)!.id;
    });
    await withClanContext(clanId, async (tx) => {
      const res = await promoteAssertionOp(tx, admin, { assertionId: firstNameId });
      expect(res.ok).toBe(true);
    });
    await withClanContext(clanId, async (tx) => {
      const [row] = await tx.select().from(person).where(eq(person.id, personId));
      expect(row!.fullName).toBe('S12 Tên Cũ');
      expect(row!.nameFolded).toBe('s12 ten cu');
      expect(row!.nameTier).toBe('official');
    });
  });

  it('promote by a plain member is forbidden; by a guest unauthenticated', async () => {
    const personId = await makePerson('S12 Người Bị Chặn');
    const nameAssertionId = await withClanContext(clanId, async (tx) => {
      const rows = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.subjectPersonId, personId), eq(assertion.kind, 'name')));
      return rows[0]!.id;
    });
    await withClanContext(clanId, async (tx) => {
      const asMember = await promoteAssertionOp(tx, member, { assertionId: nameAssertionId });
      expect(asMember.ok).toBe(false);
      if (!asMember.ok) expect(asMember.error.code).toBe('forbidden');
      const asGuest = await promoteAssertionOp(tx, guest, { assertionId: nameAssertionId });
      expect(asGuest.ok).toBe(false);
      if (!asGuest.ok) expect(asGuest.error.code).toBe('unauthenticated');
    });
    await withClanContext(clanId, async (tx) => {
      const [row] = await tx.select().from(assertion).where(eq(assertion.id, nameAssertionId));
      expect(row!.tier).toBe('tentative');
    });
  });

  it('promote by admin marks official, stamps promotedBy, re-projects, and notifies the living subject on change', async () => {
    const personId = await makePerson('S12 Tên Một');
    const newerNameId = await withClanContext(clanId, async (tx) => {
      const res = await addAssertionOp(tx, member, {
        personId,
        spec: { kind: 'name', fullName: 'S12 Tên Hai' },
        source: { kind: 'self' },
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.value.assertionId;
    });
    // Projected value is now 'S12 Tên Hai' (newest tentative). Promote the OLDER one:
    // the accepted value changes Hai → Một, the subject is living ⇒ record-changed.
    const olderNameId = await withClanContext(clanId, async (tx) => {
      const rows = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.subjectPersonId, personId), eq(assertion.kind, 'name')));
      return rows.find((r) => r.id !== newerNameId)!.id;
    });
    await withClanContext(clanId, async (tx) => {
      const res = await promoteAssertionOp(tx, admin, { assertionId: olderNameId });
      expect(res.ok).toBe(true);
    });
    await withClanContext(clanId, async (tx) => {
      const [row] = await tx.select().from(assertion).where(eq(assertion.id, olderNameId));
      expect(row!.tier).toBe('official');
      expect(row!.promotedByAccountId).toBe(admin.accountId);
      expect(row!.promotedAt).toBeTruthy();
      const [p] = await tx.select().from(person).where(eq(person.id, personId));
      expect(p!.fullName).toBe('S12 Tên Một');
      const promoteRevs = await tx
        .select()
        .from(revision)
        .where(and(eq(revision.entityId, olderNameId), eq(revision.action, 'promote')));
      expect(promoteRevs).toHaveLength(1);
      const notes = await tx
        .select()
        .from(notification)
        .where(and(eq(notification.personId, personId), eq(notification.kind, 'record-changed')));
      expect(notes).toHaveLength(1);
      // Double promote → conflict.
      const again = await promoteAssertionOp(tx, admin, { assertionId: olderNameId });
      expect(again.ok).toBe(false);
      if (!again.ok) expect(again.error.code).toBe('conflict');
    });
  });

  it('any attached member can hide with a reason; hidden assertions stop projecting; restore needs the approval right', async () => {
    const personId = await makePerson('S12 Tên Thật');
    // Give it a birth so we hide a projecting claim.
    const birthId = await withClanContext(clanId, async (tx) => {
      const res = await addAssertionOp(tx, member, {
        personId,
        spec: { kind: 'birth', value: { date: '1960-01-01', precision: 'year' } },
        source: { kind: 'self' },
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.value.assertionId;
    });
    await withClanContext(clanId, async (tx) => {
      const noReason = await hideAssertionOp(tx, member, { assertionId: birthId, reason: '  ' });
      expect(noReason.ok).toBe(false);
      if (!noReason.ok) expect(noReason.error.code).toBe('invalid');

      const hidden = await hideAssertionOp(tx, member, { assertionId: birthId, reason: 'S12 sai năm sinh' });
      expect(hidden.ok).toBe(true);
    });
    await withClanContext(clanId, async (tx) => {
      const [row] = await tx.select().from(assertion).where(eq(assertion.id, birthId));
      expect(row!.status).toBe('hidden');
      const [p] = await tx.select().from(person).where(eq(person.id, personId));
      expect(p!.birthDate).toBeNull(); // re-projected: hidden never projects
      expect(p!.birthTier).toBeNull();
      const hideRevs = await tx
        .select()
        .from(revision)
        .where(and(eq(revision.entityId, birthId), eq(revision.action, 'hide')));
      expect(hideRevs).toHaveLength(1);
      expect(hideRevs[0]!.note).toBe('S12 sai năm sinh');

      const restoreAsMember = await restoreAssertionOp(tx, member, { assertionId: birthId });
      expect(restoreAsMember.ok).toBe(false);
      if (!restoreAsMember.ok) expect(restoreAsMember.error.code).toBe('forbidden');
      const restored = await restoreAssertionOp(tx, admin, { assertionId: birthId });
      expect(restored.ok).toBe(true);
    });
    await withClanContext(clanId, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, personId));
      expect(p!.birthDate).toBe('1960-01-01'); // projected again after restore
      expect(p!.birthTier).toBe('tentative');
    });
  });

  it('reject deletes the row but the revision retains the full copy (AD-4)', async () => {
    const personId = await makePerson('S12 Người Nhầm Giới');
    const genderId = await withClanContext(clanId, async (tx) => {
      const res = await addAssertionOp(tx, member, {
        personId,
        spec: { kind: 'gender', gender: 'female' },
        source: { kind: 'self' },
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.value.assertionId;
    });
    await withClanContext(clanId, async (tx) => {
      const asMember = await rejectAssertionOp(tx, member, { assertionId: genderId, note: 'x' });
      expect(asMember.ok).toBe(false);
      if (!asMember.ok) expect(asMember.error.code).toBe('forbidden');
      const res = await rejectAssertionOp(tx, admin, { assertionId: genderId, note: 'S12 khai nhầm' });
      expect(res.ok).toBe(true);
    });
    await withClanContext(clanId, async (tx) => {
      const gone = await tx.select().from(assertion).where(eq(assertion.id, genderId));
      expect(gone).toHaveLength(0);
      const removeRevs = await tx
        .select()
        .from(revision)
        .where(and(eq(revision.entityId, genderId), eq(revision.action, 'remove')));
      expect(removeRevs).toHaveLength(1);
      const before = removeRevs[0]!.before as { id: string; value: { gender: string } };
      expect(before.id).toBe(genderId);
      expect(before.value.gender).toBe('female');
      // Re-projected: the gender came only from the rejected claim.
      const [p] = await tx.select().from(person).where(eq(person.id, personId));
      expect(p!.gender).toBeNull();
      expect(p!.genderTier).toBeNull();
    });
  });

  it('addAssertionOp parent-child builds the edge: subject = child, object = parent', async () => {
    const childId = await makePerson('S12 Con Nối');
    const parentId = await makePerson('S12 Cha Nối');
    const edgeId = await withClanContext(clanId, async (tx) => {
      const res = await addAssertionOp(tx, member, {
        personId: childId,
        spec: { kind: 'parent-child', parentId, relation: 'adopted' },
        source: { kind: 'told-by', description: 'S12 bác kể' },
        confidence: 'theo-loi-ke',
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.value.assertionId;
    });
    await withClanContext(clanId, async (tx) => {
      const [edge] = await tx.select().from(assertion).where(eq(assertion.id, edgeId));
      expect(edge!.kind).toBe('parent-child');
      expect(edge!.subjectPersonId).toBe(childId);
      expect(edge!.objectPersonId).toBe(parentId);
      expect(edge!.value).toEqual({ relation: 'adopted' });
      expect(edge!.confidence).toBe('theo-loi-ke');
      expect(edge!.tier).toBe('tentative');
      // Self-parenting is invalid.
      const selfEdge = await addAssertionOp(tx, member, {
        personId: childId,
        spec: { kind: 'parent-child', parentId: childId },
        source: { kind: 'self' },
      });
      expect(selfEdge.ok).toBe(false);
      if (!selfEdge.ok) expect(selfEdge.error.code).toBe('invalid');
    });
  });

  it('a death assertion flips isLiving off; rejecting it flips it back', async () => {
    const personId = await makePerson('S12 Người Còn Sống');
    const deathId = await withClanContext(clanId, async (tx) => {
      const res = await addAssertionOp(tx, member, {
        personId,
        spec: { kind: 'death', value: { date: '2000-01-01', precision: 'approximate' } },
        source: { kind: 'told-by', description: 'S12 nghe đồn' },
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.value.assertionId;
    });
    await withClanContext(clanId, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, personId));
      expect(p!.isLiving).toBe(false);
      const res = await rejectAssertionOp(tx, admin, { assertionId: deathId, note: 'S12 tin đồn sai' });
      expect(res.ok).toBe(true);
    });
    await withClanContext(clanId, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, personId));
      expect(p!.isLiving).toBe(true);
      expect(p!.deathDate).toBeNull();
    });
  });

  it('listPendingAssertionsOp needs the approval right and lists live tentative claims newest first', async () => {
    const personId = await makePerson('S12 Người Chờ Duyệt');
    await withClanContext(clanId, async (tx) => {
      const asMember = await listPendingAssertionsOp(tx, member);
      expect(asMember.ok).toBe(false);
      if (!asMember.ok) expect(asMember.error.code).toBe('forbidden');

      const asAdmin = await listPendingAssertionsOp(tx, admin);
      expect(asAdmin.ok).toBe(true);
      if (!asAdmin.ok) return;
      const mine = asAdmin.value.filter((r) => r.personId === personId);
      expect(mine).toHaveLength(1);
      expect(mine[0]!.kind).toBe('name');
      expect(mine[0]!.personName).toBe('S12 Người Chờ Duyệt');
      expect(mine[0]!.createdByAccountId).toBe(member.accountId);
      // Newest first across the queue.
      const times = asAdmin.value.map((r) => r.createdAt.getTime());
      expect([...times].sort((a, b) => b - a)).toEqual(times);
    });
  });
});
