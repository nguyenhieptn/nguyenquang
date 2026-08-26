/**
 * Trạng thái của lượt TÌM người — phần thuần của bộ chọn (story 6-1).
 *
 * Tách khỏi `.tsx` để test được không cần DOM, đúng nếp `ban-doi-the.ts` / `dat-nut-tam.ts` /
 * `loai-ghi-them.ts` của Epic 5.
 */
import type { KetQuaTim } from './man-admin';

/** Dùng lại đúng hình của ô tìm trên thanh trên — `nguCanh` đã là "đời 3 · chi 1.2 · sinh 1986". */
export type UngVienNguoi = KetQuaTim;

export type KetQuaTimNguoi = {
  khoa: string;
  ds: UngVienNguoi[];
  loi?: boolean;
  /** Người dùng đã bấm Escape cho ĐÚNG từ khoá này. Gõ thêm chữ là mở lại. */
  dong?: boolean;
};

export type TrangThaiTim =
  /** Chưa gõ gì — không bày gì cả, kể cả một câu "không có ai". */
  | 'trong'
  | 'dang-tim'
  /** Đọc HỎNG. Khác hẳn `khong-co`, và phải nói khác — xem chú thích dưới. */
  | 'loi'
  | 'co'
  | 'khong-co'
  /**
   * Có người trùng tên, nhưng người DUY NHẤT ấy là chính người đang mở hồ sơ.
   *
   * Bản đầu gộp ca này vào `khong-co` vì trạng thái được suy TRƯỚC khi lọc — nên màn nói
   * *"Chưa có ai tên ấy trong phả"* về đúng một người đang hiện tên ngay trên đầu cột. Đó là lời
   * nói dối mà cả file này viết ra để chống, chỉ khác đường vào: người vận hành tin và đi tạo
   * một bản trùng, mà trùng người thì phải gộp mới gỡ.
   */
  | 'chi-minh'
  /** Đã đóng bằng Escape. KHÔNG phải "đang tìm" — bản đầu suy nhầm và ô kẹt vĩnh viễn. */
  | 'da-dong';

/**
 * Suy trạng thái VÀ danh sách ứng viên trong một lượt, từ (từ khoá, kết quả, người đang mở hồ sơ).
 *
 * Trả cả hai cùng nhau là có chủ ý: bản đầu tách làm hai (trạng thái suy từ `ds`, danh sách lọc
 * sau) và hai thứ ấy lệch nhau ngay ở ca thường gặp nhất — tìm chính mình.
 *
 * KHÔNG có `setState` nào trong thân effect — ESLint `react-hooks/set-state-in-effect` cấm, và
 * repo đã vấp đúng chỗ này bốn lần (5-1 → 5-3 → 5-7 → 6-1).
 */
export function trangThaiTim(
  tuKhoa: string,
  ketQua: KetQuaTimNguoi,
  nguoiNayId: string | null = null,
): { trangThai: TrangThaiTim; ungVien: UngVienNguoi[] } {
  const khoa = tuKhoa.trim();
  if (khoa === '') return { trangThai: 'trong', ungVien: [] };
  if (ketQua.khoa !== khoa) return { trangThai: 'dang-tim', ungVien: [] };
  if (ketQua.dong === true) return { trangThai: 'da-dong', ungVien: [] };
  if (ketQua.loi === true) return { trangThai: 'loi', ungVien: [] };

  const ungVien = boNguoiNay(ketQua.ds, nguoiNayId);
  if (ungVien.length > 0) return { trangThai: 'co', ungVien };
  // Rỗng SAU khi lọc mà trước khi lọc thì không: người duy nhất khớp là chính mình.
  return { trangThai: ketQua.ds.length > 0 ? 'chi-minh' : 'khong-co', ungVien: [] };
}

/** Người đang mở hồ sơ không được nằm trong danh sách: không ai là cha của chính mình. */
export function boNguoiNay(ds: UngVienNguoi[], nguoiNayId: string | null): UngVienNguoi[] {
  return nguoiNayId === null ? ds : ds.filter((u) => u.personId !== nguoiNayId);
}
