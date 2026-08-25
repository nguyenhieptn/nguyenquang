/**
 * `/admin` — nhà của bàn làm việc.
 *
 * Bản cũ (`/ban-duyet`) không có nhà: nó redirect thẳng sang nạp khung, vì Đợt 1 chỉ có một
 * việc và việc ấy làm một lần trong đời. Giờ bàn có nhiều việc, nên gốc phải là một chỗ đứng —
 * bày lại chính các con số của thanh việc dưới dạng thẻ lớn, mỗi thẻ một đường vào.
 *
 * CỐ Ý TỐI GIẢN: đây chưa phải màn "Hôm nay". Không truy vấn `core/` nào ngoài đúng hai cái
 * layout đã gọi (hàng chờ khẳng định, mảnh chưa nối) — gọi lại vì layout không truyền dữ liệu
 * xuống trang được, và hai lần đọc trên một màn hiếm vào thì rẻ hơn một tầng cache viewer-dependent
 * (AD-23 cấm cache thứ phụ thuộc người xem ngoài core).
 *
 * `<h1>` do layout dựng (`components/admin/khung-admin.tsx`) — trang này bắt đầu từ `<h2>`.
 */
import type { Metadata } from 'next';
import { tieuDeThe } from '@/components/admin/man-admin';
import Link from 'next/link';
import { Inbox, Unlink, Upload, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listPendingAssertions } from '@/core/assertion';
import { getClanOverview } from '@/core/tree';


export const metadata: Metadata = { title: tieuDeThe('nha') };
export const dynamic = 'force-dynamic';

function The({
  icon: Icon,
  ten,
  duong,
  so,
  loi,
}: {
  icon: LucideIcon;
  ten: string;
  duong: string;
  /** `null` = không đọc được. Không bao giờ thay bằng `0`. */
  so: number | null | undefined;
  loi: string;
}) {
  return (
    <li>
      <Link
        href={duong}
        className="flex h-full flex-col rounded-md border border-ban-vien bg-ban-o px-5 py-4 hover:border-foreground"
      >
        <span className="flex items-center gap-2.5">
          <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-[19px] font-semibold">{ten}</span>
        </span>
        {so === undefined ? null : (
          <span className="mt-2 text-[31px] leading-none font-semibold tabular-nums">
            {so === null ? '—' : so}
          </span>
        )}
        <span className="mt-2 max-w-[46ch] text-[17px] text-muted-foreground">
          {so === null ? 'Chưa đọc được số — mở màn để xem trực tiếp.' : loi}
        </span>
      </Link>
    </li>
  );
}

export default async function TrangNhaAdmin() {
  const [choDuyet, toanCanh] = await Promise.all([listPendingAssertions(), getClanOverview()]);

  /**
   * `unattached` KHÔNG phải lỗi đọc — đó là một trạng thái vĩnh viễn (`core/types.ts:11`), và
   * đúng trạng thái mà tài khoản quản trị bootstrap ở bản cài mới rơi vào: layout cho qua cổng
   * vì vai là `admin`, nhưng `personId` còn `null` nên mọi lượt đọc đều trả `unattached`.
   *
   * Trước khi tách nhánh này, màn nhà bày `—` kèm câu "Chưa đọc được số — mở màn để xem trực
   * tiếp" — đổ cho một trục trặc thoáng qua cái vốn là điều kiện chưa đủ, rồi mời họ mở màn con,
   * nơi câu trả lời là "Tài khoản chưa gắn vào một người trong phả". Một vòng tròn khép kín,
   * và không đầu nào chỉ ra `/gan-node`. Màn con đã làm đúng từ đầu; màn nhà thì chưa.
   */
  const chuaGan =
    (!choDuyet.ok && choDuyet.error.code === 'unattached') ||
    (!toanCanh.ok && toanCanh.error.code === 'unattached');

  if (chuaGan) {
    return (
      <>
        <p className="max-w-[70ch] text-[17px]">
          Tài khoản chưa gắn vào một người trong phả, nên bàn chưa mở ra được. Gắn xong thì mọi
          việc của Ban tu phả hiện ở đây.
        </p>
        <Button asChild variant="outline" className="mt-5 h-11 text-[17px]">
          <Link href="/gan-node">Gắn vào người của mình trong phả</Link>
        </Button>
      </>
    );
  }

  const soChoDuyet = choDuyet.ok ? choDuyet.value.length : null;
  const soManh = toanCanh.ok ? toanCanh.value.unconnectedFragments.length : null;

  return (
    <>
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        Ba việc của Ban tu phả. Con số là số đang chờ — để nguyên không làm ai mất gì, nên không
        có việc nào phải làm vội.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <The
          icon={Inbox}
          ten="Hàng chờ khẳng định"
          duong="/admin/hang-cho"
          so={soChoDuyet}
          loi="Khẳng định đang ở Tầng tồn nghi. Tất cả đã hiện trên cây — duyệt là nâng mức, không phải cho phép xuất hiện."
        />
        <The
          icon={Unlink}
          ten="Mảnh chưa nối"
          duong="/admin/hop-nhat"
          so={soManh}
          loi="Mảnh phả chưa nối được vào gốc chung. Nối hay không nối đều phải có chứng cứ."
        />
        <The
          icon={Upload}
          ten="Nạp khung"
          duong="/admin/nap-khung"
          so={undefined}
          loi="Đưa một tệp CSV vào phả. Việc làm một lần khi dựng khung, không phải hàng chờ."
        />
      </ul>
    </>
  );
}
