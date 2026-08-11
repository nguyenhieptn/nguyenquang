/**
 * CÂY CẢ TỘC — TẦNG 1 của ba tầng zoom (Tộc → Chi → Người).
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture — Cây ba tầng
 *   · EXPERIENCE.md § Responsive & Platform — hai bộ mặt của cùng một màn
 *   · DESIGN.md § Brand & Style, § Colors (son khan hiếm), § Elevation & Depth (không đổ bóng)
 *
 * FR: FR-15 · FR-63 (gốc tạm) · FR-48 (mảnh chưa nối) · FR-3 (số còn ở tồn nghi)
 *
 * VÌ SAO TẦNG NÀY VẼ CHI CHỨ KHÔNG VẼ NGƯỜI — con số, không phải khẩu vị:
 * Q1 chốt dưới 300 người, 5–7 đời → đời rộng nhất khoảng 120 người. Sàn chữ 17px buộc một ô tên
 * rộng ~140px, tức ~16.800px bề ngang. Vẽ hết người trong một màn thì chữ phải xuống dưới sàn
 * 15px — vi phạm chính § Accessibility Floor. Cây toàn tộc trọn vẹn là hiện vật của BẢN IN
 * (FR-33). 5–7 khối chi thì vừa màn ở CẢ HAI khung, và chữ luôn đủ lớn.
 *
 * ── HAI BỘ MẶT ──────────────────────────────────────────────────────────────────────────────
 * ĐIỆN THOẠI — khối chi xếp chồng, không nhánh nối. Trên màn hẹp, nhánh nối chỉ tổ chiếm chỗ.
 * MÁY — khối chi đứng HÀNG NGANG và có NHÁNH NỐI THẬT xuống từ gốc tạm, nên nó đọc ra hình cây
 *   chứ không phải danh sách. Đây là điều màn hẹp không làm được, và là lý do bản máy tồn tại.
 *   Đề từ dòng họ cũng chỉ mở hết cỡ ở đây — nơi có chỗ cho nó thở.
 */
import { Card, CardBody } from "@/components/ui/card";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
// Bản máy đi qua CỔNG TẢI ĐỘNG, không import thẳng — xem đầu file cay-tai-dong.tsx.
import { CayCaTocTaiDong } from "@/components/pha/cay-tai-dong";
import { NGUOI, MANH, KHANH_ID, khoiChiCua, chiCua } from "../_mock/seed";

const manhChinh = MANH[0];
const gocTam = NGUOI.find((n) => n.id === manhChinh.gocTamId)!;
const khoiChi = khoiChiCua(manhChinh.id);
const chiCuaToi = chiCua(KHANH_ID);
const manhRoi = MANH.slice(1);
const tongNguoi = MANH.reduce((s, m) => s + m.soNguoi, 0);
const tongTonNghi = khoiChi.reduce((s, c) => s + c.soTonNghi, 0);

