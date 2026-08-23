/**
 * THÊM VÀO PHẢ — bước 4 / 4: xác nhận MỘT màn.
 *
 * Ba việc trên một màn, không màn nào thêm:
 *   1. TÓM TẮT bằng một câu tiếng Việt tự nhiên — đọc to lên được, sai thì lui lại sửa
 *      (nút lui trình duyệt, trạng thái nằm trong URL).
 *   2. NGUỒN (FR-1) — câu 4 của prototype, đứng ngay trên nút ghi: lựa chọn xếp theo mức
 *      tin cậy giảm dần và NÓI RA mức ấy; giấu đi thì mức tin cậy thành thứ hệ thống tự dán.
 *   3. Hệ quả FR-55 nói TRƯỚC KHI bấm, ngay tại chỗ — người đang được ghi không có mặt để
 *      tự bảo vệ; người khai là người duy nhất đọc được câu này.
 *
 * Nút son duy nhất của cả luồng nằm ở đây: "Ghi vào phả" — son là màu của hành động chính.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CauHoi, KhoiCham, KhungThem, Nhip } from '../_chung/khuon';
import {
  LOI_GHI,
  NGUON_CHON,
  cauTomTat,
  docTrangThai,
  duongBuoc,
  lapLienKet,
} from '../_chung/luong';
import { ghiVaoPha } from './actions';

export const metadata: Metadata = { title: 'Thêm vào phả — xác nhận' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const t = docTrangThai(sp);
  // Thiếu tên hay thiếu phép nối → chưa đủ để xác nhận, về đầu luồng.
  if (!t || !t.ten || !lapLienKet(t)) redirect('/them');
  const loi = typeof sp.loi === 'string' ? sp.loi : undefined;

  return (
    <KhungThem>
      <section>
        <Nhip so={4} />
        <CauHoi>Ghi như vậy vào phả?</CauHoi>

        {/* Câu tóm tắt — serif, cỡ tên người: đây là dòng sẽ thành một khẳng định trên phả. */}
        <p className="mt-4 rounded-md border border-border bg-card px-4 py-4 font-[family-name:var(--font-pha)] text-[19px] leading-snug">
          {cauTomTat(t)}
        </p>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Chưa đúng thì lui lại một bước để sửa — điều đã khai vẫn còn nguyên.
        </p>

        <form action={ghiVaoPha} className="mt-7">
          {/* Trạng thái luồng đi theo form — action đọc lại bằng cùng một phép đọc URL. */}
          <input type="hidden" name="qh" value={t.qh} />
          <input type="hidden" name="ten" value={t.ten} />
          {t.ns && <input type="hidden" name="ns" value={t.ns} />}
          {t.gt && <input type="hidden" name="gt" value={t.gt} />}
          {t.moc && <input type="hidden" name="moc" value={t.moc} />}
          {t.tenMoc && <input type="hidden" name="tenMoc" value={t.tenMoc} />}
          {t.ct && <input type="hidden" name="ct" value={t.ct} />}

          {t.qh === 'minh' ? (
            <p className="text-[15px] text-muted-foreground">
              Nguồn sẽ ghi: tự khai về chính mình.
            </p>
          ) : (
            <fieldset>
              <legend className="text-[17px] font-semibold">Biết điều này từ đâu?</legend>
              <p className="mt-1 text-[15px] text-muted-foreground">
                Phả ghi cả điều biết và chỗ biết. Không có câu trả lời nào là sai.
              </p>
              <div className="mt-3.5 grid gap-2.5">
                {NGUON_CHON.map((n) => (
                  <label
                    key={n.ma}
                    className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-input bg-card px-4 py-3 has-checked:border-foreground"
                  >
                    <input
                      type="radio"
                      name="nguon"
                      value={n.ma}
                      defaultChecked={n.ma === 'biet-ro'}
                      className="size-4 shrink-0 accent-foreground"
                    />
                    <span className="flex flex-col">
                      <span className="text-[17px]">{n.nhan}</span>
                      <span className="text-[15px] text-muted-foreground">{n.phu}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* FR-55 — hệ quả với người còn sống, nói ngay tại đây, không đẩy xuống một trang
              điều khoản. Khối chàm = ghi chú, không phải cảnh báo lỗi. */}
          {t.qh !== 'minh' && (
            <div className="mt-5">
              <KhoiCham tua="Người còn sống tự quyết về mình">
                <p>
                  Ghi về người đang sống thì người đó, khi vào phả, sẽ thấy đúng những gì đã
                  ghi và tự sửa, tự ẩn, hoặc từ chối có tên trong bản in. Chỉ hiện năm sinh,
                  không hiện ngày tháng.
                </p>
              </KhoiCham>
            </div>
          )}

          {loi === 'chua-gan' ? (
            // Chưa gắn node: LỜI MỜI, không phải lỗi — hành động ghi dẫn về luồng gắn.
            <div className="mt-5">
              <KhoiCham tua="Còn thiếu một bước: chỗ của mình trên phả">
                <p>
                  Tài khoản chưa gắn với ai trên phả nên điều vừa khai chưa ghi vào đâu được.
                  Nhận chỗ của mình trước — một người trong họ sẽ xác nhận — rồi quay lại đây
                  ghi tiếp; phần vừa khai vẫn còn nguyên.
                </p>
              </KhoiCham>
              <Button asChild variant="outline" className="mt-3 h-12 w-full text-[17px]">
                <Link
                  href={`/gan-node?tiep=${encodeURIComponent(duongBuoc('/them/xac-nhan', t))}`}
                >
                  Nhận chỗ của mình trên phả
                </Link>
              </Button>
            </div>
          ) : (
            loi &&
            LOI_GHI[loi] && (
              <div className="mt-5">
                <KhoiCham>{LOI_GHI[loi]}</KhoiCham>
              </div>
            )
          )}

          <Button type="submit" className="mt-7 h-12 w-full text-[17px]">
            Ghi vào phả
          </Button>
          <p className="mt-2.5 text-center text-[15px] text-muted-foreground">
            Vào thẳng Tầng tồn nghi — hiện ngay, không phải chờ ai duyệt.
          </p>
        </form>
      </section>
    </KhungThem>
  );
}
