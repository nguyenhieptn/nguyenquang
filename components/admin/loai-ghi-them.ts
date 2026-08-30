/**
 * Tám loại khẳng định ghi thêm được từ cột phải — story 5-6, mở rộng ở 5-7 (`place`) và 6-1
 * (`parent-child`, `union-partner`). Module THUẦN.
 *
 * ── Vì sao hai loại QUAN HỆ vào muộn hơn sáu loại kia ────────────────────────────────────
 * Chúng cần chọn một NGƯỜI KHÁC làm đối tượng — một bộ chọn người, không phải một ô nhập. Story
 * 5-6 chưa có bộ chọn ấy nên để trống, và hệ quả đo được trên phả thật tối 25/08/2026: cây gia
 * phả gãy làm hai mảnh vì thiếu MỘT cạnh cha-con, mà không đường nào trong cả bàn làm việc ghi
 * được nó — `themNguoi` chỉ tạo người MỚI, `/admin/hop-nhat` chỉ gộp bản trùng.
 *
 * Chiều của `parent-child` nằm ở `quan-he-ghi-them.ts`, có test riêng: ghi ngược chiều không
 * sinh lỗi ở bất kỳ tầng nào khác.
 */

export const LOAI_GHI_THEM = [
  'name',
  'gender',
  'birth',
  'death',
  'gio',
  'place',
  'note',
  'parent-child',
  'union-partner',
] as const;
export type LoaiGhiThem = (typeof LOAI_GHI_THEM)[number];

export const NHAN_LOAI: Record<LoaiGhiThem, string> = {
  name: 'Tên',
  gender: 'Giới tính',
  birth: 'Năm sinh',
  death: 'Năm mất',
  gio: 'Ngày giỗ',
  place: 'Nơi chốn',
  note: 'Ghi chú',
  // Đúng nhãn `core/person/chong.ts:65-66` đã dùng cho hai chồng ấy. Đặt nhãn thứ hai cho cùng
  // một thứ là dạy người vận hành rằng đây là hai thứ khác nhau.
  'parent-child': 'Cha mẹ',
  'union-partner': 'Vợ chồng',
};

/** Hình dạng ô nhập của từng loại — quyết định biểu mẫu vẽ gì. */
export const KIEU_O: Record<LoaiGhiThem, 'chu' | 'nam' | 'gioi' | 'nhieu-dong' | 'noi' | 'nguoi' | 'gio'> = {
  name: 'chu',
  gender: 'gioi',
  birth: 'nam',
  death: 'nam',
  /** Ngày giỗ ÂM LỊCH gõ như người ta nói: `15/8`, `15/8 nhuận` — một ô, kiểm bằng `docGio`. */
  gio: 'gio',
  /** Nơi không phải một ô nhập — nó là một bộ chọn có tìm kiếm và có lối tạo mới (FR-65). */
  place: 'noi',
  note: 'nhieu-dong',
  /** Quan hệ cũng không phải ô nhập: giá trị là một `personId` đã chọn, cộng một CHIỀU. */
  'parent-child': 'nguoi',
  'union-partner': 'nguoi',
};

/** `khoa` của một chồng (`AssertionKind`) có ghi thêm được từ đây không. */
export function ghiThemDuoc(khoa: string): khoa is LoaiGhiThem {
  return (LOAI_GHI_THEM as readonly string[]).includes(khoa);
}

export type LoiGiaTri = { loi: string } | { giaTri: string };

/** Loại này đi lối bộ chọn (id + có thể cả chiều), không đi lối ô nhập chữ. */
export function laLoaiChon(loai: LoaiGhiThem): boolean {
  return KIEU_O[loai] === 'noi' || KIEU_O[loai] === 'nguoi';
}

/** Hai loại QUAN HỆ — cần một người thứ hai, và `parent-child` cần cả chiều. */
export function laQuanHe(loai: LoaiGhiThem): loai is 'parent-child' | 'union-partner' {
  return loai === 'parent-child' || loai === 'union-partner';
}

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
  if (loai === 'gio') {
    // Cùng luật với `core/lich/am-lich.ts § docGio` — chép lại ở đây vì `components/` không import
    // core (build-contract § Phân tầng); core kiểm lần nữa khi ghi.
    const m = v.toLowerCase().match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})(\s*(nhuận|nhuan))?$/);
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 30 || Number(m[2]) < 1 || Number(m[2]) > 12) {
      return { loi: 'ngày/tháng âm lịch, ví dụ 15/8' };
    }
  }
  if (loai === 'gender' && !['male', 'female', 'other'].includes(v)) {
    return { loi: 'chưa chọn' };
  }
  // `place` và hai loại quan hệ không đi qua đây: giá trị của chúng là một id đã chọn từ một bộ
  // chọn, không phải chữ người dùng gõ. Biểu mẫu xử riêng.
  return { giaTri: v };
}
