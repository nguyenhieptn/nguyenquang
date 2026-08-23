/**
 * NHẬN CHỖ CỦA MÌNH TRONG PHẢ — lớp 2 của FR-64: khai *mình là ai trong họ*.
 *
 * Promote từ prototype `8fd4af1^:app/uiworkshop/dang-nhap/page.tsx`, section `KhaiMinhLaAi`
 * + `ChuaGan` (story 2-2). Bề mặt A, khung DOC.
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture — "Tài khoản ≠ người trong phả"
 *   · EXPERIENCE.md § State Patterns — "Không tìm thấy" (bày người gần giống trước, kèm
 *     đời + chi) · "Chưa gắn node" là trạng thái thường trực, không phải lỗi
 *   · DESIGN.md § Nút (son cho hành động chính duy nhất) · § Do's and Don'ts
 *
 * ── LỚP 2 KHÔNG PHẢI MỘT BƯỚC NỮA CỦA ĐĂNG KÝ ───────────────────────────────────────────────
 * Nó là một khẳng định về người thật, nên nó mang nguồn và mang người bảo lãnh, y như mọi
 * khẳng định khác (FR-1). Vẽ nó như một trường hồ sơ là làm mất chính điều khiến nó khác.
 *
 * Ba đường, xếp theo mức chắc chắn giảm dần:
 *   1. Mình ĐÃ có trong phả → tìm tên, nhận chỗ, chờ một người trong họ xác nhận (AD-8).
 *   2. Mình CHƯA có trong phả → sang /tim (luồng tự khai thêm mình vào trước).
 *   3. Chưa muốn khai gì → về trang chủ, xem vẫn đủ như trước (FR-11).
 *
 * Vì sao chặt ở đây mà không chặt ở cửa: mỗi dòng trên phả phải mang tên người ghi (FR-39),
 * và tên ấy chỉ có nghĩa khi phả biết người ấy là ai trong họ.
 *
 * KHÔNG dùng chữ "node" hay từ kỹ thuật nào trên màn (bề mặt A). Tên route là mã nguồn.
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMyAttachment, resolveSession } from '@/core/identity';
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';
import { NhanCho } from './nhan-cho';

export const metadata: Metadata = { title: 'Nhận chỗ của mình' };

export default async function Page() {
  const session = await resolveSession();
  // Chưa có tài khoản thì chưa có gì để gắn — về màn đăng nhập (err-map của build contract).
  if (!session) redirect('/dang-nhap');
  // Đã gắn rồi thì màn này hết việc.
  if (session.personId) redirect('/');

  // Một lời nhận chỗ đang chờ bảo lãnh (AD-8: getMyAttachment đọc được cả trạng thái pending):
  // mở lại màn này thì gặp NGAY màn chờ, không phải màn tìm — kẻo tưởng lời cũ đã rơi mất và
  // gửi lại từ đầu.
  const ganKet = await getMyAttachment();
  const dangCho =
    ganKet.ok && ganKet.value && ganKet.value.status === 'pending'
      ? { fullName: ganKet.value.personName, nguCanh: '' }
      : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <main className={`${DOC} flex-1 pb-28 pt-7 md:pb-16 md:pt-28`}>
        <NhanCho choSan={dangCho} />
      </main>
      <ThanhDieuHuong hienTai="toi" />
    </div>
  );
}
