/**
 * `/admin/mau-thuan` — mọi chỗ trong phả đang có hai điều không thể cùng đúng (story 6-5).
 *
 * ── Đây là HỘP THƯ, không phải BÀN ────────────────────────────────────────────────────────
 * Chọn một trong hai giá trị là việc cần đủ ngữ cảnh — phiếu lý lịch, quan hệ, nguồn của từng
 * dòng — và chỗ ấy là cột phải của màn cây (5-3). Màn này chỉ trả lời câu *"còn chỗ nào chưa
 * quyết?"*: mỗi người một khối, tên là đường mở thẳng họ trên cây. Không nút Nâng, không nút Loại
 * ở đây — một mâu thuẫn được quyết vội trong danh sách là một mâu thuẫn được quyết mà không nhìn.
 *
 * ── Cùng một phép với phiếu ──────────────────────────────────────────────────────────────
 * `listConflicts` chạy đúng `xepChong` của 5-3 trên từng người của cả họ. Hai nơi suy hai kiểu là
 * hỏng (5-3 tự dặn), nên màn này không có một luật mâu thuẫn nào của riêng nó — kể cả hai lớp mới
 * (hai cha cùng giới · hai quê quán khác nơi) cũng sống trong `core/person/chong.ts`.
 *
 * `<h1>` do layout dựng. Số trên thanh việc = số người trong danh sách này.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import { tieuDeThe } from '@/components/admin/man-admin';
import { gonGiaTri } from '@/components/admin/phieu-ly-lich';
import { Button } from '@/components/ui/button';
import { listConflicts, type AssertionStack } from '@/core/person';

export const metadata: Metadata = { title: tieuDeThe('mau-thuan') };
// AD-23: mâu thuẫn đổi theo từng mutation và phụ thuộc vai người xem — không cache.
export const dynamic = 'force-dynamic';

/** Câu nói đúng LOẠI mâu thuẫn — chồng đơn trị và hai lớp đa trị nói khác nhau. */
function cauMauThuan(c: AssertionStack): string {
  if (c.kind === 'parent-child') return 'Hai lời khai cùng chỉ một người cha (hay mẹ) ruột — không thể cùng đúng.';
  if (c.kind === 'place') return 'Hai quê quán khác nhau — một người có một quê.';
  return 'Hai giá trị không thể cùng đúng.';
}

function ngay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('vi-VN');
}

/**
 * Vỏ theo MỨC TIN CẬY — cùng ba lớp với phiếu (`cot-khang-dinh.tsx § VO_TIN_CAY`). Mức nói bằng
 * VỎ, không lặp thành chữ: "tồn nghi · tồn nghi" (tầng · mức) là hai trục đội cùng một từ.
 */
const VO: Record<string, string> = {
  'chac-chan': 'rounded-sm border border-tin-chac-chan px-1.5',
  'theo-loi-ke': 'rounded-sm border border-tin-loi-ke px-1.5',
  'ton-nghi': 'van-ton-nghi rounded-sm border border-dashed border-tin-ton-nghi px-1.5',
};

export default async function MauThuanPage() {
  const ds = await listConflicts();
  if (!ds.ok) {
    if (ds.error.code === 'unauthenticated') redirect('/dang-nhap');
    if (ds.error.code === 'unattached') {
      return (
        <>
          <p className="max-w-[70ch] text-[17px]">
            Tài khoản chưa gắn vào một người trong phả. Gắn xong — và có vai quản trị hoặc đầu mối
            chi — thì danh sách mở ra ở đây.
          </p>
          <Button asChild variant="outline" className="mt-5 h-11 text-[17px]">
            <Link href="/gan-node">Gắn vào người của mình trong phả</Link>
          </Button>
        </>
      );
    }
    return <p className="max-w-[70ch] text-[17px] text-muted-foreground">{ds.error.message}</p>;
  }

  const soChong = ds.value.reduce((s, n) => s + n.chong.length, 0);

  return (
    <>
      <p className="max-w-[70ch] text-[17px]">
        {ds.value.length === 0
          ? 'Không có mâu thuẫn nào — mọi chồng khẳng định đều nhất quán.'
          : `${ds.value.length} người · ${soChong} chồng khẳng định có hai điều không thể cùng đúng.`}
      </p>
      <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
        Chọn một là việc trên phiếu ở màn cây, nơi có đủ quan hệ và nguồn của từng dòng — ở đây chỉ
        liệt kê. Giá trị bị loại rời khỏi phả nhưng vẫn nằm trong nhật ký.
      </p>

      {ds.value.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-4">
          {ds.value.map((n) => (
            <li key={n.personId} className="rounded-md border border-ban-vien bg-ban-o px-5 py-4">
              <h2 className="font-pha text-[19px] font-semibold">
                <Link
                  href={`/admin/cay?neo=${encodeURIComponent(n.personId)}`}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  {n.personName}
                </Link>
              </h2>
              <ul className="mt-2 flex flex-col gap-3">
                {n.chong.map((c) => {
                  const dung = new Set(c.dongMauThuan ?? c.rows.map((r) => r.assertionId));
                  return (
                    <li key={c.kind} className="border-t border-ban-vien pt-3">
                      <p className="flex items-center gap-1.5 text-[15px] font-semibold text-destructive">
                        <TriangleAlert className="size-4 shrink-0" aria-hidden />
                        {c.nhan}
                      </p>
                      <p className="mt-1 max-w-[70ch] border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
                        {cauMauThuan(c)}
                      </p>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {c.rows
                          .filter((r) => dung.has(r.assertionId))
                          .map((r) => (
                            <li key={r.assertionId} className="text-[17px]">
                              <span className={`${VO[r.confidence] ?? ''} ${c.kind === 'name' ? 'font-pha' : ''}`}>
                                {gonGiaTri(c.kind, r.valueText)}
                              </span>
                              <span className="ml-2 text-[15px] text-muted-foreground">
                                {r.tier === 'official' ? 'chính thức' : 'tồn nghi'} ·{' '}
                                {r.sourceDescription.trim() || 'không ghi rõ nguồn'} · {r.createdByName} ghi {ngay(r.createdAt)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
