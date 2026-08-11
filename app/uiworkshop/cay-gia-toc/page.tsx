/**
 * CÂY GIA TỘC — mở lên thấy chính mình trước, rồi đi ngược lên.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Component Patterns — node người, chip mức tin cậy
 *   · EXPERIENCE.md § Key Flows — Luồng 1, nhịp cao trào (bước 7)
 *   · EXPERIENCE.md § Accessibility Floor — mã hoá trạng thái không bao giờ chỉ bằng màu
 *   · DESIGN.md § Colors (ba mức tin cậy), § Do's and Don'ts (cấm làm mờ tồn nghi)
 *
 * FR: FR-15 (cây) · FR-13 (đường về cụ tô sáng) · FR-63 (gốc dẫn xuất) · FR-2 (ba mức tin cậy)
 *     FR-3 (hai tầng) · FR-39 (ghi công) · FR-48 (mảnh chưa nối)
 *
 * Vẽ dọc thay vì ngang: PRD đòi "mở lên thấy chính mình trước, rồi đi ngược lên" — trên điện
 * thoại, trục dọc là trục cuộn tự nhiên, nên chính mình nằm dưới cùng và ngón tay đi lên là đi
 * về phía tổ tiên. Cây ngang buộc người dùng cuộn ngang để làm cùng việc đó.
 */
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  KHANH_ID,
  MANH,
  duongVeGoc,
  doiCua,
  maChiCua,
  type MucTinCay,
} from "../_mock/seed";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";

/** Đường về gốc, đảo lại: cụ xa nhất ở trên, chính mình ở dưới. */
const duong = [...duongVeGoc(KHANH_ID)].reverse();

const NHAN_TIN_CAY: Record<MucTinCay, string> = {
  "chac-chan": "chắc chắn",
  "theo-loi-ke": "theo lời kể",
  "ton-nghi": "tồn nghi",
};

const MAU_TIN_CAY: Record<MucTinCay, string> = {
  "chac-chan": "var(--color-tin-chac-chan)",
  "theo-loi-ke": "var(--color-tin-loi-ke)",
  "ton-nghi": "var(--color-tin-ton-nghi)",
};

export default function Page() {
  return (
    <>
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-2xl md:pb-16 md:pt-28">
        <header className="mb-6">
          <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
            Cây gia tộc
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Đường từ Nguyễn Quang Khánh ngược lên cụ xa nhất hiện biết
          </p>
        </header>

        <ol className="space-y-0">
          {duong.map((n, i) => {
            const laToi = n.id === KHANH_ID;
            const tonNghi = n.tinCay === "ton-nghi";
            return (
              <li key={n.id}>
                <Card
                  className={[
                    "gap-0 py-3.5",
                    tonNghi ? "van-ton-nghi border-dashed" : "",
                    // Tô sáng đường của chính mình (FR-13) bằng VIỀN, không bằng nền —
                    // nền son sẽ nuốt mất phân biệt chất liệu của tầng tồn nghi.
                    laToi ? "ring-2 ring-primary" : "",
                  ].join(" ")}
                  style={
                    tonNghi
                      ? { borderColor: "var(--color-tin-ton-nghi)" }
                      : undefined
                  }
                >
                  <CardBody className="px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                          {n.hoTen}
                          {n.huy && (
                            <span className="ml-2 text-[15px] font-normal text-muted-foreground">
                              huý {n.huy}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[15px] text-muted-foreground">
                          đời {doiCua(n.id)} · chi {maChiCua(n.id)}
                          {n.namSinh ? ` · sinh ${n.namSinh}` : ""}
                          {n.namMat ? ` · mất ${n.namMat}` : ""}
                        </p>
                        {n.nguoiThem && (
                          <p className="mt-1.5 text-[15px] italic text-primary">
                            {n.nguoiThem} ghi · {n.ngayThem}
                          </p>
                        )}
                      </div>

                      {/* Chip mức tin cậy: CHẤM MÀU + CHỮ. Không bao giờ chỉ màu —
                        phải đọc được khi in đen trắng và với người mù màu. */}
                      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[15px] text-muted-foreground">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: MAU_TIN_CAY[n.tinCay] }}
                          aria-hidden
                        />
                        {NHAN_TIN_CAY[n.tinCay]}
                      </span>
                    </div>
                  </CardBody>
                </Card>

                {i < duong.length - 1 && (
                  <div className="ml-7 h-5 w-px bg-border" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>

        {/* Chú giải — mỗi từ phả học được giải nghĩa tại chỗ lần đầu xuất hiện. */}
        <section className="mt-8 rounded-md border border-border bg-card px-4 py-4">
          <h2 className="text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
            Ba mức tin cậy
          </h2>
          <dl className="mt-3 space-y-2.5">
            {(Object.keys(NHAN_TIN_CAY) as MucTinCay[]).map((m) => (
              <div key={m} className="flex gap-2.5">
                <span
                  className="mt-2 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: MAU_TIN_CAY[m] }}
                  aria-hidden
                />
                <div>
                  <dt className="text-[17px] font-semibold">
                    {NHAN_TIN_CAY[m]}
                  </dt>
                  <dd className="text-[15px] text-muted-foreground">
                    {m === "chac-chan" &&
                      "Có giấy tờ, bia mộ, hoặc phả cũ chép lại."}
                    {m === "theo-loi-ke" &&
                      "Người trong họ kể lại, chưa có vật chứng."}
                    {m === "ton-nghi" &&
                      "Còn ngờ, chưa ai xác nhận. Ghi lại để không quên."}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Ô viền nét đứt trên nền vân giấy là{" "}
            <strong className="font-semibold">Tầng tồn nghi</strong> — đã ghi
            vào phả, chưa được duyệt lên Tầng chính thức. Chữ vẫn rõ như mọi ô
            khác.
          </p>
        </section>

        {/* FR-48: trung thực về mảnh chưa nối. */}
        <section className="mt-5 rounded-md border border-dashed border-border px-4 py-4">
          <p className="text-[17px]">
            Còn {MANH.length} mảnh chưa nối được với nhau.
          </p>
          <ul className="mt-2 space-y-1">
            {MANH.map((m) => (
              <li key={m.id} className="text-[15px] text-muted-foreground">
                {m.nhan} · {m.soNguoi} người
              </li>
            ))}
          </ul>
        </section>

        <Button type="button" className="mt-6 h-12 w-full text-[17px]">
          Thêm người thân
        </Button>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" />
    </>
  );
}
