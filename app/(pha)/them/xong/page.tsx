/**
 * MÀN TRẢ CÔNG — không hỏi gì, nên không tính vào ngân sách 4 màn của NFR-5.
 *
 * Ba việc phải làm cùng lúc, thiếu một là hỏng (prototype 8fd4af1^, giữ nguyên):
 *   1. Cho thấy người vừa khai ĐÃ ở trên phả rồi — FR-3, không chờ duyệt, không hàng đợi.
 *      Thẻ dưới đây là DỮ LIỆU THẬT đọc lại từ core/tree (đời + chi tính lúc đọc, AD-5;
 *      dòng ghi công FR-39 mang đúng tên người vừa ghi) — không phải ảnh chụp lời khai.
 *   2. Giải nghĩa "tồn nghi" ngay tại chỗ, lần đầu từ này xuất hiện (DESIGN.md § Do's).
 *   3. Đẩy tiếp một bước — Luồng 1 chưa xong ở đây; cao trào nằm ở bước tìm người kế tiếp.
 *
 * Tự khai: nói rõ lời xin nhận chỗ ĐANG CHỜ một người trong họ xác nhận (AD-8) — không im
 * lặng về việc còn dở.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getAncestryPath, type PersonCard } from '@/core/tree';
import { KhoiCham, KhungThem, TheNguoi, metaThe } from '../_chung/khuon';
import { dinhDangLuc } from '../_chung/luong';

export const metadata: Metadata = { title: 'Đã ghi vào phả' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const nguoi = typeof sp.nguoi === 'string' ? sp.nguoi : undefined;
  const ten = typeof sp.ten === 'string' ? sp.ten : '';
  const gan = typeof sp.gan === 'string' ? sp.gan : undefined;
  if (!nguoi) redirect('/them');

  // Đọc lại người vừa ghi qua core — steps[0] là chính người ấy. Đọc không được (hiếm —
  // ví dụ bán kính riêng tư của khách) thì thẻ rơi về tên đã khai, vẫn tồn nghi.
  const duong = await getAncestryPath(nguoi);
  const card: PersonCard | undefined = duong.ok ? duong.value.steps[0] : undefined;

  return (
    <KhungThem>
      <section>
        <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Đã ghi vào phả</h1>
        <p className="mt-2 text-[17px]">
          Hiện ngay, không phải chờ ai duyệt. Tên người ghi nằm luôn trên phả.
        </p>

        <div className="mt-5">
          <TheNguoi
            ten={card?.fullName ?? ten}
            meta={card ? metaThe(card) : 'tồn nghi'}
            tonNghi
            ghiCong={
              card?.attribution
                ? `${card.attribution.byName} ghi · ${dinhDangLuc(card.attribution.at)}`
                : undefined
            }
          />
        </div>

        {/* Chú giải tại chỗ cho từ phả học, ngay lần đầu nó xuất hiện. Không link ra trang
            từ điển: người đang ở giữa một việc thì không rời màn để tra nghĩa. */}
        <p className="mt-3 text-[15px] text-muted-foreground">
          <strong className="font-semibold">Tồn nghi</strong> là mức của điều dòng họ ghi lại
          nhưng chưa đối chiếu được giấy tờ. Vẫn nằm trên phả, vẫn sửa được, vẫn thấy được —
          nét đứt chỉ nói rằng còn chỗ để chắc chắn thêm.
        </p>

        {gan === 'cho' && (
          <div className="mt-5">
            <KhoiCham tua="Đang chờ một người trong họ xác nhận">
              <p>
                Đã xin nhận đây là chỗ của mình trên phả. Khi một người trong họ xác nhận,
                tài khoản sẽ gắn với tên này — từ đó tự sửa được thông tin về mình và thêm
                người thân quanh mình.
              </p>
            </KhoiCham>
          </div>
        )}
        {gan === 'khong' && (
          <div className="mt-5">
            <KhoiCham>
              Tên đã nằm trên phả, nhưng lời xin nhận chỗ chưa gửi được — có thể tài khoản đã
              gắn với một người khác từ trước. Xem lại ở trang <strong>Tôi</strong>.
            </KhoiCham>
          </div>
        )}

        <div className="mt-6 grid gap-2.5">
          {/* Luồng 1 bước 6: việc kế tiếp là TÌM người thân tiếp theo — tìm trước, thêm sau
              (FR-48 chặn trùng tại nguồn). */}
          <Button asChild className="h-12 w-full text-[17px]">
            <Link href="/tim">Tìm thêm người thân</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 w-full text-[17px]">
            <Link href="/gia-pha">Xem trên cây</Link>
          </Button>
        </div>
      </section>
    </KhungThem>
  );
}
