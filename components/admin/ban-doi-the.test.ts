/**
 * Bất biến DUY NHẤT giữ cho thẻ không đè lên nhau.
 *
 * `khung-cay-admin.tsx` đo chiều cao thẻ bằng `dongBanDoi(...).length * 22 + 68`, còn `the-nguoi.tsx`
 * vẽ đúng danh sách ấy. Bài test này khoá HÀNH VI của hàm chung. Repo đã sửa lỗi "thẻ đè lên nhau"
 * hai lần (23/08, 24/08), cả hai lần đều vì chiều cao đo được lệch chiều cao vẽ ra — và lần thứ ba
 * suýt xảy ra ngày 25/08, khi bản vá xem trước vợ/chồng thêm một dòng mà phép đo vẫn kẹp ở hai.
 */
import { describe, expect, it } from 'vitest';
import { dongBanDoi } from './ban-doi-the';

const that = (...ten: string[]) => ten.map((t) => ({ ten: t }));
const truoc = { ten: 'người sắp thêm', sapThem: true };

describe('dongBanDoi', () => {
  it('không có ai thì không có dòng nào', () => {
    expect(dongBanDoi([])).toEqual([]);
  });

  it('một và hai người thì bày đủ tên, không đếm tắt', () => {
    expect(dongBanDoi(that('A'))).toHaveLength(1);
    expect(dongBanDoi(that('A', 'B')).map((d) => d.ten)).toEqual(['A', 'B']);
  });

  it('đông hơn hai thì một tên + một dòng ĐẾM, không cắt im lặng', () => {
    const ra = dongBanDoi(that('A', 'B', 'C', 'D'));
    expect(ra).toHaveLength(2);
    expect(ra[0].ten).toBe('A');
    expect(ra[1].dem).toBe(3); // B, C, D — cộng lại đủ bốn người, không ai biến mất
    expect(ra[0].dem).toBeUndefined();
  });

  it('BẢN XEM TRƯỚC luôn có dòng, kể cả khi đã đủ hai đời vợ', () => {
    /**
     * Đây là ca bản vá 25/08 làm hỏng lần đầu: `slice(0, length > 2 ? 1 : 2)` trên danh sách đã
     * gộp khiến hai vợ thật + một xem trước = 3 ⇒ chỉ còn vợ đầu và dòng đếm, xem trước bay mất.
     * Hướng "vợ/chồng" không sinh node riêng nên khi ấy canvas KHÔNG nhúc nhích gì — mà cả story
     * dựng lên từ câu "thấy vị trí TRƯỚC khi ghi".
     */
    const ra = dongBanDoi([...that('A', 'B'), truoc]);
    expect(ra.filter((d) => d.sapThem)).toHaveLength(1);
    expect(ra).toHaveLength(3);

    const dong = dongBanDoi([...that('A', 'B', 'C'), truoc]);
    expect(dong.filter((d) => d.sapThem)).toHaveLength(1);
    expect(dong).toHaveLength(3); // A · và 2 người nữa · xem trước
  });

  it('xem trước luôn đứng CUỐI — chỗ mắt tìm thứ vừa gõ', () => {
    const ra = dongBanDoi([...that('A'), truoc]);
    expect(ra[ra.length - 1].sapThem).toBe(true);
  });

  it('trùng tên vẫn ra đủ dòng — thẻ chừa chỗ cho cả hai', () => {
    // `key` theo chỉ số chứ không theo tên chính vì ca này: hai người cùng tên là chuyện phả có
    // thật, và bản xem trước còn mang đúng cái tên đang gõ.
    expect(dongBanDoi(that('Nguyễn Thị Lan', 'Nguyễn Thị Lan'))).toHaveLength(2);
    expect(dongBanDoi([...that('Nguyễn Thị Lan'), { ten: 'Nguyễn Thị Lan', sapThem: true }])).toHaveLength(2);
  });

  it('KHÔNG BAO GIỜ quá ba dòng — chiều cao thẻ có trần', () => {
    for (const n of [0, 1, 2, 3, 5, 40]) {
      expect(dongBanDoi(that(...Array.from({ length: n }, (_, i) => `N${i}`))).length).toBeLessThanOrEqual(2);
      expect(
        dongBanDoi([...that(...Array.from({ length: n }, (_, i) => `N${i}`)), truoc]).length,
      ).toBeLessThanOrEqual(3);
    }
  });
});
