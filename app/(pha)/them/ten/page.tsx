/**
 * THÊM VÀO PHẢ — bước 2 / 4: tên đầy đủ (+ năm sinh, giới tính gập dưới "Thêm chi tiết").
 *
 * MỘT màn, MỘT câu hỏi (ràng buộc cứng): các trường phụ nằm gập để màn vẫn đọc ra một câu.
 * Form GET → /them/noi: trạng thái đi bằng URL, không JS, nút lui đúng nghĩa.
 *
 * KHÔNG hỏi ngày tháng sinh — chỉ NĂM: mặc định riêng tư với người còn sống (FR-37, PRD §11).
 * KHÔNG hỏi sống/mất trong luồng này: mọi người ghi ở đây vào phả như người còn sống, ngày
 * giỗ/tên huý là việc của trang một người về sau. (Ghi chú hệ quả FR-55 nằm ở màn xác nhận.)
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CauHoi, KhungThem, Nhip } from '../_chung/khuon';
import { GIOI_TINH, docTrangThai, type GioiTinh } from '../_chung/luong';

export const metadata: Metadata = { title: 'Thêm vào phả — tên' };

const NHAN_GT: Record<GioiTinh, string> = { nam: 'Nam', nu: 'Nữ', khac: 'Khác' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = docTrangThai(await searchParams);
  if (!t) redirect('/them');

  // Bố/Mẹ: giới tính suy thẳng từ quan hệ (luong.ts § gioiTinhCore) — không bắt khai lại.
  const hoiGioiTinh = t.qh !== 'bo' && t.qh !== 'me';

  return (
    <KhungThem>
      <section>
        <Nhip so={2} />
        <CauHoi>{t.qh === 'minh' ? 'Tên đầy đủ của mình là gì?' : 'Tên đầy đủ là gì?'}</CauHoi>
        <p className="mt-2 text-[17px] text-muted-foreground">
          Ghi như tên vẫn gọi trong nhà cũng được. Sửa lại được về sau.
        </p>

        <form action="/them/noi" method="get" className="mt-5">
          <input type="hidden" name="qh" value={t.qh} />

          <label className="block rounded-md border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
            <span className="text-[15px] text-muted-foreground">Họ và tên</span>
            <input
              name="ten"
              type="text"
              required
              defaultValue={t.ten}
              placeholder="Nguyễn Quang Hùng"
              className="mt-0.5 block w-full bg-transparent font-[family-name:var(--font-pha)] text-[17px] outline-none placeholder:text-muted-foreground"
            />
          </label>

          {/* Trường phụ GẬP — <details> thuần, không JS. Mở sẵn khi đã có dữ liệu (lui từ
              bước sau về thì điều đã khai không được biến mất vào nếp gập). */}
          <details className="mt-4 rounded-md border border-input bg-card" open={Boolean(t.ns || t.gt)}>
            <summary className="min-h-12 cursor-pointer select-none px-4 py-3 text-[17px] text-muted-foreground">
              Thêm chi tiết{hoiGioiTinh ? ' — năm sinh, giới tính' : ' — năm sinh'}
            </summary>
            <div className="border-t border-border px-4 pb-4 pt-3">
              <label className="block">
                <span className="text-[15px] text-muted-foreground">Năm sinh</span>
                <input
                  name="ns"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  defaultValue={t.ns}
                  placeholder="1950"
                  className="mt-0.5 block w-full bg-transparent font-[family-name:var(--font-pha)] text-[17px] outline-none placeholder:text-muted-foreground"
                />
              </label>
              <p className="mt-1.5 text-[15px] text-muted-foreground">
                Chỉ cần năm — ngày tháng của người còn sống không đưa lên phả.
              </p>

              {hoiGioiTinh && (
                <fieldset className="mt-4">
                  <legend className="text-[15px] text-muted-foreground">Giới tính</legend>
                  <div className="mt-1.5 flex gap-2">
                    {GIOI_TINH.map((gt) => (
                      <label
                        key={gt}
                        className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-input px-3 text-[17px] has-checked:border-foreground has-checked:font-semibold"
                      >
                        <input
                          type="radio"
                          name="gt"
                          value={gt}
                          defaultChecked={t.gt === gt}
                          className="size-4 accent-foreground"
                        />
                        {NHAN_GT[gt]}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          </details>

          <Button type="submit" className="mt-6 h-12 w-full text-[17px]">
            Tiếp
          </Button>
        </form>
      </section>
    </KhungThem>
  );
}
