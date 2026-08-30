/**
 * Tầng adapter của màn Nơi chốn (story 6-4, thêm ở code review 29/08) — gọi thẳng ba server action
 * với PHIÊN THẬT trên dòng họ thử, cùng nếp `app/admin/cay/actions.test.ts`: hai mock (`next/headers`,
 * `next/cache`) và thêm `next/navigation` vì màn này VỀ CỬA khi hết phiên (`redirect` ném ngoài request).
 *
 * Lint AD-1 áp cả cho tệp này: đọc lại qua bề mặt `@/core/place`, không `@/db`, không `*\/ops`.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let cookieHienTai = '';
vi.mock('next/headers', () => ({
  headers: async () => new Headers(cookieHienTai ? { cookie: cookieHienTai } : {}),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock('next/navigation', () => ({
  redirect: (duong: string) => {
    throw new Error(`NEXT_REDIRECT:${duong}`);
  },
}));

import { dungDongHoThu, donDongHoThu, type DongHoThu } from '@/core/gates/dong-ho-thu';
import { listMergedPlaces, listPlaces } from '@/core/place';
import { gopNoi, suaNoi, tachNoi } from './actions';

let d: DongHoThu;
let dinhHoa = '';
let vungTau = '';
let langGiua = '';

beforeAll(async () => {
  d = await dungDongHoThu({ tienTo: 'S64a' });
  cookieHienTai = d.quanTri.cookie;
  const ds = await listPlaces();
  if (!ds.ok) throw new Error(ds.error.message);
  const tim = (parentUnit: string) => ds.value.find((n) => n.parentUnit === parentUnit)?.placeId ?? '';
  dinhHoa = tim('Định Hoá, Thái Nguyên');
  vungTau = tim('Vũng Tàu');
  langGiua = ds.value.find((n) => n.name.endsWith('Làng Giữa'))?.placeId ?? '';
  if (!dinhHoa || !vungTau || !langGiua) throw new Error('dòng họ thử thiếu ba nơi');
}, 60_000);

afterAll(async () => {
  cookieHienTai = '';
  if (d) await donDongHoThu({ ...d, emails: [d.quanTri.email, d.thanhVien.email, d.chuaGan.email] });
});

describe('ai làm được gì (cổng thật qua phiên thật)', () => {
  it('khách (không cookie) ⇒ về cửa đăng nhập, không phải một câu đỏ cụt', async () => {
    cookieHienTai = '';
    await expect(suaNoi(langGiua, 'X', '')).rejects.toThrow('NEXT_REDIRECT:/dang-nhap');
  });

  it('thành viên thường ⇒ forbidden; tham số không phải chuỗi ⇒ invalid, không phải 500', async () => {
    cookieHienTai = d.thanhVien.cookie;
    const r = await gopNoi(vungTau, dinhHoa);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('forbidden');
    // Một POST tự dựng gửi số thay vì chuỗi: hợp đồng Result vẫn giữ.
    const xau = await suaNoi(42 as unknown as string, 'X', '');
    expect(xau.ok).toBe(false);
    if (!xau.ok) expect(xau.error.code).toBe('invalid');
  });
});

describe('quản trị: sửa · gộp · tách trên dòng họ thử', () => {
  it('sửa tên: danh mục đọc ra tên mới', async () => {
    cookieHienTai = d.quanTri.cookie;
    const r = await suaNoi(langGiua, `${d.tienTo} Làng Giữa`, 'Xã Thử');
    expect(r.ok).toBe(true);
    const ds = await listPlaces();
    expect(ds.ok && ds.value.find((n) => n.placeId === langGiua)?.parentUnit).toBe('Xã Thử');
  });

  it('gộp Vũng Tàu vào Định Hoá: đếm đúng khẳng định của Em, bên thua vào khu Đã gộp; gộp ĐI nơi thắng bị chặn; tách lại thì về', async () => {
    cookieHienTai = d.quanTri.cookie;
    // Dòng họ thử ghi cho Em hai quê quán, một ở mỗi Quang Trung (story 6-5) ⇒ bên thua mang đúng 1.
    const gop = await gopNoi(vungTau, dinhHoa);
    expect(gop.ok).toBe(true);
    if (!gop.ok) return;
    expect(gop.value.soKhangDinh).toBe(1);
    const daGop = await listMergedPlaces();
    expect(daGop.ok && daGop.value.find((n) => n.placeId === vungTau)?.thang.placeId).toBe(dinhHoa);

    const chuoi = await gopNoi(dinhHoa, langGiua);
    expect(chuoi.ok).toBe(false);
    if (!chuoi.ok) expect(chuoi.error.code).toBe('conflict');

    expect((await tachNoi(vungTau)).ok).toBe(true);
    const lai = await tachNoi(vungTau);
    expect(lai.ok).toBe(false);
    if (!lai.ok) expect(lai.error.code).toBe('conflict');
    const ds = await listPlaces();
    expect(ds.ok && ds.value.some((n) => n.placeId === vungTau)).toBe(true);
  });
});
