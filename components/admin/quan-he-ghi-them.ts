/**
 * Hai loại khẳng định QUAN HỆ ghi thêm được từ cột phải — story 6-1. Module THUẦN.
 *
 * ── Vì sao chiều phải nằm ở một module riêng, có test ────────────────────────────────────
 * `parent-child` có chiều: khẳng định mang `subject = CON`, `object = CHA/MẸ`
 * (`core/person/read-ops.ts:306-311` dựng câu *"là con ruột của X"* từ chính chiều ấy).
 *
 * Ghi ngược chiều KHÔNG sinh lỗi nào: `tsc` xanh, test khác xanh, cây vẽ ra vẫn đẹp — chỉ là cha
 * con đảo nhau, im lặng, trong một hệ không có nút xoá (AD-4). Đó là lớp lỗi C4 của lượt review
 * Epic 5 thuộc về. Nên phép tính chiều tách hẳn ra đây để test được từng hướng một.
 */

export const HUONG_QUAN_HE = ['cha-me', 'con'] as const;
export type HuongQuanHe = (typeof HUONG_QUAN_HE)[number];

/** Nhãn nói theo NGƯỜI VỪA CHỌN, vì đó là thứ người vận hành vừa làm. */
export const NHAN_HUONG: Record<HuongQuanHe, string> = {
  'cha-me': 'là cha/mẹ của người này',
  con: 'là con của người này',
};

export const QUAN_HE_MAU = ['blood', 'adopted', 'heir'] as const;
export type QuanHeMau = (typeof QUAN_HE_MAU)[number];

/**
 * CHÉP từ `RELATION_VN` (`core/person/read-ops.ts:167`), không import — component client không
 * được import `@/core/*` (`docs/build-contract.md § Phân tầng`).
 *
 * Lệch một chữ ở đây là biểu mẫu hứa một câu mà panel hiện một câu khác, trên đúng dòng người
 * vận hành vừa ghi. Bài test `quan-he-ghi-them.test.ts` ghim cả ba chuỗi để chỗ lệch thành đỏ.
 */
export const NHAN_QUAN_HE: Record<QuanHeMau, string> = {
  blood: 'con ruột',
  adopted: 'con nuôi',
  heir: 'con thừa tự',
};

export type LoaiQuanHe = 'parent-child' | 'union-partner';

/**
 * Chiều của một khẳng định `parent-child`.
 *
 * `nguoiNayId` là người đang mở hồ sơ ở cột phải; `nguoiKiaId` là người vừa chọn trong bộ chọn.
 */
export function chieuChaCon(
  nguoiNayId: string,
  nguoiKiaId: string,
  huong: HuongQuanHe,
): { conId: string; chaId: string } {
  return huong === 'cha-me'
    ? // người vừa chọn LÀ CHA/MẸ ⇒ người đang mở hồ sơ là con
      { conId: nguoiNayId, chaId: nguoiKiaId }
    : // người vừa chọn LÀ CON ⇒ người đang mở hồ sơ là cha/mẹ
      { conId: nguoiKiaId, chaId: nguoiNayId };
}

/**
 * TRỌN phép ánh xạ từ ý người vận hành sang lời gọi `addAssertion` — `{ personId, spec }`.
 *
 * ── Vì sao trọn phép ánh xạ nằm ở đây, không nằm trong server action ─────────────────────
 * Ranh giới tầng chặn cả hai chiều: `app/` không được chạm ORM (AD-1), `core/` không được import
 * UI. Nên một bài test chạm database mà kiểm phép tính chiều của biểu mẫu **không có chỗ nào để
 * sống** — thử đặt ở `app/` lẫn ở `core/` đều bị `npm run lint` chặn, và chặn đúng.
 *
 * Lối ra là đừng bắc cầu qua ranh giới: cho phần THUẦN mang trọn phép ánh xạ, rồi ghim nó bằng
 * một bài test thuần. Nửa còn lại — `{ personId, spec }` ấy rơi vào database đúng chỗ — đã có
 * `core/assertion/assertion.test.ts` ghim từ story 1-2. Hai bài test nối đầu vào nhau, không bài
 * nào phải phá tầng.
 */
