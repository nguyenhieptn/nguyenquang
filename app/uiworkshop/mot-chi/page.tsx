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
 *   đời của mình và đời ngay trên bung sẵn, còn lại gập. Đây đúng chữ FR-15 "collapse theo đời".
 *
 * MÁY — CÂY THẬT, vẽ từ TRÊN XUỐNG: cụ ở trên, con cháu bên dưới, nhánh rủ xuống, vợ/chồng đứng
 *   chung một thẻ. Người xem thấy TRỌN chi trong một cái nhìn thay vì bung từng đời.
 *
 *   SỬA 11/08/2026 — bản trước xếp đời thành CỘT trái sang phải. Sai: đó là hướng đọc của một
 *   BẢNG, không phải của một cuốn phả. Trên phả, xuống là đi về phía sau, và chính hướng đọc ấy
 *   mang nghĩa. Người duyệt gạch đi, đúng.
 */
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
// Tải ĐỘNG theo bề rộng màn: điện thoại không tải một byte React Flow nào.
// Xem đầu file cay-tai-dong.tsx — `hidden md:block` một mình KHÔNG đủ.
import { CayGiaPhaTaiDong } from "@/components/pha/cay-tai-dong";
import {
  KHANH_ID,
  chiCua,
  tenChi,
  nguoiTheoDoi,
  capTheoChi,
  doiHienThi,
  duongVeGoc,
  type Nguoi,
  type MucTinCay,
} from "../_mock/seed";

const gocChi = chiCua(KHANH_ID)!;
const nhomDoi = nguoiTheoDoi(gocChi.id);
const doiCuaToi = doiHienThi(KHANH_ID);
const tongNguoi = nhomDoi.reduce((s, g) => s + g.nguoi.length, 0);

/** Cặp (người + vợ/chồng) — dùng chung cho CẢ HAI bộ mặt, để một người bạn đời không hiện ra
 *  ở bản này mà biến mất ở bản kia. */
const capCuaChi = capTheoChi(gocChi.id);
const banDoiCua = new Map(capCuaChi.map((c) => [c.nguoi.id, c.banDoi]));

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
            Xem cây gia tộc
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
                {/* Một dòng = một CẶP, y như một node trên cây bản máy: người mang huyết thống,
                    vợ/chồng nằm trong cùng dòng. Không tách thành hai dòng rời, nếu không cùng
                    một người lúc thì là một ô trên cây, lúc lại là hai dòng trong danh sách. */}
                <ul className="border-t border-border px-4 py-1">
                  {nguoi
                    .filter((n) => !n.ketHonVaoHo)
                    .map((n) => {
                      const banDoi = banDoiCua.get(n.id);
                      return (
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
                                    mình
                                  </span>
                                )}
                              </p>
                              <DongPhu n={n} />
                              {banDoi && (
                                <div className="mt-2 border-t border-border pt-2">
                                  <p className="text-[15px] text-muted-foreground">
                                    {banDoi.gioiTinh === "nu" ? "vợ" : "chồng"}
                                  </p>
                                  <p className="font-[family-name:var(--font-pha)] text-[17px]">
                                    {banDoi.hoTen}
                                  </p>
                                  <DongPhu n={banDoi} />
                                </div>
                              )}
                              {n.nguoiThem && (
                                <p className="mt-1 text-[15px] italic text-primary">
                                  {n.nguoiThem} ghi · {n.ngayThem}
                                </p>
                              )}
                            </div>
                            <ChamTinCay muc={n.tinCay} />
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </details>
            </li>
          ))}
        </ul>

        {/* ══ BẢN MÁY — CÂY THẬT, vẽ từ trên xuống ═══════════════════════════ */}
        <div className="mt-8 hidden md:block">
          <CayGiaPhaTaiDong
            caps={capCuaChi}
            minhId={KHANH_ID}
            duongVeGoc={[...duongCuaToi]}
          />

          <p className="mt-2 text-[15px] text-muted-foreground">
            Kéo để di chuyển · chụm hoặc dùng nút + − để phóng to. Vòng son là đường huyết thống
            ngược lên cụ xa nhất hiện biết.
          </p>
        </div>

        <a
          href="/uiworkshop/cay-gia-toc"
          className="mt-6 block rounded-md border border-input px-4 py-3.5 text-center text-[17px] md:hidden"
        >
          Xem cây gia tộc
        </a>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" />
    </>
  );
}
