/**
 * Mốc đối chiếu cho phép đổi lịch (story 7-5). Mọi mốc là ngày đã in trên lịch bloc — sai một mốc
 * là đỏ, và một hàm đổi lịch sai một ngày là hệ đi nói với các cụ rằng nhà mình cúng nhầm.
 */
import { describe, expect, it } from 'vitest';
import { amSangDuong, cauGio, chuoiAm, docGio, duongSangAm, gioKeTiep, soNgayThangAm } from './am-lich';

const MOC: { duong: [number, number, number]; am: [number, number, number, boolean]; ten: string }[] = [
  { duong: [10, 2, 2024], am: [1, 1, 2024, false], ten: 'Tết Giáp Thìn' },
  { duong: [29, 1, 2025], am: [1, 1, 2025, false], ten: 'Tết Ất Tỵ' },
  { duong: [17, 2, 2026], am: [1, 1, 2026, false], ten: 'Tết Bính Ngọ' },
  { duong: [7, 4, 2025], am: [10, 3, 2025, false], ten: 'Giỗ Tổ Hùng Vương 2025' },
  { duong: [26, 4, 2026], am: [10, 3, 2026, false], ten: 'Giỗ Tổ Hùng Vương 2026' },
  { duong: [6, 10, 2025], am: [15, 8, 2025, false], ten: 'Trung thu 2025' },
  { duong: [17, 9, 2024], am: [15, 8, 2024, false], ten: 'Trung thu 2024' },
  { duong: [25, 7, 2025], am: [1, 6, 2025, true], ten: 'mồng 1 tháng 6 NHUẬN 2025' },
  { duong: [25, 6, 2025], am: [1, 6, 2025, false], ten: 'mồng 1 tháng 6 thường 2025' },
  { duong: [28, 1, 2025], am: [29, 12, 2024, false], ten: 'ba mươi Tết Giáp Thìn (tháng thiếu, 29)' },
];

describe('đổi lịch — đối chiếu mốc đã in trên lịch', () => {
  for (const m of MOC) {
    it(`${m.ten}: ${m.duong.join('/')} ⇄ ${m.am[0]}/${m.am[1]}${m.am[3] ? ' nhuận' : ''}/${m.am[2]}`, () => {
      const am = duongSangAm({ ngay: m.duong[0], thang: m.duong[1], nam: m.duong[2] });
      expect([am.ngay, am.thang, am.nam, am.nhuan]).toEqual(m.am);
      const duong = amSangDuong({ ngay: m.am[0], thang: m.am[1], nam: m.am[2], nhuan: m.am[3] });
      expect(duong).toEqual({ ngay: m.duong[0], thang: m.duong[1], nam: m.duong[2] });
    });
  }

  it('hỏi tháng nhuận ở năm không có ⇒ null, không bịa', () => {
    expect(amSangDuong({ ngay: 1, thang: 6, nam: 2026, nhuan: true })).toBeNull();
  });

  it('tháng thiếu/đủ: tháng 12 Giáp Thìn 29 ngày; tháng 7 Ất Tỵ 30 ngày (23/08–21/09/2025); tháng 8 Ất Tỵ 29', () => {
    expect(soNgayThangAm(12, 2024, false)).toBe(29);
    expect(soNgayThangAm(7, 2025, false)).toBe(30);
    expect(soNgayThangAm(8, 2025, false)).toBe(29);
  });
});

describe('gioKeTiep — ngày giỗ rơi vào ngày dương nào kế tiếp', () => {
  it('giỗ 15/8: hôm nay 29/08/2026 ⇒ 25/09/2026 (Trung thu Bính Ngọ)', () => {
    const r = gioKeTiep({ ngay: 15, thang: 8, nhuan: false }, { ngay: 29, thang: 8, nam: 2026 });
    expect(r.duong).toEqual({ ngay: 25, thang: 9, nam: 2026 });
  });
  it('giỗ đã qua trong năm âm ⇒ sang năm sau: giỗ 10/3, hôm nay 01/05/2026 ⇒ 16/04/2027', () => {
    const r = gioKeTiep({ ngay: 10, thang: 3, nhuan: false }, { ngay: 1, thang: 5, nam: 2026 });
    expect(r.duong.nam).toBe(2027);
    expect(duongSangAm(r.duong)).toMatchObject({ ngay: 10, thang: 3, nam: 2027 });
  });
  it('giỗ ĐÚNG hôm nay thì là hôm nay', () => {
    const r = gioKeTiep({ ngay: 1, thang: 1, nhuan: false }, { ngay: 17, thang: 2, nam: 2026 });
    expect(r.duong).toEqual({ ngay: 17, thang: 2, nam: 2026 });
  });
  it('giỗ ngày 30 của tháng thiếu ⇒ 29; tháng nhuận năm không có ⇒ tháng thường', () => {
    const r = gioKeTiep({ ngay: 30, thang: 12, nhuan: false }, { ngay: 1, thang: 1, nam: 2025 });
    expect(duongSangAm(r.duong)).toMatchObject({ ngay: 29, thang: 12, nam: 2024 });
    expect(r.lui29).toBe(true);
    expect(cauGio({ ngay: 30, thang: 12, nhuan: false }, r)).toContain('tháng thiếu, cúng ngày 29');
    const n = gioKeTiep({ ngay: 1, thang: 6, nhuan: true }, { ngay: 1, thang: 1, nam: 2026 });
    expect(n.nhuan).toBe(false);
    expect(duongSangAm(n.duong)).toMatchObject({ ngay: 1, thang: 6, nam: 2026 });
    expect(cauGio({ ngay: 1, thang: 6, nhuan: true }, n)).toContain('năm nay không có tháng nhuận');
    // Chuỗi gõ ở dạng NFD (macOS) vẫn đọc được.
    expect(docGio('1/6 nhua\u0323\u0302n')).toEqual({ ngay: 1, thang: 6, nhuan: true });
  });
});

describe('docGio — chuỗi người gõ', () => {
  it('nhận "15/8", "15-8", "15/8 nhuận"; từ chối 0/13, chữ', () => {
    expect(docGio('15/8')).toEqual({ ngay: 15, thang: 8, nhuan: false });
    expect(docGio(' 15-8 nhuận ')).toEqual({ ngay: 15, thang: 8, nhuan: true });
    expect(docGio('31/8')).toBeNull();
    expect(docGio('15/13')).toBeNull();
    expect(docGio('rằm tháng tám')).toBeNull();
    expect(chuoiAm({ ngay: 15, thang: 8, nhuan: true })).toBe('ngày 15 tháng 8 nhuận âm lịch');
  });
});
