/**
 * Story 1-2 — assertion write-path tests: projection, promotion, hide/restore, reject, pending
 * queue. Real DB (pattern from core/gates/rls.gate.test.ts). Data prefixed S12, fresh clan id
 * per run, cleanup via ownerPool with SET LOCAL.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { and, eq, inArray } from 'drizzle-orm';
import { withClanContext, ownerPool } from '@/db';
import { assertion, clan, notification, person, revision, union } from '@/db/schema';
import type { GuestContext, SessionContext } from '@/core/identity/session';
import { createPersonOp } from '@/core/person/ops';
import { DON_TRI } from '@/core/person/chong';
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

  /**
   * Hồi quy cho code review 6-1 — một hôn nhân rời đi TRỌN VẸN.
   *
   * Union mới ghi HAI hàng thành viên. Bản trước `rejectAssertionOp` xoá đúng hàng được trỏ tới,
   * nên gỡ một quan hệ vợ chồng ghi nhầm để lại hàng của người kia sống tiếp, và hồ sơ họ đọc là
   * "vợ/chồng (chưa rõ với ai)" vĩnh viễn.
   */
  it('loại MỘT thành viên union ⇒ cả union rời đi: hai hàng thành viên và cả hàng union', async () => {
    const chong = await makePerson('S12 Chồng Gỡ');
    const vo = await makePerson('S12 Vợ Gỡ');
    const { id: cuaChong, unionId } = await withClanContext(clanId, async (tx) => {
      const res = await addAssertionOp(tx, member, {
        personId: chong,
        spec: { kind: 'union-partner', partnerId: vo },
        source: { kind: 'self' },
      });
      if (!res.ok) throw new Error(res.error.message);
      return { id: res.value.assertionId, unionId: res.value.unionId! };
    });

    await withClanContext(clanId, async (tx) => {
      const truoc = await tx.select().from(assertion).where(eq(assertion.unionId, unionId));
      expect(truoc).toHaveLength(2); // một hàng mỗi người
      const ra = await rejectAssertionOp(tx, admin, { assertionId: cuaChong, note: 'S12 ghi nhầm' });
      expect(ra.ok).toBe(true);
      // Người ở đầu kia được trả về, để màn giữ họ lại trên canvas (AC 23 của story 6-1).
      if (ra.ok) expect(ra.value.doiTuongId).toBe(vo);

      const sau = await tx.select().from(assertion).where(eq(assertion.unionId, unionId));
      expect(sau).toHaveLength(0);
      const conUnion = await tx.select().from(union).where(eq(union.id, unionId));
      expect(conUnion).toHaveLength(0);
      // AD-4: cả hai hàng đều để lại dấu, không hàng nào biến mất khỏi nhật ký.
      const revs = await tx.select().from(revision).where(eq(revision.action, 'remove'));
      expect(revs.filter((r) => truoc.some((t) => t.id === r.entityId))).toHaveLength(2);
    });
  });

  /**
   * Hồi quy cho code review 6-1 — cùng một cặp thì cùng một union.
   *
   * Bản trước luôn đúc union mới, nên hai người cùng chép một đám cưới ⇒ hai union, và cột phải
   * của cả hai in hai dòng "vợ/chồng với …" y hệt — đọc như một người hai vợ.
   */
  it('ghi lại đúng cặp ấy ⇒ alreadyLinked, KHÔNG đẻ union thứ hai', async () => {
    const a = await makePerson('S12 Cặp Trùng A');
    const b = await makePerson('S12 Cặp Trùng B');
    const lan1 = await withClanContext(clanId, (tx) =>
      addAssertionOp(tx, member, {
        personId: a,
        spec: { kind: 'union-partner', partnerId: b },
        source: { kind: 'self' },
      }),
    );
    expect(lan1.ok).toBe(true);

    // Lượt hai đi từ phía NGƯỜI KIA — đúng cách hai người vận hành chép cùng một đám cưới.
    const lan2 = await withClanContext(clanId, (tx) =>
      addAssertionOp(tx, member, {
        personId: b,
        spec: { kind: 'union-partner', partnerId: a },
        source: { kind: 'self' },
      }),
    );
    expect(lan2.ok).toBe(true);
    if (!lan1.ok || !lan2.ok) return;
    expect(lan2.value.alreadyLinked).toBe(true);
    expect(lan2.value.unionId).toBe(lan1.value.unionId);
    expect(lan2.value.assertionIds).toEqual([]);

    await withClanContext(clanId, async (tx) => {
      const hang = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.kind, 'union-partner'), inArray(assertion.subjectPersonId, [a, b])));
      expect(hang).toHaveLength(2); // vẫn đúng hai, không thành bốn
      expect(new Set(hang.map((h) => h.unionId)).size).toBe(1);
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

describe('malformed ids (Postgres 22P02)', () => {
  it('treats a non-uuid assertion id as not-found instead of throwing a driver error', async () => {
    await withClanContext(clanId, async (tx) => {
      for (const bad of ['khong-phai-uuid', '', "'; DROP TABLE assertion; --"]) {
        const res = await promoteAssertionOp(tx, admin, { assertionId: bad });
        expect(res.ok === false && res.error.code).toBe('not-found');
        const hidden = await hideAssertionOp(tx, admin, { assertionId: bad, reason: 'x' });
        expect(hidden.ok === false && hidden.error.code).toBe('not-found');
        const restored = await restoreAssertionOp(tx, admin, { assertionId: bad });
        expect(restored.ok === false && restored.error.code).toBe('not-found');
        const rejected = await rejectAssertionOp(tx, admin, { assertionId: bad, note: 'x' });
        expect(rejected.ok === false && rejected.error.code).toBe('not-found');
      }
      // and the person ref of a write: a non-uuid subject is nobody, not a 500
      const added = await addAssertionOp(tx, member, {
        personId: 'khong-phai-uuid',
        spec: { kind: 'name', fullName: 'S12 Không Ai' },
        source: { kind: 'self' },
      });
      expect(added.ok === false && added.error.code).toBe('not-found');
    });
  });
});

describe('một giá trị chính thức cho mỗi mục đơn trị (#21 — 25/08)', () => {
  /**
   * `promoteAssertionOp` KHÔNG hạ giá trị cũ, và hệ không có phép hạ tầng. Nên nếu nó cho nâng
   * khi đã có một giá trị chính thức cùng loại thì sinh ra HAI sự thật sống về cùng một chuyện,
   * và không màn nào gỡ được.
   *
   * Gác ở core chứ không ở giao diện: cột phải màn cây đã ẩn nút nâng, nhưng `/admin/hang-cho`
   * duyệt hàng loạt gọi thẳng op này (AD-24).
   */
  it('nâng khẳng định thứ hai cùng loại thì bị từ chối, kèm id giá trị đang giữ', async () => {
    const res = await withClanContext(clanId, async (tx) => {
      const p = await createPersonOp(tx, admin, {
        fullName: 'Nguyễn Quang Đơn Trị',
        source: { kind: 'told-by', description: 'S21 test' },
      });
      if (!p.ok) throw new Error('không dựng được người');

      const a1 = await addAssertionOp(tx, admin, {
          personId: p.value.personId,
          spec: { kind: 'birth', value: { date: '1912-01-01', precision: 'year' } },
          source: { kind: 'told-by', description: 'gia phả cũ' },
        });
      const a2 = await addAssertionOp(tx, admin, {
          personId: p.value.personId,
          spec: { kind: 'birth', value: { date: '1915-01-01', precision: 'year' } },
          source: { kind: 'told-by', description: 'lời cụ Bảng' },
        });
      if (!a1.ok || !a2.ok) throw new Error('không ghi được khẳng định');

      const nang1 = await promoteAssertionOp(tx, admin, { assertionId: a1.value.assertionId });
      const nang2 = await promoteAssertionOp(tx, admin, { assertionId: a2.value.assertionId });
      return { nang1, nang2, giu: a1.value.assertionId };
    });

    expect(res.nang1.ok).toBe(true);
    expect(res.nang2.ok).toBe(false);
    if (res.nang2.ok) return;
    expect(res.nang2.error.code).toBe('conflict');
    // Màn phải chỉ được ĐÍCH DANH dòng cần loại trước, không bắt người dùng tự dò.
    expect(res.nang2.error.detail?.dangGiuAssertionId).toBe(res.giu);
  });

  it('loại giá trị đang giữ rồi thì nâng được — đường đổi ý vẫn mở, chỉ là hai bước', async () => {
    const res = await withClanContext(clanId, async (tx) => {
      const p = await createPersonOp(tx, admin, {
        fullName: 'Nguyễn Quang Đổi Ý',
        source: { kind: 'told-by', description: 'S21 test' },
      });
      if (!p.ok) throw new Error('không dựng được người');
      const a1 = await addAssertionOp(tx, admin, {
          personId: p.value.personId,
          spec: { kind: 'birth', value: { date: '1912-01-01', precision: 'year' } },
          source: { kind: 'told-by', description: 'gia phả cũ' },
        });
      const a2 = await addAssertionOp(tx, admin, {
          personId: p.value.personId,
          spec: { kind: 'birth', value: { date: '1915-01-01', precision: 'year' } },
          source: { kind: 'told-by', description: 'lời cụ Bảng' },
        });
      if (!a1.ok || !a2.ok) throw new Error('không ghi được khẳng định');
      await promoteAssertionOp(tx, admin, { assertionId: a1.value.assertionId });
      await rejectAssertionOp(tx, admin, {
        assertionId: a1.value.assertionId,
        note: 'chọn giá trị khác',
      });
      return promoteAssertionOp(tx, admin, { assertionId: a2.value.assertionId });
    });
    expect(res.ok).toBe(true);
  });

  it('loại KHÔNG đơn trị (nơi chốn) thì nâng bao nhiêu cũng được — ba vai cùng đúng', async () => {
    // FR-65: quê quán · trú quán · nơi an táng cùng đúng một lúc, nên `place` không đơn trị.
    expect(DON_TRI.place).toBe(false);
    expect(DON_TRI['parent-child']).toBe(false);
    expect(DON_TRI.birth).toBe(true);
  });
});

describe('story 7-3 — ba giới hạn của ẩn theo báo cáo, và cặp union đi cùng nhau', () => {
  it('thành viên KHÔNG ẩn được quan hệ hay giá trị chính thức; quản trị thì được; tên duy nhất không ai ẩn được', async () => {
    const cha = await makePerson('S73 Cha');
    const con = await makePerson('S73 Con');
    const { canh, ten } = await withClanContext(clanId, async (tx) => {
      const e = await addAssertionOp(tx, member, { personId: con, spec: { kind: 'parent-child', parentId: cha }, source: { kind: 'self' } });
      if (!e.ok) throw new Error(e.error.message);
      const [t] = await tx.select({ id: assertion.id }).from(assertion).where(and(eq(assertion.subjectPersonId, con), eq(assertion.kind, 'name')));
      return { canh: e.value.assertionId, ten: t!.id };
    });
    await withClanContext(clanId, async (tx) => {
      const tv = await hideAssertionOp(tx, member, { assertionId: canh, reason: 'S73 thử' });
      expect(!tv.ok && tv.error.code === 'forbidden').toBe(true);
      // Tên duy nhất: kể cả quản trị cũng không ẩn được — người vô danh trên cây là một lỗi sản phẩm.
      const tenCuoi = await hideAssertionOp(tx, admin, { assertionId: ten, reason: 'S73 thử' });
      expect(!tenCuoi.ok && tenCuoi.error.code === 'conflict').toBe(true);
      // Giá trị chính thức: thành viên bị chặn, quản trị được.
      await promoteAssertionOp(tx, admin, { assertionId: canh });
      const chinhThuc = await hideAssertionOp(tx, member, { assertionId: canh, reason: 'S73 thử' });
      expect(!chinhThuc.ok && chinhThuc.error.code === 'forbidden').toBe(true);
      const qt = await hideAssertionOp(tx, admin, { assertionId: canh, reason: 'S73 quản trị ẩn cạnh' });
      expect(qt.ok).toBe(true);
    });
  });

  it('ẩn một nửa vợ chồng là ẩn cả cặp; khôi phục cũng cả cặp (mỗi hàng một revision)', async () => {
    const chong = await makePerson('S73 Chồng');
    const vo = await makePerson('S73 Vợ');
    const { id, unionId } = await withClanContext(clanId, async (tx) => {
      const r = await addAssertionOp(tx, member, { personId: chong, spec: { kind: 'union-partner', partnerId: vo }, source: { kind: 'self' } });
      if (!r.ok) throw new Error(r.error.message);
      return { id: r.value.assertionId, unionId: r.value.unionId! };
    });
    await withClanContext(clanId, async (tx) => {
      // Quan hệ chỉ quản trị ẩn được (giới hạn 1 ở trên); cặp đi cùng nhau là chuyện của core, không của vai.
      expect((await hideAssertionOp(tx, admin, { assertionId: id, reason: 'S73 không phải vợ chồng' })).ok).toBe(true);
      const sau = await tx.select().from(assertion).where(and(eq(assertion.unionId, unionId), eq(assertion.kind, 'union-partner')));
      expect(sau).toHaveLength(2);
      expect(sau.every((r) => r.status === 'hidden')).toBe(true);
      const revs = await tx.select().from(revision).where(and(eq(revision.action, 'hide'), inArray(revision.entityId, sau.map((r) => r.id))));
      expect(revs).toHaveLength(2);
      expect((await restoreAssertionOp(tx, admin, { assertionId: id })).ok).toBe(true);
      const lai = await tx.select().from(assertion).where(and(eq(assertion.unionId, unionId), eq(assertion.kind, 'union-partner')));
      expect(lai.every((r) => r.status === 'live')).toBe(true);
    });
  });
});
