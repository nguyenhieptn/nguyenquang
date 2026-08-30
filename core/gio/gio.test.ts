/**
 * Lịch giỗ (story 7-5) trên database thật — dựng bằng đường ghi (createPersonOp + addAssertionOp).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { ownerPool, withClanContext, type Tx } from '@/db';
import { clan } from '@/db/schema';
import type { GuestContext, SessionContext } from '@/core/identity/session';
import { addAssertionOp } from '@/core/assertion/ops';
import { createPersonOp } from '@/core/person/ops';
import { getPersonOps } from '@/core/person/read-ops';
import { listGioSapToiOps } from './ops';

const owner = ownerPool();
const clanId = uuidv7();
const run = <T>(fn: (tx: Tx) => Promise<T>) => withClanContext(clanId, fn);
const admin: SessionContext = { accountId: 's75-admin', clanId, personId: uuidv7(), role: 'admin' };
const khach: GuestContext = { accountId: null, clanId, personId: null, role: 'guest' };
const nguon = { kind: 'told-by' as const, description: 'S75 thử' };
const N = { cu: '', song: '', mat: '' };

beforeAll(async () => {
  await run((tx) => tx.insert(clan).values({ id: clanId, name: 'S75 Clan' }));
  await run(async (tx) => {
    const tao = async (fullName: string, death?: { date: string; precision: 'exact' | 'year' }) => {
      const r = await createPersonOp(tx, admin, { fullName, ...(death ? { death } : {}), source: nguon });
      if (!r.ok) throw new Error(r.error.message);
      return r.value.personId;
    };
    N.cu = await tao('S75 Cụ Có Giỗ', { date: '1990-03-05', precision: 'year' });
    N.song = await tao('S75 Người Còn Sống');
    // Mất 06/10/2025 dương = 15/8 Ất Tỵ âm ⇒ gợi ý giỗ 15/8.
    N.mat = await tao('S75 Cụ Mất Ngày Rõ', { date: '2025-10-06', precision: 'exact' });
    const ghi = async (personId: string, spec: Parameters<typeof addAssertionOp>[2]['spec']) => {
      const r = await addAssertionOp(tx, admin, { personId, spec, source: nguon });
      if (!r.ok) throw new Error(r.error.message);
    };
    await ghi(N.cu, { kind: 'gio', thang: 8, ngay: 15 });
    await ghi(N.song, { kind: 'gio', thang: 1, ngay: 1 }); // ghi nhầm cho người sống — không vào lịch
  });
});

afterAll(async () => {
  await owner.query('BEGIN');
  await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
  for (const t of ['notification', 'assertion', 'source', 'revision', 'person']) await owner.query(`DELETE FROM "${t}" WHERE clan_id = $1`, [clanId]);
  await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
  await owner.query('COMMIT');
  await owner.end();
});

describe('listGioSapToiOps', () => {
  it('khách xem được; giỗ 15/8 với hôm nay 29/08/2026 ⇒ 25/09/2026, còn 27 ngày; người sống không vào lịch', async () => {
    const r = await run((tx) => listGioSapToiOps(tx, khach, { soNgay: 365, homNay: { ngay: 29, thang: 8, nam: 2026 } }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const cu = r.value.find((g) => g.personId === N.cu);
    expect(cu).toMatchObject({ ngay: 15, thang: 8, nhuan: false, duong: '2026-09-25', chuoiDuong: '25/09/2026', conNgay: 27 });
    expect(r.value.some((g) => g.personId === N.song)).toBe(false);
  });

  it('cửa sổ 7 ngày: giỗ còn 27 ngày không vào; hôm nay đúng giỗ thì vào với conNgay 0', async () => {
    const bay = await run((tx) => listGioSapToiOps(tx, khach, { soNgay: 7, homNay: { ngay: 29, thang: 8, nam: 2026 } }));
    expect(bay.ok && bay.value.some((g) => g.personId === N.cu)).toBe(false);
    const dung = await run((tx) => listGioSapToiOps(tx, khach, { soNgay: 7, homNay: { ngay: 25, thang: 9, nam: 2026 } }));
    expect(dung.ok && dung.value.find((g) => g.personId === N.cu)?.conNgay).toBe(0);
  });

  it('gợi ý giỗ: ngày mất chính xác 06/10/2025 ⇒ 15/8; người mất chỉ biết năm ⇒ không gợi ý; đã có giỗ ⇒ không gợi ý', async () => {
    const mat = await run((tx) => getPersonOps(tx, admin, N.mat));
    expect(mat.ok && mat.value.goiYGio).toMatchObject({ ngay: 15, thang: 8, nhuan: false, tuNgayMat: '06/10/2025', chuoi: '15/8' });
    const cu = await run((tx) => getPersonOps(tx, admin, N.cu));
    expect(cu.ok && cu.value.goiYGio).toBeUndefined();
    // Ghi giỗ cho người mất ngày rõ ⇒ gợi ý biến mất, dòng giỗ nói cả hai lịch.
    await run(async (tx) => {
      const r = await addAssertionOp(tx, admin, { personId: N.mat, spec: { kind: 'gio', thang: 8, ngay: 15 }, source: nguon });
      expect(r.ok).toBe(true);
    });
    const sau = await run((tx) => getPersonOps(tx, admin, N.mat));
    expect(sau.ok && sau.value.goiYGio).toBeUndefined();
    const dong = sau.ok ? sau.value.assertions?.find((a) => a.kind === 'gio') : undefined;
    expect(dong?.valueText).toMatch(/^giỗ ngày 15 tháng 8 âm lịch — sắp tới: \d{2}\/\d{2}\/\d{4}$/);
  });

  it('người có hai giỗ sống ⇒ cả hai vào lịch với cờ mâu thuẫn (DON_TRI.gio) — không tự chọn hộ', async () => {
    await run(async (tx) => {
      const r = await addAssertionOp(tx, admin, { personId: N.mat, spec: { kind: 'gio', thang: 9, ngay: 12 }, source: nguon });
      expect(r.ok).toBe(true);
    });
    const lich = await run((tx) => listGioSapToiOps(tx, khach, { soNgay: 400, homNay: { ngay: 29, thang: 8, nam: 2026 } }));
    expect(lich.ok).toBe(true);
    if (!lich.ok) return;
    const cuaMat = lich.value.filter((g) => g.personId === N.mat);
    expect(cuaMat).toHaveLength(2);
    expect(cuaMat.every((g) => g.mauThuan)).toBe(true);
    expect(lich.value.find((g) => g.personId === N.cu)?.mauThuan).toBe(false);
  });

  it('ghi giỗ sai (tháng 13, ngày 0) bị core từ chối', async () => {
    const r1 = await run((tx) => addAssertionOp(tx, admin, { personId: N.cu, spec: { kind: 'gio', thang: 13, ngay: 1 }, source: nguon }));
    const r2 = await run((tx) => addAssertionOp(tx, admin, { personId: N.cu, spec: { kind: 'gio', thang: 1, ngay: 0 }, source: nguon }));
    expect(!r1.ok && r1.error.code === 'invalid' && !r2.ok && r2.error.code === 'invalid').toBe(true);
  });
});
