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
  const phien = await resolveSession();
  if (!phien || (phien.role !== 'admin' && phien.role !== 'branch-head')) {
    return new Response('Không tìm thấy', { status: 404 });
  }

  return new Response(getTemplate(), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="khung-gia-pha.csv"',
    },
  });
}
