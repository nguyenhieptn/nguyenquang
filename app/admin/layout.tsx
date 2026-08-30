/**
 * LAYOUT `/admin` — cổng vào bề mặt B (bàn làm việc của Ban tu phả, chạy trên máy).
 *
 * Layout này SỞ HỮU CHROME: thanh trên, thanh việc trái, bề rộng vùng nội dung, và `<h1>` của
 * màn. Trang con chỉ đưa nội dung. Bản cũ (`/ban-duyet`) làm ngược lại — mỗi trang tự ghép
 * chrome — và hai trong bốn màn chính, cùng mọi màn lỗi/màn tải, quên mất điều hướng. Xem
 * `components/admin/khung-admin.tsx` đầu file.
 *
 * Quyền: chỉ admin / branch-head (FR-51, FR-3, FR-48 đều là việc của Ban tu phả).
 *   · Chưa đăng nhập → /dang-nhap (quản trị viên còn đường vào).
 *   · Đã đăng nhập nhưng không đủ quyền → màn "Khu vực Ban tu phả" — KHÔNG lộ gì thêm về những
 *     gì nằm sau cổng, chỉ một lối về trang chủ. Màn ấy cố ý ĐỨNG NGOÀI khung: chưa qua cổng
 *     thì không được thấy thanh việc, vì chính các con số trên đó đã là thông tin.
 *
 * Spine: EXPERIENCE.md § IA › Bề mặt B · DESIGN.md § Colors › Bề mặt B (khung trần).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { listPendingAssertions } from '@/core/assertion';
import { demMauThuan } from '@/core/person';
import { listPendingAttachments, resolveSession } from '@/core/identity';
import { getClanOverview } from '@/core/tree';
import { KhungAdmin } from '@/components/admin/khung-admin';
import type { SoViec } from '@/components/admin/man-admin';
import { nhanNguoiVanHanh } from './nguoi-van-hanh';
import { timNguoi } from './actions';

// AD-23: số trên thanh việc phụ thuộc người xem và đổi theo từng mutation — không cache.
export const dynamic = 'force-dynamic';

/**
 * MỐC LÙI cho thẻ trình duyệt. Tám màn thật đều tự khai qua `tieuDeThe()` và đè lên dòng này;
 * cái nó cứu là đường KHÔNG khớp màn nào — `/admin/<gõ-nhầm>` rơi vào catch-all rồi `notFound()`,
 * và không có nó thì thẻ đội tiêu đề của bề mặt A công khai ("Tộc phả") trong khi màn đang bày
 * 404 của bàn làm việc. Cùng lớp lỗi `<h1>` sai, chỉ khác chỗ hiện.
 */
export const metadata: Metadata = { title: 'Admin' };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const phien = await resolveSession();
  if (!phien) redirect('/dang-nhap');

  if (phien.role !== 'admin' && phien.role !== 'branch-head') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ban-nen px-6">
        <div className="w-full max-w-[480px] rounded-md border border-ban-vien bg-ban-o px-8 py-10 text-center">
          <h1 className="text-[23px] font-semibold">Khu vực Ban tu phả</h1>
          <p className="mt-3 text-[17px] text-muted-foreground">
            Trang này dành cho người trong Ban tu phả.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-md border border-ban-vien bg-ban-o px-5 text-[17px]"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Số trên thanh việc. Đọc hỏng thì mục vẫn hiện, chỉ VẮNG số — `null` nghĩa là "không đếm
  // được", khác hẳn `0`. Bày `0` giả làm người vận hành tin là đã sạch việc rồi bỏ đi.
  const [choDuyet, toanCanh, xinVaoPha, nguoiVanHanh, mauThuan] = await Promise.all([
    listPendingAssertions(),
    getClanOverview(),
    listPendingAttachments(),
    nhanNguoiVanHanh(),
    demMauThuan(),
  ]);

  const so: SoViec = {
    'hang-cho': choDuyet.ok ? choDuyet.value.length : null,
    // Số NGƯỜI có mâu thuẫn (story 6-5) — không phải số chồng, không phải số dòng.
    'mau-thuan': mauThuan.ok ? mauThuan.value : null,
    'duyet-vao-pha': xinVaoPha.ok ? xinVaoPha.value.length : null,
    'hop-nhat': toanCanh.ok ? toanCanh.value.unconnectedFragments.length : null,
  };

  return (
    <KhungAdmin so={so} nguoiVanHanh={nguoiVanHanh} tim={timNguoi}>
      {children}
    </KhungAdmin>
  );
}