export default function Page() {
  return (
    <>
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-5xl md:px-10 md:pb-16 md:pt-28">
        {/* ── Đề từ. Trên máy mở hết cỡ; Hán-Nôm LUÔN kèm phiên âm (NFR-9). ── */}
        <header className="mb-7 md:mb-12 md:border-b md:border-border md:pb-10 md:text-center">
          <p className="text-[15px] uppercase tracking-[0.16em] text-muted-foreground">
            Nguyễn Quang
          </p>
          <p className="mt-2 font-[family-name:var(--font-pha)] text-[23px] text-primary md:mt-4 md:text-[44px]">
            光前裕後
          </p>
          <p className="text-[15px] italic text-muted-foreground md:mt-1 md:text-[17px]">
            Quang tiền dụ hậu
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-pha)] text-[23px] md:mt-8 md:text-[28px]">
            Cả tộc
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {tongNguoi} người đã được ghi · {khoiChi.length} chi · {tongTonNghi}{" "}
            người còn tồn nghi
            {manhRoi.length > 0 && ` · ${manhRoi.length} mảnh chưa nối`}
          </p>
        </header>

        {/* ══ BẢN MÁY — cùng một khung nhìn cây với tầng 2 và tầng 3 ═════════ */}
        <div className="hidden md:block">
          <CayCaTocTaiDong
            goc={{ id: gocTam.id, hoTen: gocTam.hoTen, tenHem: gocTam.tenHem }}
            khoiChi={khoiChi.map((c) => ({
              id: c.gocId,
              ten: c.ten,
              nguoiDungDau: c.nguoiDungDau,
              soDoi: c.soDoi,
              soNguoi: c.soNguoi,
              soTonNghi: c.soTonNghi,
            }))}
            manhRoi={manhRoi.map((m) => ({ id: m.id, nhan: m.nhan, soNguoi: m.soNguoi }))}
            chiCuaMinhId={chiCuaToi?.id}
          />
          <p className="mt-2 text-[15px] text-muted-foreground">
            Kéo để di chuyển · chụm hoặc dùng nút + − để phóng to. Mảnh chưa nối nằm tách hẳn
            sang một bên, kéo tới mới thấy — vì chưa ai tìm ra chỗ nối.
          </p>
          {manhRoi.length > 0 && (
            <p className="mt-4 max-w-xl text-[17px] text-muted-foreground">
              Mảnh rời không phải lỗi. Đó là phần dòng họ còn nhớ nhưng chưa nối lại được — và
              nối được một mảnh là việc quý nhất ai cũng làm được.
            </p>
          )}
        </div>

        {/* ══ BẢN ĐIỆN THOẠI — khối chi xếp chồng, một nét dọc ═══════════════ */}
        <div className="md:hidden">
        {/* Gốc tạm. FR-63: nói rõ đây KHÔNG phải khẳng định đã là Thuỷ tổ. */}
        <div className="md:mx-auto md:w-[280px]">
          <Card className="gap-0 border-dashed py-4">
            <CardBody className="px-4 text-center">
              <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                {gocTam.hoTen}
              </p>
              {gocTam.tenHem && (
                <p className="mt-0.5 text-[15px] text-muted-foreground">
                  tên hèm {gocTam.tenHem}
                </p>
              )}
              <p className="mt-1 text-[15px] text-muted-foreground">
                cụ xa nhất hiện biết · đời 1
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="flex justify-center" aria-hidden>
          <span className="h-6 w-px bg-border" />
        </div>

        <ul className="space-y-3">
          {khoiChi.map((chi) => {
            const laChiCuaToi = chi.gocId === chiCuaToi?.id;
            return (
              <li key={chi.gocId} className="md:h-full">
                <a href="/uiworkshop/mot-chi" className="block md:h-full">
                  <Card
                    className={[
                      "gap-0 py-4 md:h-full md:py-6",
                      laChiCuaToi ? "ring-2 ring-primary" : "",
                    ].join(" ")}
                  >
                    <CardBody className="px-4 md:px-5 md:text-center">
                      <div className="flex items-baseline justify-between gap-3 md:block">
                        <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold md:text-[21px]">
                          {chi.ten}
                        </p>
                        {laChiCuaToi && (
                          <span className="shrink-0 text-[15px] font-semibold text-primary md:mt-1 md:block">
                            chi của mình
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[15px] text-muted-foreground md:mt-2">
                        {chi.nguoiDungDau} · {chi.soDoi} đời
                      </p>

                      {/* Hai con số người duyệt chọn đo một chi. Không thêm con số thứ ba —
                          bảng chỉ số càng dài thì càng không ai đọc. */}
                      <dl className="mt-3 flex gap-6 md:mt-5 md:justify-center md:gap-8 md:border-t md:border-border md:pt-4">
                        <div>
                          <dt className="text-[15px] text-muted-foreground">
                            đã ghi
                          </dt>
                          <dd className="font-[family-name:var(--font-pha)] text-[17px] font-semibold md:text-[23px]">
                            {chi.soNguoi} người
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[15px] text-muted-foreground">
                            còn tồn nghi
                          </dt>
                          <dd className="font-[family-name:var(--font-pha)] text-[17px] font-semibold md:text-[23px]">
                            {chi.soTonNghi} người
                          </dd>
                        </div>
                      </dl>
                    </CardBody>
                  </Card>
                </a>
              </li>
            );
          })}
        </ul>

        {/* FR-48: mảnh chưa nối vẽ TÁCH HẲN — không nối vào gốc tạm bằng nét nào, và trên máy
            còn cách xa hẳn ra để khoảng trắng tự nói lên rằng chưa ai tìm ra chỗ nối. */}
        {manhRoi.length > 0 && (
          <section className="mt-8 md:mt-20 md:border-t md:border-dashed md:border-border md:pt-10">
            <h2 className="mb-2 text-[15px] font-bold uppercase tracking-wider text-muted-foreground md:mb-5 md:text-center">
              Chưa nối được vào đâu
            </h2>
            <ul className="space-y-3 md:mx-auto md:grid md:max-w-3xl md:grid-cols-2 md:gap-6 md:space-y-0">
              {manhRoi.map((m) => (
                <li key={m.id}>
                  <Card
                    className="van-ton-nghi gap-0 border-dashed py-4 md:py-6"
                    style={{ borderColor: "var(--color-tin-ton-nghi)" }}
                  >
                    <CardBody className="px-4 md:px-5 md:text-center">
                      <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold md:text-[21px]">
                        {m.nhan}
                      </p>
                      <p className="mt-0.5 text-[15px] text-muted-foreground md:mt-2">
                        {m.soNguoi} người · chưa ai tìm ra chỗ nối
                      </p>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[15px] text-muted-foreground">
              Mảnh rời không phải lỗi. Đó là phần dòng họ còn nhớ nhưng chưa nối
              lại được — và nối được một mảnh là việc quý nhất ai cũng làm được.
            </p>
          </section>
        )}
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" />
    </>
  );
}
