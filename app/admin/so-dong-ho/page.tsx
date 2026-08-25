/**
 * `/admin/so-dong-ho` — tên dòng họ, tên họ, chữ đệm, đề từ (story 5-8).
 *
 * ── AD-14 nói bốn thứ này là DỮ LIỆU ─────────────────────────────────────────────────────
 * > surname, the fixed middle name, branch count, root ancestor, and clan-specific rules are data.
 *
 * Nhưng tới trước 25/08/2026, `core/identity` chỉ có `getClanInfo` — không có đường ghi nào. Bốn
 * giá trị ấy ghi được đúng MỘT lần, bởi `scripts/create-admin.ts`, lúc dựng dòng họ; sau đó đổi
 * chúng nghĩa là sửa `.ts` rồi dựng lại. Dữ liệu mà chỉ ghi được bằng cách sửa mã thì nó chưa
 * thật sự là dữ liệu. Màn này đóng chỗ hở đó.
 *
 * `<h1>` do layout dựng.
 */
import type { Metadata } from 'next';
import { tieuDeThe } from '@/components/admin/man-admin';
import { getClanInfo, resolveSession } from '@/core/identity';
import { BieuMauSoDongHo } from './bieu-mau';

export const metadata: Metadata = { title: tieuDeThe('so-dong-ho') };
export const dynamic = 'force-dynamic';

export default async function SoDongHoPage() {
  const [thongTin, phien] = await Promise.all([getClanInfo(), resolveSession()]);

  if (!thongTin.ok) {
    return <p className="max-w-[70ch] text-[17px] text-muted-foreground">{thongTin.error.message}</p>;
  }

  // Đổi tên họ và đề từ là đổi thứ hiện trên MỌI màn của cả hai bề mặt, kể cả trang chủ công khai.
  // Trưởng một chi không quyết chuyện của cả họ.
  const suaDuoc = phien?.role === 'admin';
  const s = thongTin.value.settings;

  return (
    <>
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        Những giá trị này hiện trên cả bề mặt công khai, không chỉ trong bàn làm việc. Sửa xong thì
        trang chủ đọc giá trị mới từ lần tải sau.
      </p>

      {!suaDuoc ? (
        /* Vẫn bày giá trị hiện tại: chúng vốn công khai trên trang chủ, giấu đi chẳng giữ được gì
           — chỉ làm người xem tưởng có bí mật nào đó ở đây. */
        <p className="mt-3 max-w-[70ch] border-l-4 border-ban-vien px-3 py-1.5 text-[17px] text-muted-foreground">
          Chỉ quản trị sửa được sổ dòng họ. Giá trị hiện tại vẫn bày ở dưới để đối chiếu.
        </p>
      ) : null}

      <BieuMauSoDongHo
        suaDuoc={suaDuoc}
        banDau={{
          name: thongTin.value.name,
          surname: s.surname ?? '',
          middleName: s.middleName ?? '',
          motto: s.motto ?? '',
          mottoPhonetic: s.mottoPhonetic ?? '',
        }}
      />
    </>
  );
}
