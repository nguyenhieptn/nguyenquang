/**
 * BA MỨC TIN CẬY — chấm màu + chữ.
 *
 * Spine chi phối: DESIGN.md § Colors (ba mức tin cậy) · § Do's and Don'ts (Don't #1: không bao giờ
 *                 làm mờ tồn nghi) · EXPERIENCE.md § Accessibility Floor (sàn chữ 15px)
 *
 * FR: FR-1 · FR-2 (mức tin cậy gắn vào từng khẳng định) · FR-3
 *
 * ── Vì sao tách khỏi `khung-cay.tsx` (16/08/2026) ─────────────────────────
 *
 * `ChamTinCay` từng nằm chung file với `KhungCay`/`xepCay`, tức là chung file với `@xyflow/react`
 * và cả stylesheet của nó. Hợp lý khi ba màn cây còn sống — chấm tin cậy khi ấy là mảnh dùng chung
 * của một thẻ TRÊN CÂY.
 *
 * Sau khi thu phạm vi còn một màn, quan hệ đó đảo ngược: cây không còn, nhưng chấm tin cậy vẫn còn
 * — và nó là thứ nhỏ nhất trong sản phẩm, xuất hiện ở mọi nơi có một khẳng định. Để nó ở lại
 * `khung-cay.tsx` là bắt trang chủ tải cả một thư viện đồ thị để vẽ một hình tròn 10px.
 *
 * Mức tin cậy KHÔNG phải khái niệm của cây; nó là khái niệm của dữ liệu. Đây mới là chỗ đúng của nó.
 *
 * ── Luật không được vi phạm ───────────────────────────────────────────────
 *
 * **Chấm màu LUÔN đi kèm CHỮ.** Không bao giờ mã hoá ba mức chỉ bằng màu — phải đọc được khi in
 * đen trắng và với người mù màu. Đây là lý do component này tồn tại thay vì một cái `<span>` tô màu.
 */

/** Ba mức, đúng thứ tự giảm dần độ chắc. Không có mức thứ tư. */
export type MucTinCay = 'chac-chan' | 'theo-loi-ke' | 'ton-nghi';

const NHAN: Record<MucTinCay, string> = {
  'chac-chan': 'chắc chắn',
  'theo-loi-ke': 'theo lời kể',
  'ton-nghi': 'tồn nghi',
};

const MAU: Record<MucTinCay, string> = {
  'chac-chan': 'var(--color-tin-chac-chan)',
  'theo-loi-ke': 'var(--color-tin-loi-ke)',
  'ton-nghi': 'var(--color-tin-ton-nghi)',
};

/** Chấm màu + CHỮ. Không bao giờ chỉ màu. */
export function ChamTinCay({ muc }: { muc: MucTinCay }) {
  return (
    <span className="flex items-center gap-1.5 text-[15px] text-muted-foreground">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: MAU[muc] }}
        aria-hidden
      />
      {NHAN[muc]}
    </span>
  );
}
