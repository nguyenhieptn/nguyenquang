/**
 * ĐĂNG NHẬP / TẠO TÀI KHOẢN — lớp 1 của FR-64: chứng minh sở hữu một tài khoản, không hơn.
 *
 * Promote từ prototype `8fd4af1^:app/uiworkshop/dang-nhap/page.tsx` (story 2-2). Lớp 2 —
 * "mình là ai trong họ" — tách hẳn sang /gan-node, đúng như prototype đã tách hai section.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture — "Tài khoản ≠ người trong phả"
 *   · EXPERIENCE.md § Key Flows — Luồng 1, bước 4 ("tới đây MỚI cần xác thực")
 *   · EXPERIENCE.md § State Patterns — "Chưa gắn node" là trạng thái THƯỜNG TRỰC
 *   · DESIGN.md § Nút, § Do's and Don'ts (cấm từ kỹ thuật trên bề mặt A)
 *
 * FR: FR-64 (đăng nhập & quản lý người dùng) · FR-11 (xem cây không cần đăng ký) · FR-3 (ghi
 *     vào Tầng tồn nghi ngay, không chờ duyệt)
 *
 * ── VÌ SAO XÁC THỰC NẰM Ở ĐÂY, KHÔNG NẰM Ở CỬA ──────────────────────────────────────────────
 * FR-11 chốt xem cây không cần đăng ký, nên bắt đăng nhập ngay từ cửa là chặn đúng người sản
 * phẩm cần nhất: người vừa nghe về web ở buổi họp họ và chưa tin nó có gì. Luồng 1 đặt xác thực
 * ở **bước 4** — sau khi người ta đã tìm, đã không thấy, và đã tự quyết định sẽ thêm người thân.
 * Lúc đó việc tạo tài khoản có lý do, và lý do ấy là của người dùng chứ không phải của hệ thống.
 *
 * Hệ quả cho điều hướng: màn này KHÔNG có mục nào trên thanh năm mục (năm là trần). Đường vào
 * là các hành động ghi chuyển hướng tới (err 'unauthenticated' → redirect('/dang-nhap')).
 *
 * KHÔNG dùng chữ "node", "xác thực", "tài khoản đã kích hoạt" trên màn — bề mặt A cấm từ kỹ
 * thuật (DESIGN.md § Do's and Don'ts). Trong mã nguồn thì gọi đúng tên, đó là chuyện khác.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveSession } from '@/core/identity';
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';
import { FormDangNhap } from './form-dang-nhap';

export const metadata: Metadata = { title: 'Đăng nhập' };

export default async function Page() {
  // Đã có phiên thì màn này hết việc: đã gắn → trang chủ; chưa gắn → thẳng tới màn nhận chỗ.
  const session = await resolveSession();
  if (session) redirect(session.personId ? '/' : '/gan-node');

  return (
    <div className="flex min-h-dvh flex-col">
      <main className={`${DOC} flex-1 pb-28 pt-7 md:pb-16 md:pt-28`}>
        {/* Form bó ở max-w-md trong khung DOC: một cột nhập liệu 672px là dòng gõ dài quá tầm
            mắt theo dõi — khác cột đọc, cột nhập hẹp hơn thì theo được con trỏ. */}
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Vào phả</h1>
          {/* Nói rõ VÌ SAO đang bị hỏi, ngay dòng đầu. Một màn đăng nhập không có lý do là chỗ
              người dùng quay ra — và họ vừa mới quyết định đóng góp, đúng khoảnh khắc đắt nhất. */}
          <p className="mt-2 text-[17px]">
            Xem phả thì không cần gì cả. Nhưng ghi thêm người thì phả cần biết ai ghi — tên người
            ghi sẽ nằm luôn trên phả, cạnh người được ghi.
          </p>

          <FormDangNhap />

          {/* Lối ra cho khách: FR-11, xem không cần đăng ký. Vùng chạm ≥44px nhờ py-3. */}
          <p className="mt-6 text-[15px] text-muted-foreground">
            <Link
              href="/"
              className="inline-block py-3 text-[15px] underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
            >
              Chỉ xem phả — không cần tài khoản
            </Link>
          </p>
        </div>
      </main>
      <ThanhDieuHuong hienTai="toi" />
    </div>
  );
}
