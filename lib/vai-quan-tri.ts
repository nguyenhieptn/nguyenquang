/**
 * Người đang xem có vào được BÀN LÀM VIỆC không.
 *
 * ── CHỈ được import từ SERVER component ──────────────────────────────────────────────────
 * Nó đọc phiên qua `core/identity`, và chuỗi phụ thuộc ấy kéo theo `pg`. Import từ một client
 * component thì `next build` gãy với *"Can't resolve 'dns'"* — eslint KHÔNG bắt được (luật chỉ
 * chặn ruột core và `@/db`, không chặn bề mặt core), nên chỗ chặn duy nhất là lượt build.
 *
 * Vì thế `components/pha/thanh-dieu-huong.tsx` nhận kết quả này qua THAM SỐ chứ không tự gọi:
 * nó còn được dựng từ `error.tsx`, mà error boundary buộc phải là client.
 */
import { coQuyenDuyet, resolveSession } from '@/core/identity';
import type { AttachmentRole } from '@/core/identity';

/** Đúng hai vai mà `app/admin/layout.tsx` cho qua cổng. Bày lối cho vai khác là mời tới cửa khoá. */
export async function coBanLamViec(): Promise<boolean> {
  const phien = await resolveSession();
  // Cùng một lens với core (`coQuyenDuyet`, story 7-1) — không phải bản chép thứ hai của cùng câu hỏi.
  return phien !== null && coQuyenDuyet(phien);
}

/**
 * VAI của người đang xem — cho những màn cần biết *"mình trao được vai nào"* (story 6-2), chứ
 * không chỉ *"mình có vào được bàn không"*.
 *
 * Cùng hàng rào import với `coBanLamViec` ở trên: CHỈ server component. Client nhận qua tham số.
 */
export async function vaiCuaToi(): Promise<AttachmentRole | 'guest'> {
  const phien = await resolveSession();
  return phien?.role ?? 'guest';
}
