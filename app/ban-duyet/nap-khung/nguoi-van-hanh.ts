/**
 * Nhãn "ai đang vận hành" cho ThanhBanDuyet — FR-39: bàn duyệt phải nói rõ việc sắp ghi
 * sẽ mang tên ai. `SessionContext` (AD-24) cố ý không mang tên hiển thị, nên tên đọc từ
 * phiên Better Auth qua bề mặt `auth` của core/identity.
 *
 * Dùng chung cho các trang bàn duyệt (xem-truoc import từ đây). Trả `null` khi không có
 * phiên đủ quyền — thanh sẽ bỏ trống góc phải thay vì bịa tên.
 */
import { headers } from 'next/headers';
import { auth, resolveSession } from '@/core/identity';

export async function nhanNguoiVanHanh(): Promise<string | null> {
  const phien = await resolveSession();
  if (!phien || (phien.role !== 'admin' && phien.role !== 'branch-head')) return null;

  const vaiTro = phien.role === 'admin' ? 'quản trị' : 'trưởng chi';
  const taiKhoan = await auth.api.getSession({ headers: await headers() });
  const ten = taiKhoan?.user.name?.trim();
  return ten ? `${ten} · ${vaiTro}` : vaiTro;
}
