/**
 * Điểm về sau một lượt đăng nhập KHÔNG đi qua biểu mẫu (Google OAuth, story 7-6): nhà cung cấp trả
 * trình duyệt về đây với cookie phiên đã đặt, và chỉ server mới biết tài khoản ấy đã có chỗ trong
 * phả chưa — cùng phép `dichSauDangNhap` với biểu mẫu thường (EXPERIENCE § Chưa gắn node: chưa có
 * chỗ thì về luồng nhận chỗ, không về trang chủ). `?tiep=` (chỗ đang dở) đi theo, chỉ đường nội bộ.
 */
import { redirect } from 'next/navigation';
import { dichSauDangNhap } from '@/app/dang-nhap/actions';

export const dynamic = 'force-dynamic';

export default async function SauDangNhapPage({ searchParams }: { searchParams: Promise<{ tiep?: string | string[] }> }) {
  const sp = await searchParams;
  const tiep = Array.isArray(sp.tiep) ? sp.tiep[0] : sp.tiep;
  redirect(tiep && tiep.startsWith('/') && !tiep.startsWith('//') ? tiep : await dichSauDangNhap());
}
