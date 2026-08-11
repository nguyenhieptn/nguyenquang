/**
 * MỘT CHI — TẦNG 2 của ba tầng zoom (Tộc → Chi → Người).
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture — Cây ba tầng
 *   · EXPERIENCE.md § Responsive & Platform — hai bộ mặt của cùng một màn
 *   · DESIGN.md § Do's and Don'ts (cấm làm mờ tồn nghi)
 *
 * FR: FR-15 ("collapse theo ĐỜI") · FR-2 · FR-3 · FR-13 (đường về cụ tô sáng) · FR-63
 *
 * ĐÂY LÀ ĐIỂM VÀO của mục "Gia phả". FR-15 đòi "mở lên thấy CHÍNH MÌNH trước, rồi đi ngược lên".
 *
 * ── HAI BỘ MẶT ──────────────────────────────────────────────────────────────────────────────
 * ĐIỆN THOẠI — đời là hàng GẬP được. Màn hẹp buộc phải giấu bớt, nên gập là cách trung thực nhất:
 *   đời của mình và đời ngay trên bung sẵn, còn lại gập.
 *
 * MÁY — đời là CỘT, trái sang phải, không gập gì cả. Đây KHÔNG phải bản điện thoại kéo giãn: cột
 *   dọc theo đời chính là cách **phả in** đọc, và màn rộng là chỗ duy nhất vẽ được nó. Người xem
 *   thấy TRỌN chi trong một cái nhìn thay vì bung từng đời — đó mới là thứ không gian rộng mua
 *   được, chứ không phải chữ to hơn. Đường huyết thống của chính mình tô son xuyên các cột (FR-13).
 */
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
import {
  KHANH_ID,
  chiCua,
  tenChi,
  nguoiTheoDoi,
  doiHienThi,
  duongVeGoc,
  type Nguoi,
  type MucTinCay,
} from "../_mock/seed";

const gocChi = chiCua(KHANH_ID)!;
const nhomDoi = nguoiTheoDoi(gocChi.id);
const doiCuaToi = doiHienThi(KHANH_ID);
const tongNguoi = nhomDoi.reduce((s, g) => s + g.nguoi.length, 0);

/** Đường huyết thống của chính mình — tô son xuyên các cột trên bản máy (FR-13). */
const duongCuaToi = new Set(duongVeGoc(KHANH_ID).map((n) => n.id));

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

function ChamTinCay({ muc }: { muc: MucTinCay }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[15px] text-muted-foreground">
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: MAU_TIN_CAY[muc] }}
        aria-hidden
      />
      {NHAN_TIN_CAY[muc]}
    </span>
  );
}

function DongPhu({ n }: { n: Nguoi }) {
  return (
    <p className="mt-0.5 text-[15px] text-muted-foreground">
      {n.namSinh ? `sinh ${n.namSinh}` : "chưa rõ năm sinh"}
      {n.namMat ? ` · mất ${n.namMat}` : ""}
      {n.ketHonVaoHo ? " · kết hôn vào họ" : ""}
    </p>
  );
}

