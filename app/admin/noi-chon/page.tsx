/**
 * `/admin/noi-chon` — DANH MỤC nơi chốn (FR-65, story 5-7), thành màn LÀM VIỆC từ story 6-4:
 * sửa tại chỗ · gộp vào nơi khác · tách lại.
 *
 * ── Màn này bày ĐỊA DANH, không bày ai ở đâu ──────────────────────────────────────────────
 * Đó là ranh giới riêng tư của cả story. "Quang Trung, Định Hoá là một nơi" là dữ liệu về địa
 * danh; "cụ Bảng quê ở đó" là một KHẲNG ĐỊNH gắn vào người, và nó đi qua đúng cổng bán kính riêng
 * tư như mọi khẳng định khác. FR-65 tự dặn: *"Nơi không được là cửa hậu làm rò thứ FR-37 đang
 * giữ."* Nên ở đây không có, và sẽ không có, đường đọc "những ai ở nơi này". Số khẳng định trỏ
 * vào một nơi chỉ hiện SAU một lượt gộp, dưới dạng một con số — không tên ai.
 *
 * Danh mục KHÔNG có số trên thanh việc: nó là dữ liệu nền của nhóm Sổ dòng họ, không phải hàng
 * chờ. Số 0 trên nó không mang nghĩa gì.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { tieuDeThe } from '@/components/admin/man-admin';
import { listMergedPlaces, listPlaces } from '@/core/place';
import { chuanHoa } from '@/core/so-khop';
import { BangNoi } from './bang-noi';

export const metadata: Metadata = { title: tieuDeThe('noi-chon') };
export const dynamic = 'force-dynamic';

export default async function NoiChonPage() {
  const [ds, daGop] = await Promise.all([listPlaces(), listMergedPlaces()]);

  if (!ds.ok) {
    return (
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">{ds.error.message}</p>
    );
  }

  // Nhóm trùng tên bằng CHÍNH phép gấp dấu của core (AD-16) — không tự so chuỗi ở màn. Mỗi nơi
  // trong nhóm biết TÊN của những nơi kia: "trùng tên với nơi khác" mà không nói nơi nào thì
  // người vận hành phải tự dò cả bảng (code review 6-4, 29/08).
  const theoTen = new Map<string, typeof ds.value>();
  for (const n of ds.value) {
    const k = chuanHoa(n.name);
    const g = theoTen.get(k);
    if (g) g.push(n);
    else theoTen.set(k, [n]);
  }
  const trungTenVoi: Record<string, string[]> = {};
  for (const g of theoTen.values()) {
    if (g.length < 2) continue;
    for (const n of g) trungTenVoi[n.placeId] = g.filter((k) => k.placeId !== n.placeId).map((k) => k.nhan);
  }

  return (
    <>
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        Nơi chốn là một thực thể, không phải chữ tự do: tên xã phường trùng nhau hàng loạt, nên mỗi
        nơi mang theo <strong>đơn vị hành chính cha</strong> — thứ duy nhất phân biệt Quang Trung ở
        Định Hoá với Quang Trung ở Vũng Tàu.
      </p>
      <p className="mt-2 max-w-[70ch] text-[17px] text-muted-foreground">
        Nơi mới thêm ngay lúc ghi cho một người, ở cột phải của màn cây. Ở đây sửa tên, gộp hai hàng
        của cùng một nơi, và tách lại khi gộp nhầm — không có nút xoá: một nơi đã ghi ở lại nhật ký.
      </p>

      {/* Khu "Đã gộp" đọc hỏng thì NÓI — im lặng là "chưa gộp gì", và không còn đường tách. */}
      {!daGop.ok ? (
        <p className="mt-6 max-w-[70ch] border-l-4 border-destructive bg-canh-bao-nen px-3 py-2 text-[17px]">
          Không đọc được khu &quot;Đã gộp&quot;: {daGop.error.message}
        </p>
      ) : null}

      <BangNoi noi={ds.value} daGop={daGop.ok ? daGop.value : []} trungTenVoi={trungTenVoi} />

      <Link
        href="/admin/cay"
        className="mt-6 inline-flex min-h-11 items-center text-[17px] underline underline-offset-4"
      >
        Về cây gia phả
      </Link>
    </>
  );
}
