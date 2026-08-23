/**
 * LAYOUT BÀN DUYỆT — cổng vào bề mặt B (quản trị, desktop).
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture › Bề mặt B › Chrome của bề mặt B
 *   · DESIGN.md § Colors › Bề mặt B (khung trần — nền xám ngà, không giấy dó)
 *
 * Quyền: chỉ admin / branch-head (FR-51, FR-3, FR-48 đều là việc của Ban tu phả).
 *   · Chưa đăng nhập → /dang-nhap (quản trị viên còn đường vào).
 *   · Đã đăng nhập nhưng không đủ quyền → màn "Khu vực Ban tu phả" — KHÔNG lộ gì
 *     thêm về những gì nằm sau cổng, chỉ một lối về trang chủ.
 *
 * Thanh điều hướng (ThanhBanDuyet) do TỪNG TRANG render — layout không biết mục nào
 * đang mở (cùng nếp với bề mặt A: trang tự ghép chrome của mình).
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { resolveSession } from '@/core/identity';

export default async function BanDuyetLayout({ children }: { children: ReactNode }) {
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

  return <div className="min-h-dvh bg-ban-nen">{children}</div>;
}
