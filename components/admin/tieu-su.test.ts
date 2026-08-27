/**
 * Dòng dẫn xuất dưới tên, và phép cắt tiền tố (story 6-7) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import { dongTieuSu, type TheTieuSu } from './tieu-su';

const the = (card: Partial<TheTieuSu['card']>): TheTieuSu => ({
  card: { doi: null, chi: null, ...card },
});

describe('dòng dẫn xuất', () => {
  it('đủ hai mục ⇒ đời trước, chi sau', () => {
    expect(dongTieuSu(the({ doi: 3, chi: '1.2' }))).toEqual(['đời 3', 'chi 1.2']);
  });

  it('thiếu chi ⇒ chỉ còn đời, KHÔNG in "chưa rõ"', () => {
    expect(dongTieuSu(the({ doi: 3 }))).toEqual(['đời 3']);
  });

  it('chi rỗng cũng là chưa biết, không phải một mã chi tên rỗng', () => {
    expect(dongTieuSu(the({ doi: 3, chi: '' }))).toEqual(['đời 3']);
  });

  it('không biết gì ⇒ mảng rỗng, cả dòng vắng hẳn', () => {
    expect(dongTieuSu(the({}))).toEqual([]);
  });

  /**
   * `đời 0` là số thật khi có người kết hôn vào họ mà cha được chép — xem `deferred-work.md`.
   * Ở đây chỉ chốt một điều: `0` KHÔNG được rơi vào nhánh "chưa biết".
   */
  it('đời 0 vẫn in ra, không bị nuốt như một giá trị rỗng', () => {
    expect(dongTieuSu(the({ doi: 0 }))).toEqual(['đời 0']);
  });
});
