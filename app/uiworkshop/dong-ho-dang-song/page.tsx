/**
 * MÀN CHỦ — "Dòng họ đang sống".
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture — Màn chủ (bốn ô, Đợt 1 dựng hai)
 *   · EXPERIENCE.md § Key Flows — Luồng 1, bước 1
 *   · DESIGN.md § Brand & Style, § Components (node người)
 *
 * FR: FR-13 (trả công tức thì) · FR-39 (nhật ký sửa → ô "Vừa vào phả") · FR-63 (gốc dẫn xuất)
 *
 * Hai ô CHƯA dựng ở Đợt 1 — lời giáo huấn (FR-22) và sự kiện sắp tới (FR-41) — cố ý KHÔNG vẽ.
 * Vẽ ô trống có nhãn sẽ khiến người duyệt tưởng chúng nằm trong phạm vi. Chúng ở PLANNED_REQS.
 */
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  NGUOI,
  KHANH_ID,
  duongVeGoc,
  doiCua,
  nhanChi,
  MANH,
} from "../_mock/seed";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";

const toi = NGUOI.find((n) => n.id === KHANH_ID)!;
const duong = duongVeGoc(KHANH_ID);
const goc = duong[duong.length - 1];

/** Ô "Vừa vào phả" đọc ngược từ nhật ký sửa (FR-39) — KHÔNG cần FR-14. */
const vuaVaoPha = NGUOI.filter((n) => n.ngayThem === "hôm nay");

export default function Page() {
  return (
    <>
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-5xl md:px-10 md:pb-16 md:pt-28">
        {/* Đề từ dòng họ. Hán-Nôm LUÔN kèm phiên âm — NFR-9, không có ngoại lệ. */}
        <header className="mb-7 text-center md:mb-12 md:border-b md:border-border md:pb-10">
          <p className="text-[15px] uppercase tracking-[0.16em] text-muted-foreground">
            Nguyễn Quang
          </p>
          <p className="mt-2 font-[family-name:var(--font-pha)] text-[23px] text-primary md:mt-4 md:text-[44px]">
            光前裕後
          </p>
          <p className="text-[15px] italic text-muted-foreground">
            Quang tiền dụ hậu
          </p>
        </header>

        {/* Trên máy hai ô đứng CẠNH NHAU: "đường về cụ" là phần thưởng cá nhân, "vừa vào phả"
            là bằng chứng dòng họ đang sống. Đặt ngang nhau thì đọc ra một cặp; xếp chồng thì ô
            thứ hai tụt xuống dưới mép màn và mất hẳn tác dụng. */}
        <div className="md:grid md:grid-cols-2 md:gap-10">
          <section>
            {/* ── Ô 1: Cây gia tộc (FR-13) ───────────────────────────────── */}
            <h2 className="mb-2 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
              Cây gia tộc
            </h2>
            <Card className="mb-7 gap-0 py-4">
              <CardBody className="px-4">
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
                  {duong.map((n, i) => (
                    <li key={n.id} className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{
                          backgroundColor:
                            n.tinCay === "chac-chan"
                              ? "var(--color-tin-chac-chan)"
                              : n.tinCay === "theo-loi-ke"
                                ? "var(--color-tin-loi-ke)"
                                : "var(--color-tin-ton-nghi)",
                        }}
                        aria-hidden
                      />
                      {i < duong.length - 1 && (
                        <span className="h-px w-4 bg-border" aria-hidden />
                      )}
                    </li>
                  ))}
                </ol>
                <p className="mt-3 font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                  {duong.length} đời tới {goc.hoTen}
                </p>
                {/* FR-63: nói rõ đây là gốc TẠM, không phải khẳng định đã là Thuỷ tổ. */}
                <p className="mt-1 text-[15px] text-muted-foreground">
                  cụ xa nhất hiện biết · đời {doiCua(toi.id)} ·{" "}
                  {nhanChi(toi.id)}
                </p>
              </CardBody>
            </Card>
          </section>
          <section>
            {/* ── Ô 2: Vừa vào phả (FR-39) ───────────────────────────────── */}
            <h2 className="mb-2 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
              Vừa vào phả
            </h2>
            <div className="mb-7 space-y-3">
              {vuaVaoPha.map((n) => {
                const tonNghi =
                  n.tang === "ton-nghi" && n.tinCay === "ton-nghi";
                return (
                  <Card
                    key={n.id}
                    className={
                      tonNghi
                        ? "van-ton-nghi gap-0 border-dashed py-3.5"
                        : "gap-0 py-3.5"
                    }
                    style={
                      tonNghi
                        ? { borderColor: "var(--color-tin-ton-nghi)" }
                        : undefined
                    }
                  >
                    <CardBody className="px-4">
                      <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                        {n.hoTen}
                      </p>
                      <p className="mt-0.5 text-[15px] text-muted-foreground">
                        đời {doiCua(n.id)} · {nhanChi(n.id)}
                        {n.namSinh ? ` · sinh ${n.namSinh}` : ""}
                        {tonNghi ? " · tồn nghi" : ""}
                      </p>
                      {/* Dòng ghi công — bắt buộc, không phải trang trí. DESIGN.md § Components. */}
                      {n.nguoiThem && (
                        <p className="mt-1.5 text-[15px] italic text-primary">
                          {n.nguoiThem} ghi · {n.ngayThem}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>

        {/* FR-48: hiện TRUNG THỰC số mảnh chưa nối, không vẽ như một cây liền. */}
        <p className="mb-5 text-[15px] text-muted-foreground">
          Phả đang có {MANH.length} mảnh chưa nối được với nhau.
        </p>

        {/* Nút kéo hết bề ngang là đúng trên điện thoại (ngón cái), sai trên máy —
            một nút rộng 1000px không đọc ra như nút. Trên máy: đứng hàng, vừa nội dung. */}
        <div className="md:flex md:gap-3">
          <Button
            type="button"
            className="h-12 w-full text-[17px] md:w-auto md:px-8"
          >
            Thêm người thân
          </Button>
          <Button
            type="button"
            variant="outline"
            className="mt-2.5 h-12 w-full text-[17px] md:mt-0 md:w-auto md:px-8"
          >
            Xem cả tộc
          </Button>
        </div>
      </main>
      <ThanhDieuHuong hienTai="trang-chu" />
    </>
  );
}
