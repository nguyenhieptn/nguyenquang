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
import { coBanLamViec } from '@/lib/vai-quan-tri';
import { NhanCho } from './nhan-cho';

export const metadata: Metadata = { title: 'Nhận chỗ của mình' };

/**
 * `?tiep=` — chỗ đang dở mà luồng thêm gửi kèm khi nó rẽ qua đây (app/(pha)/them/noi và
 * them/xac-nhan gửi cả hai). Màn này nằm GIỮA luồng ấy, nên nó phải chuyền tiếp tham số chứ
 * không được nuốt: nuốt một lần là người ta mất chỗ đang dở đúng lúc vừa làm xong việc.
 *
 * Chỉ nhận đường nội bộ ('/' mở đầu, không phải '//'). Bản sao của phép kiểm này nằm ở
 * app/dang-nhap/page.tsx — giữ hai bên khớp nhau.
 */
function duongTiep(tho: string | string[] | undefined): string | undefined {
  const s = Array.isArray(tho) ? tho[0] : tho;
  return s && s.startsWith('/') && !s.startsWith('//') ? s : undefined;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tiep?: string | string[] }>;
}) {
  const tiep = duongTiep((await searchParams).tiep);

  const session = await resolveSession();
  // Chưa có tài khoản thì chưa có gì để gắn — về màn đăng nhập (err-map của build contract),
  // mang theo chỗ đang dở để cả hai chặng đều dẫn về đúng một đích.
  if (!session) redirect(tiep ? `/dang-nhap?tiep=${encodeURIComponent(tiep)}` : '/dang-nhap');
  // Đã gắn rồi thì màn này hết việc: về thẳng chỗ đang dở, không có thì về trang chủ.
  if (session.personId) redirect(tiep ?? '/');

  // Một lời nhận chỗ đang chờ bảo lãnh (AD-8: getMyAttachment đọc được cả trạng thái pending):
  // mở lại màn này thì gặp NGAY màn chờ, không phải màn tìm — kẻo tưởng lời cũ đã rơi mất và
  // gửi lại từ đầu.
  const ganKet = await getMyAttachment();
  const dangCho =
    ganKet.ok && ganKet.value && ganKet.value.status === 'pending'
      ? { fullName: ganKet.value.personName, nguCanh: '' }
      : null;

  /**
   * Lời nhận chỗ lần trước đã bị ban tu phả từ chối (story 5-5).
   *
   * Phải NÓI RA. Không nói thì người ấy rơi lại vào luồng nhận chỗ như chưa từng xin, và cứ thế
   * xin lại đúng người cũ — luồng FR-64 vẫn đứt, chỉ đứt im lặng hơn. Lý do từ chối thì KHÔNG bày
   * ở đây: nó nằm trong sổ của ban tu phả, không phải một lời nhắn gửi tới người xin.
   */
  const daTuChoi =
    ganKet.ok && ganKet.value && ganKet.value.status === 'rejected'
      ? ganKet.value.personName
      : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <main className={`${DOC} flex-1 pb-28 pt-7 md:pb-16 md:pt-28`}>
        {daTuChoi ? (
          <p className="mb-6 max-w-[60ch] border-l-4 border-destructive bg-canh-bao-nen px-3 py-2 text-[17px]">
            Lần trước, lời nhận chỗ của{' '}
            <span className="font-[family-name:var(--font-pha)]">{daTuChoi}</span> chưa được ban tu
            phả nhận. Chọn lại người, hoặc hỏi ban tu phả trước khi gửi lần nữa.
          </p>
        ) : null}
        <NhanCho choSan={dangCho} tiep={tiep} />
      </main>
      <ThanhDieuHuong hienTai="toi" banLamViec={await coBanLamViec()} />
    </div>
  );
}
