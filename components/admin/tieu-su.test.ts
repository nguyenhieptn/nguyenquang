/**
 * Tiểu sử cơ bản ở đỉnh cột phải (story 6-7) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import { dongTieuSu, gonGiaTri, type TheTieuSu } from './tieu-su';

const the = (card: Partial<TheTieuSu['card']>): TheTieuSu => ({
  card: { lifespan: '', doi: null, chi: null, ...card },
});

describe('dòng tiểu sử', () => {
  it('đủ ba mục ⇒ ba mục, đúng thứ tự: đời người trước, rồi vị trí trong phả', () => {
    expect(dongTieuSu(the({ lifespan: '1941–2019', doi: 3, chi: '1.2' })).map((m) => m.chu)).toEqual([
      '1941–2019',
      'đời 3',
      'chi 1.2',
    ]);
  });

  it('thiếu đời và chi ⇒ chỉ còn lifespan, KHÔNG in "chưa rõ"', () => {
    expect(dongTieuSu(the({ lifespan: 'sinh 1986' })).map((m) => m.chu)).toEqual(['sinh 1986']);
  });

  it('lifespan rỗng ⇒ vắng mục ấy, không để lại chỗ trống giữa hai dấu chấm', () => {
    expect(dongTieuSu(the({ doi: 3 })).map((m) => m.chu)).toEqual(['đời 3']);
  });

  it('không biết gì ⇒ mảng rỗng, khối tóm tắt vắng hẳn', () => {
    expect(dongTieuSu(the({}))).toEqual([]);
  });

  /**
   * AD-5: số đời và mã chi TÍNH LÚC ĐỌC, không lưu. Không có hàng nào để sửa, nên bày chúng như
   * bấm được là hứa một thứ không tồn tại.
   */
  it('đời và chi KHÔNG bấm được; năm sinh–mất thì có', () => {
    const ra = dongTieuSu(the({ lifespan: '1941–2019', doi: 3, chi: '1.2' }));
    expect(ra.map((m) => m.khoaChong)).toEqual(['birth', null, null]);
  });

  it('người còn sống: lấy NGUYÊN chuỗi của core, không tự ghép lại', () => {
    // FR-37 — người sống chỉ hiện NĂM. Luật ấy nằm ở core; tầng này không được dựng lại.
    expect(dongTieuSu(the({ lifespan: 'sinh 1986' }))[0]!.chu).toBe('sinh 1986');
  });
});

describe('bỏ tiền tố nói lại nhãn', () => {
  it('cắt đúng tiền tố của từng loại', () => {
    expect(gonGiaTri('name', 'tên Nguyễn Quang Hải')).toBe('Nguyễn Quang Hải');
    expect(gonGiaTri('gender', 'giới tính nam')).toBe('nam');
    expect(gonGiaTri('birth', 'năm sinh 1989')).toBe('1989');
    expect(gonGiaTri('death', 'năm mất 2019')).toBe('2019');
    expect(gonGiaTri('union-partner', 'vợ/chồng với Quản Thị Huyền')).toBe('Quản Thị Huyền');
    expect(gonGiaTri('note', 'ghi chú: cụ có công với làng')).toBe('cụ có công với làng');
  });

  it('giữ nguyên phần đuôi mang nghĩa', () => {
    expect(gonGiaTri('birth', 'năm sinh 1989 (ước chừng)')).toBe('1989 (ước chừng)');
    expect(gonGiaTri('birth', 'năm sinh chưa rõ')).toBe('chưa rõ');
  });

  /** `parent-child` KHÔNG có tiền tố thừa: "con ruột của X" là cả câu, và `rel` mới là thông tin. */
  it('cha mẹ và nơi chốn giữ nguyên — chúng không nói lại nhãn', () => {
    expect(gonGiaTri('parent-child', 'là con ruột của Nguyễn Quang Vinh')).toBe(
      'là con ruột của Nguyễn Quang Vinh',
    );
    expect(gonGiaTri('place', 'quê quán: Quang Trung, Định Hoá')).toBe(
      'quê quán: Quang Trung, Định Hoá',
    );
  });

  it('không khớp tiền tố nào ⇒ trả nguyên chuỗi, thà thừa còn hơn cắt cụt', () => {
    expect(gonGiaTri('birth', 'sinh ngày 12/03/1989')).toBe('sinh ngày 12/03/1989');
    expect(gonGiaTri('khong-co-loai-nay', 'gì đó')).toBe('gì đó');
  });
});
