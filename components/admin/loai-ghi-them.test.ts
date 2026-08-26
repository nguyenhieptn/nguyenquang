/**
 * Loại ghi thêm được và phép kiểm giá trị (story 5-6, mở rộng 5-7 và 6-1) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import {
  ghiThemDuoc,
  kiemGiaTri,
  KIEU_O,
  laLoaiChon,
  laQuanHe,
  LOAI_GHI_THEM,
  NHAN_LOAI,
} from './loai-ghi-them';

describe('loại khẳng định ghi thêm được từ cột phải', () => {
  it('đúng tám loại — cả tám loại của schema đều ghi thêm được', () => {
    // `place` vào từ 5-7 (FR-65), hai loại quan hệ vào từ 6-1. Cả ba là BỘ CHỌN, không phải ô
    // nhập, nên `KIEU_O` cho chúng kiểu riêng và biểu mẫu xử riêng.
    expect([...LOAI_GHI_THEM]).toEqual([
      'name',
      'gender',
      'birth',
      'death',
      'place',
      'note',
      'parent-child',
      'union-partner',
    ]);
    expect(ghiThemDuoc('parent-child')).toBe(true);
    expect(ghiThemDuoc('union-partner')).toBe(true);
    expect(ghiThemDuoc('khong-co-loai-nay')).toBe(false);
  });

  it('ba loại đi lối bộ chọn, năm loại đi lối ô nhập', () => {
    expect(LOAI_GHI_THEM.filter(laLoaiChon)).toEqual(['place', 'parent-child', 'union-partner']);
  });

  it('đúng hai loại là QUAN HỆ — chúng cần một người thứ hai', () => {
    expect(LOAI_GHI_THEM.filter(laQuanHe)).toEqual(['parent-child', 'union-partner']);
  });

  it('mỗi loại có nhãn và kiểu ô riêng — không loại nào rơi ra ngoài', () => {
    for (const l of LOAI_GHI_THEM) {
      expect(NHAN_LOAI[l], l).toBeTruthy();
      expect(KIEU_O[l], l).toBeTruthy();
    }
  });

  it('năm phải là bốn chữ số', () => {
    for (const l of ['birth', 'death'] as const) {
      expect(kiemGiaTri(l, '1986'), l).toEqual({ giaTri: '1986' });
      expect(kiemGiaTri(l, '86'), l).toHaveProperty('loi');
      expect(kiemGiaTri(l, '19866'), l).toHaveProperty('loi');
      expect(kiemGiaTri(l, 'một chín tám sáu'), l).toHaveProperty('loi');
    }
  });

  it('giới tính chỉ nhận ba giá trị của schema', () => {
    expect(kiemGiaTri('gender', 'male')).toEqual({ giaTri: 'male' });
    expect(kiemGiaTri('gender', 'nam')).toHaveProperty('loi');
  });

  it('rỗng và toàn khoảng trắng đều không ghi được', () => {
    for (const l of LOAI_GHI_THEM) {
      expect(kiemGiaTri(l, ''), l).toHaveProperty('loi');
      expect(kiemGiaTri(l, '   '), l).toHaveProperty('loi');
    }
  });

  it('tên và ghi chú nhận chữ tự do, giữ nguyên dấu', () => {
    expect(kiemGiaTri('name', ' Nguyễn Quang Hiệp ')).toEqual({ giaTri: 'Nguyễn Quang Hiệp' });
    expect(kiemGiaTri('note', 'cụ mất ở Thái Nguyên')).toEqual({
      giaTri: 'cụ mất ở Thái Nguyên',
    });
  });
});
