/**
 * Story 6-5 — phép quét mâu thuẫn cả dòng họ, trên database thật (nếp `place.test.ts`).
 *
 * Dựng bằng chính đường ghi (createPersonOp · addAssertionOp · addPlaceOps) chứ không chèn hàng
 * thô — để khoá phụ đọc từ đúng thứ đường ghi sinh ra (`person.gender` chiếu qua AD-19).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { ownerPool, withClanContext, type Tx } from '@/db';
import { clan } from '@/db/schema';
import type { SessionContext } from '@/core/identity/session';
import { addAssertionOp } from '@/core/assertion/ops';
import { createPersonOp } from '@/core/person/ops';
import { addPlaceOps } from '@/core/place/ops';
import { listConflictsOps } from './read-ops';
import { xepChong } from './chong';

const owner = ownerPool();
const clanId = uuidv7();
const run = <T>(fn: (tx: Tx) => Promise<T>) => withClanContext(clanId, fn);
const admin: SessionContext = { accountId: 's65-admin', clanId, personId: uuidv7(), role: 'admin' };
const thuong: SessionContext = { accountId: 's65-tv', clanId, personId: uuidv7(), role: 'member' };

const N = {
  haiNamSinh: '',
  haiCha: '',
  chaMe: '',
  haiQue: '',
  cungQue: '',
  cha1: '',
  cha2: '',
  me: '',
};

beforeAll(async () => {
  await run((tx) => tx.insert(clan).values({ id: clanId, name: 'S65 Clan' }));
  const nguon = { kind: 'told-by' as const, description: 'S65 thử' };
  await run(async (tx) => {
    const tao = async (fullName: string, gender?: 'male' | 'female', parentIds: string[] = []) => {
      const r = await createPersonOp(tx, admin, { fullName, ...(gender ? { gender } : {}), source: nguon });
      if (!r.ok) throw new Error(r.error.message);
      for (const parentId of parentIds) {
        const e = await addAssertionOp(tx, admin, { personId: r.value.personId, spec: { kind: 'parent-child', parentId }, source: nguon });
        if (!e.ok) throw new Error(e.error.message);
      }
      return r.value.personId;
    };
    N.cha1 = await tao('S65 Cha Một', 'male');
    N.cha2 = await tao('S65 Cha Hai', 'male');
    N.me = await tao('S65 Mẹ', 'female');
    N.haiCha = await tao('S65 Con Hai Cha', 'male', [N.cha1, N.cha2]);
    N.chaMe = await tao('S65 Con Cha Mẹ', 'male', [N.cha1, N.me]);
    N.haiNamSinh = await tao('S65 Hai Năm Sinh');
    N.haiQue = await tao('S65 Hai Quê');
    N.cungQue = await tao('S65 Cùng Quê');

    const themKd = async (personId: string, spec: Parameters<typeof addAssertionOp>[2]['spec']) => {
      const r = await addAssertionOp(tx, admin, { personId, spec, source: nguon });
      if (!r.ok) throw new Error(r.error.message);
    };
    await themKd(N.haiNamSinh, { kind: 'birth', value: { date: '1950-01-01', precision: 'year' } });
    await themKd(N.haiNamSinh, { kind: 'birth', value: { date: '1951-01-01', precision: 'year' } });

    const noiA = await addPlaceOps(tx, admin, { name: 'S65 Quang Trung', parentUnit: 'Định Hoá' });
    const noiB = await addPlaceOps(tx, admin, { name: 'S65 Quang Trung', parentUnit: 'Vũng Tàu' });
    if (!noiA.ok || !noiB.ok) throw new Error('nơi');
    await themKd(N.haiQue, { kind: 'place', placeId: noiA.value.placeId, role: 'que-quan' });
    await themKd(N.haiQue, { kind: 'place', placeId: noiB.value.placeId, role: 'que-quan' });
    // Cùng quê hai lần + một trú quán: KHÔNG mâu thuẫn.
    await themKd(N.cungQue, { kind: 'place', placeId: noiA.value.placeId, role: 'que-quan' });
    await themKd(N.cungQue, { kind: 'place', placeId: noiA.value.placeId, role: 'que-quan' });
    await themKd(N.cungQue, { kind: 'place', placeId: noiB.value.placeId, role: 'tru-quan' });
  });
});

afterAll(async () => {
  await owner.query('BEGIN');
  await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
  for (const tbl of ['notification', 'assertion', 'source', 'revision', 'place', 'person']) {
    await owner.query(`DELETE FROM "${tbl}" WHERE clan_id = $1`, [clanId]);
  }
  await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
  await owner.query('COMMIT');
  await owner.end();
});

describe('listConflictsOps — quét cả dòng họ', () => {
  it('ra ĐÚNG ba người: hai năm sinh · hai cha ruột cùng giới · hai quê quán khác nơi', async () => {
    const r = await run((tx) => listConflictsOps(tx, admin));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const ids = r.value.map((n) => n.personId).sort();
    expect(ids).toEqual([N.haiCha, N.haiNamSinh, N.haiQue].sort());
    // Xếp theo tên.
    expect(r.value.map((n) => n.personName)).toEqual(['S65 Con Hai Cha', 'S65 Hai Năm Sinh', 'S65 Hai Quê']);
  });

  it('cùng phép với phiếu: xếp chồng dòng của "Con Hai Cha" cho một chồng parent-child mâu thuẫn với đúng hai dòng đụng nhau', async () => {
    const r = await run((tx) => listConflictsOps(tx, admin));
    if (!r.ok) throw new Error(r.error.message);
    const nguoi = r.value.find((n) => n.personId === N.haiCha)!;
    const chong = xepChong(nguoi.assertions.map((a) => ({ ...a, createdByName: '' })));
    const pc = chong.find((c) => c.kind === 'parent-child')!;
    expect(pc.stackKind).toBe('mau-thuan');
    expect(pc.dongMauThuan).toHaveLength(2);
    // Khoá phụ đọc từ giới ĐÃ CHIẾU của cha (AD-19).
    expect(nguoi.assertions.filter((a) => a.kind === 'parent-child').map((a) => a.nhomPhu)).toEqual(['male|blood', 'male|blood']);
    // Hai quê: `noiId` là hai nơi khác nhau.
    const que = r.value.find((n) => n.personId === N.haiQue)!;
    const noi = new Set(que.assertions.filter((a) => a.kind === 'place').map((a) => a.noiId));
    expect(noi.size).toBe(2);
  });

  it('thành viên thường ⇒ forbidden; chưa gắn ⇒ unattached', async () => {
    const r1 = await run((tx) => listConflictsOps(tx, thuong));
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.error.code).toBe('forbidden');
    const r2 = await run((tx) => listConflictsOps(tx, { ...admin, personId: null }));
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.code).toBe('unattached');
  });
});