export default function Page() {
  return (
    <>
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-6xl md:px-10 md:pb-16 md:pt-28">
        {/* Đầu trang. Trên máy: một dải rộng, tên chi lớn hẳn, hành động nằm bên phải. */}
        <div className="md:flex md:items-end md:justify-between md:border-b md:border-border md:pb-6">
          <div>
            <a
              href="/uiworkshop/ca-toc"
              className="text-[15px] text-muted-foreground underline"
            >
              ← Xem cả tộc
            </a>
            <h1 className="mt-3 font-[family-name:var(--font-pha)] text-[23px] md:text-[34px]">
              {tenChi(gocChi.id)}
            </h1>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {gocChi.hoTen} · {tongNguoi} người · {nhomDoi.length} đời
            </p>
          </div>
          <a
            href="/uiworkshop/cay-gia-toc"
            className="hidden rounded-md border border-input px-5 py-3 text-[17px] md:block"
          >
            Xem đường từ bạn ngược lên cụ
          </a>
        </div>

        {/* ══ BẢN ĐIỆN THOẠI — đời là hàng gập được ══════════════════════════ */}
        <ul className="mt-6 space-y-3 md:hidden">
          {nhomDoi.map(({ doi, nguoi }) => (
            <li key={doi}>
              <details
                open={doi === doiCuaToi || doi === doiCuaToi - 1}
                className="rounded-md border border-border bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5">
                  <span className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                    Đời {doi}
                  </span>
                  <span className="text-[15px] text-muted-foreground">
                    {nguoi.length} người
                  </span>
                </summary>
                <ul className="border-t border-border px-4 py-1">
                  {nguoi.map((n) => (
                    <li
                      key={n.id}
                      className={[
                        "-mx-4 border-b border-border px-4 py-3 last:border-b-0",
                        n.tinCay === "ton-nghi" ? "van-ton-nghi" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                            {n.hoTen}
                            {n.id === KHANH_ID && (
                              <span className="ml-2 text-[15px] font-semibold text-primary">
                                bạn
                              </span>
                            )}
                          </p>
                          <DongPhu n={n} />
                          {n.nguoiThem && (
                            <p className="mt-1 text-[15px] italic text-primary">
                              {n.nguoiThem} ghi · {n.ngayThem}
                            </p>
                          )}
                        </div>
                        <ChamTinCay muc={n.tinCay} />
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>

        {/* ══ BẢN MÁY — đời là CỘT, trái sang phải, không gập ═════════════════ */}
        <div className="mt-8 hidden md:block">
          <div className="flex gap-5 overflow-x-auto pb-4">
            {nhomDoi.map(({ doi, nguoi }) => (
              <section key={doi} className="w-[210px] shrink-0">
                <header
                  className={[
                    "mb-3 border-b pb-2",
                    doi === doiCuaToi ? "border-primary" : "border-border",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "font-[family-name:var(--font-pha)] text-[17px] font-semibold",
                      doi === doiCuaToi ? "text-primary" : "",
                    ].join(" ")}
                  >
                    Đời {doi}
                  </p>
                  <p className="text-[15px] text-muted-foreground">
                    {nguoi.length} người
                  </p>
                </header>

                <ul className="space-y-3">
                  {nguoi.map((n) => {
                    const tonNghi = n.tinCay === "ton-nghi";
                    const tren = duongCuaToi.has(n.id);
                    return (
                      <li
                        key={n.id}
                        className={[
                          "rounded-md border px-3.5 py-3",
                          tonNghi ? "van-ton-nghi border-dashed" : "bg-card",
                          // Đường huyết thống của mình xuyên các cột — vòng son, KHÔNG đổi nền,
                          // để không nuốt mất phân biệt chất liệu của tầng tồn nghi.
                          tren ? "ring-2 ring-primary" : "",
                        ].join(" ")}
                        style={
                          tonNghi
                            ? { borderColor: "var(--color-tin-ton-nghi)" }
                            : undefined
                        }
                      >
                        <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                          {n.hoTen}
                        </p>
                        {n.id === KHANH_ID && (
                          <p className="text-[15px] font-semibold text-primary">
                            bạn
                          </p>
                        )}
                        <DongPhu n={n} />
                        <div className="mt-2">
                          <ChamTinCay muc={n.tinCay} />
                        </div>
                        {n.nguoiThem && (
                          <p className="mt-1.5 text-[15px] italic text-primary">
                            {n.nguoiThem} ghi · {n.ngayThem}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-2 text-[15px] text-muted-foreground">
            Vòng son là đường huyết thống từ bạn ngược lên cụ xa nhất hiện biết.
          </p>
        </div>

        <a
          href="/uiworkshop/cay-gia-toc"
          className="mt-6 block rounded-md border border-input px-4 py-3.5 text-center text-[17px] md:hidden"
        >
          Xem đường từ bạn ngược lên cụ
        </a>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" />
    </>
  );
}
