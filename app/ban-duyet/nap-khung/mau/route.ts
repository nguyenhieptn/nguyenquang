/**
 * Tải file mẫu CSV (FR-51) — GET trả thẳng khung rỗng từ core/seed.getTemplate().
 *
 * Route handler KHÔNG chạy qua layout, nên cổng quyền phải đứng ở đây: không đủ quyền
 * thì 404 trơn — không lộ cả sự tồn tại của khu vực bàn duyệt (cùng nếp với màn
 * "Khu vực Ban tu phả" của layout).
 */
import { resolveSession } from '@/core/identity';
import { getTemplate } from '@/core/seed';

export async function GET() {
  // AD-23: câu trả lời phụ thuộc người xem (đủ quyền → CSV, không → 404) nên KHÔNG được
  // nằm lại ở bất cứ tầng cache nào — cả hai nhánh đều mang `private, no-store`, kể cả
  // nhánh 404: một bản 404 cache chung sẽ chặn người có quyền tải mẫu.
  const KHONG_CACHE = 'private, no-store';

  const phien = await resolveSession();
  if (!phien || (phien.role !== 'admin' && phien.role !== 'branch-head')) {
    return new Response('Không tìm thấy', {
      status: 404,
      headers: { 'Cache-Control': KHONG_CACHE },
    });
  }

  return new Response(getTemplate(), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="khung-gia-pha.csv"',
      'Cache-Control': KHONG_CACHE,
    },
  });
}
