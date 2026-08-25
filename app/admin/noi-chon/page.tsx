/**
 * `/admin/noi-chon` — DANH MỤC nơi chốn (FR-65, story 5-7).
 *
 * ── Màn này bày ĐỊA DANH, không bày ai ở đâu ──────────────────────────────────────────────
 * Đó là ranh giới riêng tư của cả story. "Quang Trung, Định Hoá là một nơi" là dữ liệu về địa
 * danh; "cụ Bảng quê ở đó" là một KHẲNG ĐỊNH gắn vào người, và nó đi qua đúng cổng bán kính riêng
 * tư như mọi khẳng định khác. FR-65 tự dặn: *"Nơi không được là cửa hậu làm rò thứ FR-37 đang
 * giữ."* Nên ở đây không có, và sẽ không có, đường đọc "những ai ở nơi này".
 *
 * Danh mục KHÔNG có số trên thanh việc: nó là dữ liệu nền của nhóm Sổ dòng họ, không phải hàng
 * chờ. Số 0 trên nó không mang nghĩa gì.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { tieuDeThe } from '@/components/admin/man-admin';
import { listPlaces } from '@/core/place';

export const metadata: Metadata = { title: tieuDeThe('noi-chon') };
export const dynamic = 'force-dynamic';

export default async function NoiChonPage() {
  const ds = await listPlaces();

  if (!ds.ok) {
    return (
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">{ds.error.message}</p>
    );
  }

  return (
    <>
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        Nơi chốn là một thực thể, không phải chữ tự do: tên xã phường trùng nhau hàng loạt, nên mỗi
        nơi mang theo <strong>đơn vị hành chính cha</strong> — thứ duy nhất phân biệt Quang Trung ở
        Định Hoá với Quang Trung ở Vũng Tàu.
      </p>
      <p className="mt-2 max-w-[70ch] text-[17px] text-muted-foreground">
        Nơi mới thêm ngay lúc ghi cho một người, ở cột phải của màn cây — không phải khai vào đây
        trước.
      </p>

      {ds.value.length === 0 ? (
        <p className="mt-6 max-w-[70ch] text-[17px] text-muted-foreground">
          Danh mục còn trống. Đó là một trạng thái đúng, không phải một việc còn thiếu.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {ds.value.map((n) => (
            <li
              key={n.placeId}
              className="rounded-md border border-ban-vien bg-ban-o px-4 py-3 text-[17px]"
            >
              <span>{n.name}</span>
              {n.parentUnit ? (
                <span className="text-muted-foreground">, {n.parentUnit}</span>
              ) : (
                /* Trống là hợp lệ (FR-65) — nhưng nói ra để người vận hành biết chỗ này còn mờ,
                   chứ không im lặng như thể đã đủ. */
                <span className="ml-2 text-[15px] text-muted-foreground">chưa ghi đơn vị cha</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/admin/cay"
        className="mt-6 inline-flex min-h-11 items-center text-[17px] underline underline-offset-4"
      >
        Về cây gia phả
      </Link>
    </>
  );
}
