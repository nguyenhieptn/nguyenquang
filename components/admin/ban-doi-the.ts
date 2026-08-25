/**
 * BẠN ĐỜI TRÊN THẺ — module THUẦN: không React, không React Flow, không CSS.
 *
 * Tách khỏi `the-nguoi.tsx` (25/08, code review lượt hai) vì phép đếm dòng ở đây là thứ
 * `khung-cay-admin.tsx` dùng để ĐO CHIỀU CAO THẺ. Hai phép đếm riêng cho cùng một câu hỏi là
 * cách lỗi **"thẻ đè lên nhau"** quay lại — repo đã sửa nó hai lần (23/08 và 24/08), cả hai lần
 * đều vì chiều cao thật khác chiều cao `xepCay` tưởng.
 *
 * Cùng nếp `dat-nut-tam.ts`: cái gì cả canvas lẫn thẻ phải đồng ý thì tách ra thành một hàm
 * thuần, và có bài test riêng.
 */
/** Một người bạn đời trên thẻ. `sapThem` = bản xem trước, chưa ghi gì (story 5-4 hướng vợ/chồng). */
export type BanDoiThe = { ten: string; sapThem?: boolean };

/** Một DÒNG bạn đời thẻ sẽ vẽ. `dem` = dòng tổng kết "và N người nữa", không phải một người. */
export type DongBanDoi = { ten: string; sapThem?: boolean; dem?: number };

/**
 * Các dòng bạn đời mà thẻ SẼ VẼ — một hàm, hai nơi đọc.
 *
 * `components/admin/khung-cay-admin.tsx` đo chiều cao thẻ bằng chính hàm này. Đếm dòng ở hai chỗ
 * bằng hai phép khác nhau là cách lỗi **"thẻ đè lên nhau"** quay lại — repo đã sửa nó hai lần
 * (23/08 và 24/08), cả hai lần đều vì chiều cao thật khác chiều cao `xepCay` tưởng.
 *
 * Hai luật:
 *   · Bản XEM TRƯỚC luôn được một dòng. Nó là lý do hướng "vợ/chồng" có xem trước; cắt nó đi
 *     thì với một mốc đã có hai đời vợ — đúng ca mà `banDoi` được nới thành danh sách để đỡ —
 *     canvas không nhúc nhích, và câu "thấy vị trí TRƯỚC khi ghi" thành lời hứa suông.
 *   · Người THẬT được tối đa hai dòng; đông hơn thì dòng thứ hai đếm số còn lại. Không bao giờ
 *     cắt im lặng — người bị bỏ mà không ai biết là có người bị bỏ chính là con bug vừa vá.
 */
export function dongBanDoi(banDoi: BanDoiThe[]): DongBanDoi[] {
  const truoc = banDoi.filter((b) => b.sapThem);
  const that = banDoi.filter((b) => !b.sapThem);
  const hien = that.length > 2 ? that.slice(0, 1) : that;
  const con = that.length - hien.length;
  return [...hien, ...(con > 0 ? [{ ten: '', dem: con }] : []), ...truoc];
}
