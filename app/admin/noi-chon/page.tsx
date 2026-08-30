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

  // Nhóm trùng tên bằng CHÍNH phép gấp dấu của core (AD-16) — không tự so chuỗi ở màn.
  const theoTen = new Map<string, string[]>();
  for (const n of ds.value) {
    const k = chuanHoa(n.name);
    theoTen.set(k, [...(theoTen.get(k) ?? []), n.placeId]);
  }
  const trungTenIds = [...theoTen.values()].filter((ids) => ids.length > 1).flat();

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

      <BangNoi noi={ds.value} daGop={daGop.ok ? daGop.value : []} trungTenIds={trungTenIds} />

      <Link
        href="/admin/cay"
        className="mt-6 inline-flex min-h-11 items-center text-[17px] underline underline-offset-4"
      >
        Về cây gia phả
      </Link>
    </>
  );
}