export function dungLoiGoiQuanHe(a: {
  loai: LoaiQuanHe;
  nguoiNayId: string;
  nguoiKiaId: string;
  huong: HuongQuanHe;
  quanHe: QuanHeMau;
}):
  | { personId: string; spec: { kind: 'union-partner'; partnerId: string } }
  | { personId: string; spec: { kind: 'parent-child'; parentId: string; relation: QuanHeMau } } {
  if (a.loai === 'union-partner') {
    return { personId: a.nguoiNayId, spec: { kind: 'union-partner', partnerId: a.nguoiKiaId } };
  }
  const { conId, chaId } = chieuChaCon(a.nguoiNayId, a.nguoiKiaId, a.huong);
  return { personId: conId, spec: { kind: 'parent-child', parentId: chaId, relation: a.quanHe } };
}

/**
 * Câu SẼ ĐƯỢC GHI.
 *
 * AC 13: bày thẳng câu, không bày hai nút "lên"/"xuống". Người vận hành đọc câu rồi mới bấm —
 * đó là hàng rào duy nhất chống ghi ngược chiều mà không cần họ hiểu chiều của khẳng định.
 *
 * ── Chỉ nhánh cha-con dựng đúng hình panel hiện lại ──────────────────────────────────────
 * `parent-child` dùng lại nguyên `RELATION_VN`, nên câu ở đây và dòng trong panel là một.
 * `union-partner` thì KHÔNG: panel in *"vợ/chồng với B"* (một chiều, từ hồ sơ đang mở), còn ở
 * đây quan hệ chưa gắn vào hồ sơ nào nên nói đối xứng mới đúng — *"B và A là vợ chồng"*. Hai câu
 * khác hình vì chúng trả lời hai câu hỏi khác nhau; chú thích cũ nói chúng giống nhau, và đó là
 * chỗ lượt review 26/08 bắt được.
 */
export function cauSeGhi(a: {
  loai: LoaiQuanHe;
  huong: HuongQuanHe;
  quanHe: QuanHeMau;
  tenNguoiNay: string;
  tenNguoiKia: string;
}): string {
  if (a.loai === 'union-partner') {
    return `${a.tenNguoiKia} và ${a.tenNguoiNay} là vợ chồng.`;
  }
  const { conId, chaId } = chieuChaCon('NAY', 'KIA', a.huong);
  const ten = (m: string) => (m === 'NAY' ? a.tenNguoiNay : a.tenNguoiKia);
  return `${ten(conId)} là ${NHAN_QUAN_HE[a.quanHe]} của ${ten(chaId)}.`;
}

/**
 * Dòng của chồng này có nút **"Loại"** không, kể cả khi chồng KHÔNG mâu thuẫn.
 *
 * ── Vì sao phải hỏi riêng câu này ────────────────────────────────────────────────────────
 * Panel chỉ mọc nút "Loại" trên chồng MÂU THUẪN — đúng cho sáu loại cũ: ở đó nút ấy nghĩa là
 * *"chọn một trong hai giá trị không thể cùng đúng"*.
 *
 * Nhưng `parent-child` và `union-partner` là chồng NỐI TIẾP (`core/person/chong.ts:45,47` —
 * cha và mẹ là hai khẳng định cùng đúng), nên chúng KHÔNG BAO GIỜ mâu thuẫn, nên chúng không bao
 * giờ có nút ấy. Ghi nhầm một cạnh cha-con là ghi nhầm vĩnh viễn — trong một story sinh ra để
 * làm cho cạnh ghi được. Đường vào mà không có đường ra là nửa sản phẩm.
 *
 * `place` và `note` cũng nối tiếp và cũng chưa có đường gỡ; đó là cùng một lỗ, rộng hơn phạm vi
 * story này. Ghi ra ở đây để lần sau không phải điều tra lại.
 */
export function loaiDuocDuNoiTiep(khoaChong: string): boolean {
  return khoaChong === 'parent-child' || khoaChong === 'union-partner';
}
