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
import { cauMauThuan, gonGiaTri, VO_TIN_CAY } from '@/components/admin/phieu-ly-lich';
import { Button } from '@/components/ui/button';
import { listConflicts, type AssertionStack } from '@/core/person';

export const metadata: Metadata = { title: tieuDeThe('mau-thuan') };
// AD-23: mâu thuẫn đổi theo từng mutation và phụ thuộc vai người xem — không cache.
export const dynamic = 'force-dynamic';

function ngay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('vi-VN');
}

/** Các CỤM đụng nhau của một chồng — chồng đơn trị là một cụm gồm tất cả. Xem `AssertionStack.cumMauThuan`. */
function cumCua(c: AssertionStack): string[][] {
  return c.cumMauThuan ?? [c.rows.map((r) => r.assertionId)];
}

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

  const soCum = ds.value.reduce((s, n) => s + n.chong.reduce((t, c) => t + cumCua(c).length, 0), 0);

  return (
    <>
      <p className="max-w-[70ch] text-[17px]">
        {ds.value.length === 0
          ? 'Không có mâu thuẫn nào — mọi chồng khẳng định đều nhất quán.'
          : `${ds.value.length} người · ${soCum} chỗ có hai điều không thể cùng đúng.`}
      </p>
      {ds.value.length > 0 ? (
        <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
          Chọn một là việc trên phiếu ở màn cây, nơi có đủ quan hệ và nguồn của từng dòng — ở đây chỉ
          liệt kê. Giá trị bị loại rời khỏi phả nhưng vẫn nằm trong{' '}
          <Link
            href="/admin/nhat-ky?loai=assertion&hanh=remove"
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            sổ nhật ký
          </Link>
          .
        </p>
      ) : null}

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
                {n.chong.flatMap((c) =>
                  // Mỗi CỤM một khối: hai cha và hai mẹ trong cùng chồng là hai câu hỏi, không phải
                  // bốn dòng dưới một câu "hai lời khai".
                  cumCua(c).map((cum, i) => {
                    const dung = new Set(cum);
                    return (
                      <li key={`${c.kind}:${i}`} className="border-t border-ban-vien pt-3">
                        <p className="flex items-center gap-1.5 text-[15px] font-semibold text-destructive">
                          <TriangleAlert className="size-4 shrink-0" aria-hidden />
                          {c.nhan}
                        </p>
                        {/* Câu cảnh báo là CHỮ ĐỌC, không phải nhãn phụ — sàn 17px (EXPERIENCE § Bề mặt B). */}
                        <p className="mt-1 max-w-[70ch] border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[17px]">
                          {cauMauThuan(c.kind, dung.size)}
                        </p>
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {c.rows
                            .filter((r) => dung.has(r.assertionId))
                            .map((r) => (
                              <li key={r.assertionId} className="text-[17px]">
                                <span className={`${VO_TIN_CAY[r.confidence]} ${c.kind === 'name' ? 'font-pha' : ''}`}>
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
                  }),
                )}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
