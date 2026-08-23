/**
 * /ban-duyet/xem-truoc — mục "Xem trước" của thanh bàn duyệt.
 *
 * LỰA CHỌN MỘT-TRANG (ghi rõ theo brief): bảng xem trước so khớp mở ra NGAY trong
 * /ban-duyet/nap-khung, liền sau khi chọn tệp — vì văn bản CSV không có chỗ lưu tạm
 * server-side (core/seed không có API), còn cookie/searchParams thì quá nhỏ. Mục này
 * vì thế là trang chỉ đường: nói xem trước nằm ở đâu và dẫn sang đúng bước.
 *
 * Bộ lọc "Cần xem lại" (?loc=can-xem-lai) cũng sống trong bảng ấy — cảnh báo không có
 * màn riêng (EXPERIENCE.md § Bề mặt B).
 */
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ThanhBanDuyet } from '@/components/pha/thanh-ban-duyet';
import { nhanNguoiVanHanh } from '../nap-khung/nguoi-van-hanh';

export const metadata: Metadata = { title: 'Xem trước so khớp — Bàn duyệt' };

export default async function XemTruocPage() {
  const nguoiVanHanh = await nhanNguoiVanHanh();
  return (
    <>
      <ThanhBanDuyet hienTai="xem-truoc" nguoiVanHanh={nguoiVanHanh} />

      <main className="mx-auto max-w-[900px] px-6 py-10">
        <h1 className="text-[23px] font-semibold">Xem trước so khớp</h1>
        <p className="mt-2 max-w-[62ch] text-[17px]">
          Bảng xem trước mở ra ngay sau khi chọn tệp ở bước <strong>Nạp khung</strong> — cùng một
          trang, tệp không phải tải lên hai lần.
        </p>
        <p className="mt-3 max-w-[62ch] text-[17px] text-muted-foreground">
          Bảng bày từng dòng của tệp: khớp người có sẵn, người mới, hay nghi trùng — cảnh báo chèn
          ngay dưới dòng nó nói về, và bộ lọc <em>Cần xem lại</em> gom đúng những dòng ấy. Không
          dòng nào được ghi cho tới khi bấm ghi ở chính bảng đó.
        </p>

        <Button asChild variant="outline" className="mt-6 h-11 text-[17px]">
          <a href="/ban-duyet/nap-khung">Sang bước Nạp khung</a>
        </Button>
      </main>
    </>
  );
}
