'use server';
/**
 * GHI VÀO PHẢ — server action của màn xác nhận (bước 4).
 *
 * Một đường ghi duy nhất (AD-9): core/assertion.addPerson — người mới + mọi khẳng định vào
 * Tầng tồn nghi, revision + thông báo FR-55 trong cùng transaction. Adapter chỉ dịch Result
 * thành điều hướng; không tự khai danh tính (AD-24 — core tự đọc phiên).
 *
 * Xác thực nằm Ở ĐÂY, không nằm ở các bước xem (Luồng 1 bước 4: "Tới đây mới cần xác thực"):
 *   · chưa đăng nhập  → /dang-nhap?tiep=<đúng màn xác nhận này> để quay lại đúng chỗ;
 *   · có tài khoản mà chưa gắn node → quay về màn xác nhận với lời mời gắn (loi=chua-gan)
 *     — KHÔNG BAO GIỜ là màn lỗi (EXPERIENCE § Chưa gắn node).
 *
 * ⚠️ Core hiện trả 'unauthenticated' cho CẢ người đã đăng nhập nhưng chưa gắn (gateWriter coi
 * role 'guest' là chưa xác thực; nhánh 'unattached' của nó không với tới được vì
 * resolveSessionImpl gán role 'guest' khi chưa có attachment active). Phân biệt lại ở đây
 * bằng resolveSession() — có phiên thật thì là chuyện GẮN, không phải chuyện ĐĂNG NHẬP.
 */
import { redirect } from 'next/navigation';
import { addPerson } from '@/core/assertion';
import { requestAttachment, resolveSession } from '@/core/identity';
import { duongBuoc, lapDauVao, trangThaiTuForm } from '../_chung/luong';

export async function ghiVaoPha(formData: FormData): Promise<void> {
  const t = trangThaiTuForm(formData);
  if (!t) redirect('/them');

  const nguon = formData.get('nguon');
  const dauVao = lapDauVao(t, typeof nguon === 'string' ? nguon : undefined);
  if (!dauVao) redirect('/them');

  const ket = await addPerson(dauVao);

  if (!ket.ok) {
    switch (ket.error.code) {
      case 'unauthenticated': {
        const session = await resolveSession();
        if (!session) redirect(`/dang-nhap?tiep=${encodeURIComponent(duongBuoc('/them/xac-nhan', t))}`);
        // Có phiên → thực chất là chưa gắn node (xem ghi chú đầu file).
        redirect(duongBuoc('/them/xac-nhan', t, { loi: 'chua-gan' }));
        break;
      }
      case 'unattached':
        redirect(duongBuoc('/them/xac-nhan', t, { loi: 'chua-gan' }));
        break;
      case 'invalid':
        redirect(duongBuoc('/them/xac-nhan', t, { loi: 'khong-hop-le' }));
        break;
      case 'not-found':
        redirect(duongBuoc('/them/xac-nhan', t, { loi: 'khong-thay' }));
        break;
      default:
        // 'forbidden' | 'conflict' — không banner kỹ thuật, một câu mời thử lại là đủ.
        redirect(duongBuoc('/them/xac-nhan', t, { loi: 'chua-ghi-duoc' }));
    }
  }

  const { personId } = ket.value;

  // Tự khai: xin gắn ngay vào người vừa ghi — nằm 'pending' tới khi người trong họ bảo
  // lãnh (AD-8). Màn trả công nói rõ đang chờ, không im lặng.
  let gan: 'cho' | 'khong' | undefined;
  if (t.qh === 'minh') {
    const kq = await requestAttachment(personId);
    gan = kq.ok ? 'cho' : 'khong';
  }

  const p = new URLSearchParams({ nguoi: personId, ten: t.ten ?? '', qh: t.qh });
  if (gan) p.set('gan', gan);
  redirect(`/them/xong?${p.toString()}`);
}
