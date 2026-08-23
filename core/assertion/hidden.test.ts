/**
 * G2 — hidden-assertion restore surface (UI story 3-4): listHiddenAssertionsOp shows a row
 * after hideAssertion (with the hide reason and human-Vietnamese value text) and empties after
 * restore; approver-only. Real DB, fresh uuidv7 clan, cleanup in afterAll.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { withClanContext, ownerPool } from '@/db';
import { clan } from '@/db/schema';
import type { Result } from '@/core/types';
import type { GuestContext, SessionContext } from '@/core/identity/session';
import { createPersonOp } from '@/core/person/ops';
import {
  addAssertionOp,
  describeAssertionValue,
  hideAssertionOp,
  listHiddenAssertionsOp,
  restoreAssertionOp,
} from './ops';

const owner = ownerPool();
const clanId = uuidv7();

const member: SessionContext = { accountId: 'g2-hidden-member', clanId, personId: uuidv7(), role: 'member' };
const admin: SessionContext = { accountId: 'g2-hidden-admin', clanId, personId: uuidv7(), role: 'admin' };
const guest: GuestContext = { accountId: null, clanId, personId: null, role: 'guest' };

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(`expected ok, got ${r.error.code}: ${r.error.message}`);
  return r.value;
}
function unwrapErr<T>(r: Result<T>): { code: string; message: string } {
  if (r.ok) throw new Error('expected err, got ok');
  return r.error;
}

let personId = '';
let noteId = '';

beforeAll(async () => {
  await withClanContext(clanId, async (tx) => {
    await tx.insert(clan).values({ id: clanId, name: 'G2 Clan Khôi Phục' });
    personId = unwrap(
      await createPersonOp(tx, member, { fullName: 'G2 Bà Kể', source: { kind: 'self' } }),
    ).personId;
    noteId = unwrap(
      await addAssertionOp(tx, member, {
        personId,
        spec: { kind: 'note', text: 'G2 chuyện không nên chép' },
        source: { kind: 'told-by', description: 'G2 nghe kể lại' },
      }),
    ).assertionId;
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

describe('listHiddenAssertionsOp', () => {
  it('is approver-only: member forbidden, guest unauthenticated', async () => {
    await withClanContext(clanId, async (tx) => {
      expect(unwrapErr(await listHiddenAssertionsOp(tx, member)).code).toBe('forbidden');
      expect(unwrapErr(await listHiddenAssertionsOp(tx, guest)).code).toBe('unauthenticated');
    });
  });

  it('is empty before any hide', async () => {
    await withClanContext(clanId, async (tx) => {
      expect(unwrap(await listHiddenAssertionsOp(tx, admin))).toEqual([]);
    });
  });

  it('shows the hidden claim with person name, value text, hide reason, and author', async () => {
    await withClanContext(clanId, async (tx) => {
      unwrap(await hideAssertionOp(tx, member, { assertionId: noteId, reason: ' G2 chuyện riêng tư ' }));

      const rows = unwrap(await listHiddenAssertionsOp(tx, admin));
      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.assertionId).toBe(noteId);
      expect(row.personId).toBe(personId);
      expect(row.personName).toBe('G2 Bà Kể');
      expect(row.kind).toBe('note');
      expect(row.valueText).toBe('ghi chú "G2 chuyện không nên chép"');
      expect(row.hiddenReason).toBe('G2 chuyện riêng tư'); // trimmed hide-revision note
      expect(row.createdByAccountId).toBe(member.accountId);
      expect(row.createdAt).toBeInstanceOf(Date);
    });
  });

  it('restore needs the approval right, and the list empties after it (AD-17)', async () => {
    await withClanContext(clanId, async (tx) => {
      expect(unwrapErr(await restoreAssertionOp(tx, member, { assertionId: noteId })).code).toBe('forbidden');
      unwrap(await restoreAssertionOp(tx, admin, { assertionId: noteId }));
      expect(unwrap(await listHiddenAssertionsOp(tx, admin))).toEqual([]);
    });
  });

  it('a re-hidden claim carries the LATEST hide reason', async () => {
    await withClanContext(clanId, async (tx) => {
      unwrap(await hideAssertionOp(tx, member, { assertionId: noteId, reason: 'G2 lý do mới' }));
      const rows = unwrap(await listHiddenAssertionsOp(tx, admin));
      expect(rows).toHaveLength(1);
      expect(rows[0]!.hiddenReason).toBe('G2 lý do mới');
      unwrap(await restoreAssertionOp(tx, admin, { assertionId: noteId })); // leave the clan clean
    });
  });
});

describe('describeAssertionValue', () => {
  it('renders every kind in human Vietnamese and degrades on malformed values', () => {
    expect(describeAssertionValue('name', { fullName: 'Nguyễn Thị A' })).toBe('tên "Nguyễn Thị A"');
    expect(describeAssertionValue('gender', { gender: 'male' })).toBe('giới tính nam');
    expect(describeAssertionValue('gender', { gender: 'female' })).toBe('giới tính nữ');
    expect(describeAssertionValue('birth', { date: '1941-05-20', precision: 'exact' })).toBe(
      'ngày sinh 20/05/1941',
    );
    expect(describeAssertionValue('birth', { date: '1941-01-01', precision: 'approximate' })).toBe(
      'năm sinh khoảng 1941',
    );
    expect(describeAssertionValue('birth', { date: '1941-01-01', precision: 'year' })).toBe('năm sinh 1941');
    expect(describeAssertionValue('death', { precision: 'unknown' })).toBe('năm mất chưa rõ');
    expect(describeAssertionValue('parent-child', { relation: 'adopted' })).toBe(
      'quan hệ cha mẹ – con (con nuôi)',
    );
    expect(describeAssertionValue('union-partner', {})).toBe('quan hệ vợ chồng');
    expect(describeAssertionValue('note', { text: 'lời dặn' })).toBe('ghi chú "lời dặn"');
    // malformed jsonb degrades instead of throwing
    expect(describeAssertionValue('name', null)).toBe('tên');
    expect(describeAssertionValue('note', 42)).toBe('ghi chú');
  });
});
