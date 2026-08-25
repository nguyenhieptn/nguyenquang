/**
 * Sáu loại khẳng định ghi thêm được từ cột phải — story 5-6, mở rộng ở 5-7 (thêm `place`).
 * Module THUẦN.
 *
 * ── Vì sao chỉ SÁU trong tám ─────────────────────────────────────────────────────────────
 * `parent-child` và `union-partner` cần chọn một NGƯỜI KHÁC làm đối tượng — đó là một bộ chọn
 * người, không phải một ô nhập, và nó thuộc về 5-4 (thêm người kèm quan hệ) hoặc màn Mảnh chưa
 * nối. Nên hai loại ấy **không được bày ra** trong ô chọn, chứ không phải bày rồi báo lỗi: một
 * lựa chọn chỉ để từ chối là một lời hứa suông.
 */

export const LOAI_GHI_THEM = ['name', 'gender', 'birth', 'death', 'place', 'note'] as const;
export type LoaiGhiThem = (typeof LOAI_GHI_THEM)[number];

export const NHAN_LOAI: Record<LoaiGhiThem, string> = {
  name: 'Tên',
  gender: 'Giới tính',
  birth: 'Năm sinh',
  death: 'Năm mất',
  place: 'Nơi chốn',
  note: 'Ghi chú',
};

/** Hình dạng ô nhập của từng loại — quyết định biểu mẫu vẽ gì. */
export const KIEU_O: Record<LoaiGhiThem, 'chu' | 'nam' | 'gioi' | 'nhieu-dong' | 'noi'> = {
  name: 'chu',
  gender: 'gioi',
  birth: 'nam',
  death: 'nam',
  /** Nơi không phải một ô nhập — nó là một bộ chọn có tìm kiếm và có lối tạo mới (FR-65). */
  place: 'noi',
  note: 'nhieu-dong',
};

/** `khoa` của một chồng (`AssertionKind`) có ghi thêm được từ đây không. */
export function ghiThemDuoc(khoa: string): khoa is LoaiGhiThem {
  return (LOAI_GHI_THEM as readonly string[]).includes(khoa);
}

export type LoiGiaTri = { loi: string } | { giaTri: string };

/**
 * Kiểm một giá trị theo loại, ở phía CLIENT — để báo ngay tại ô. Server kiểm lại độc lập; đây
 * chỉ là phép lịch sự với người đang gõ, không phải hàng rào.
 */
export function kiemGiaTri(loai: LoaiGhiThem, raw: string): LoiGiaTri {
  const v = raw.trim();
  if (v === '') return { loi: 'chưa có gì' };
  if (loai === 'birth' || loai === 'death') {
    if (!/^\d{4}$/.test(v)) return { loi: 'bốn chữ số' };
  }
  if (loai === 'gender' && !['male', 'female', 'other'].includes(v)) {
    return { loi: 'chưa chọn' };
  }
  // `place` không đi qua đây: giá trị của nó là một `placeId` đã chọn từ danh mục, không phải
  // chữ người dùng gõ. Biểu mẫu xử riêng.
  return { giaTri: v };
}
