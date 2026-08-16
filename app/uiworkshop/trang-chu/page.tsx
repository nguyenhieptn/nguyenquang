/**
 * TRANG CHỦ — bản dựng lại. "Trang đầu của cuốn phả".
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture — Màn chủ (bốn ô, Đợt 1 dựng HAI)
 *   · EXPERIENCE.md § Responsive — "xuống là đi về phía sau" (sửa 11/08/2026)
 *   · DESIGN.md § Brand & Style (một cảm xúc: tự hào) · § Colors (son khan hiếm)
 *     · § Elevation (không đổ bóng) · § Components (dòng ghi công bắt buộc) · § Do's and Don'ts
 *
 * FR: FR-13 (trả công tức thì) · FR-39 (nhật ký → "vừa vào phả") · FR-63 (gốc tạm) · FR-48 (mảnh)
 *
 * ── Ý đồ ──────────────────────────────────────────────────────────────────
 *
 * DESIGN.md giao cho tầng thị giác một việc mà câu chữ không làm được: *"Giọng chữ thì lạnh…
 * TOÀN BỘ hơi ấm do tầng thị giác gánh."* Nên hơi ấm ở đây đến từ ba thứ, không thứ nào là hình
 * trang trí: **cột đời đặt bằng chữ có chân**, **nhịp vạch của trang sổ**, và **dòng ghi công**.
 *
 *   1. **Đường về cụ là CỘT TÊN DỌC, đọc từ cụ xuống mình.** Sáu cái chấm không gợi được gì; sáu
 *      cái TÊN thì gợi. Hướng đọc phải là xuống — EXPERIENCE.md § Responsive tự sửa mình ngày
 *      11/08: *"trên phả, xuống là đi về phía sau — hướng đọc tự nó mang nghĩa."*
 *   2. **"Vừa vào phả" là ghi chú lề.** Trong phả giấy, người mới thêm là chữ viết thêm bên lề.
 *   3. **Số mảnh chưa nối nằm ở chân cột**, nơi nó có nghĩa: đường của mình dừng ở đây, và còn
 *      ngần này mảnh chưa biết nối vào đâu. Trung thực đúng FR-48, nhưng đọc ra lời mời.
 *
 * ── KHÔNG có tiêu đề "Gia phả họ Nguyễn Quang" trên thân trang ────────────
 *
 * Măng-sét đã gánh danh tính rồi (`ThanhDieuHuong`). Lặp lại tên ở thân trang, cách nhau chưa tới
 * một trăm điểm ảnh, chính là chỗ đọc ra "chưa thuần nhất" — và nó ăn mất khoảng mở đầu mà cột
 * đời đang cần. Sách có tên ở gáy và tên ở trang bìa vì chúng ở hai tờ khác nhau; một trang cuộn
 * thì không.
 *
 * ── Ba thứ cố ý KHÔNG thêm ────────────────────────────────────────────────
 *
 *   · **Không con số thứ ba.** Trang có đúng hai: số đời tới gốc tạm, và số mảnh chưa nối.
 *     EXPERIENCE.md: *"Bảng chỉ số càng dài thì càng không ai đọc."*
 *   · **Không vẽ hai ô chưa tới lượt** (FR-22 lời giáo huấn, FR-41 sự kiện). Vẽ ô trống có nhãn
 *     khiến người duyệt tưởng chúng nằm trong phạm vi. Chúng ở `PLANNED_REQS`.
 *   · **Không đổ bóng, không gradient, không bo tròn chân dung.**
 */
import { Button } from "@/components/ui/button";
import { ChamTinCay } from "@/components/pha/tin-cay";
import { ChanTrang } from "@/components/pha/chan-trang";
import { KHUNG } from "@/components/pha/khung";
import { OTim } from "@/components/pha/o-tim";
import { TamPhim } from "@/components/pha/tam-phim";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
import { TuaMuc } from "@/components/pha/vach";
import {
  TEN_PHA,
  KHANH_ID,
  NGUOI,
  SO_MANH_CHUA_NOI,
  doiCua,
  duongVeGoc,
  nhanChi,
} from "../_mock/seed";

const toi = NGUOI.find((n) => n.id === KHANH_ID)!;

// `duongVeGoc` trả [mình … gốc]. Đảo lại để đọc TỪ TRÊN XUỐNG: cụ trước, mình sau.
// Không phải sở thích bố cục — xuống là đi về phía sau, và hướng đọc mang nghĩa.
const doiTruoc = [...duongVeGoc(KHANH_ID)].reverse();
const goc = doiTruoc[0];

/** Ô "Vừa vào phả" đọc ngược từ nhật ký sửa (FR-39) — KHÔNG cần FR-14. */
const vuaVaoPha = NGUOI.filter((n) => n.ngayThem === "hôm nay");

export default function Page() {
  return (
    // `min-h-dvh` + `flex-col`: trang ngắn thì chân trang vẫn tụt xuống đáy thay vì lửng lơ giữa
    // màn — ở bề ngang thật đây là chỗ dễ lộ nhất.
    <div className="flex min-h-dvh flex-col">
      <main className={`${KHUNG} flex-1 pt-9 md:pt-32`}>
        {/* ── HAI CỘT BẮT ĐẦU Ở `lg`, KHÔNG PHẢI `md` (sửa 16/08/2026) ──────────────────
            Trước đây lưới bật ở `md` (768px). Làm phép tính ở đúng mốc ấy: khung 768 − 64 lề
            − 288 rail − 48 khe = **368px** cho cột chữ. `khung.ts` chốt tầm đọc 510–640px cho
            chữ 17px; 368px là ~43 ký tự một dòng, thấp hơn sàn dưới gần một phần ba.

            Tức là dải 768–1023px đang chạy một bố cục hai cột mà cột chính hẹp hơn mức đọc được
            — và người đo chuẩn của DESIGN.md là bà bác ~70 tuổi. Dời lên `lg` thì dải ấy xếp
            chồng (một cột rộng 704px, đọc tốt), còn từ 1024px lưới mới bật với cột chữ 624px,
            nằm gọn trong tầm đọc.

            Thanh điều hướng vẫn đổi sang măng-sét ở `md` — đó là ĐÚNG và không mâu thuẫn: vỏ
            trang đổi theo con trỏ chuột, thân trang đổi theo bề ngang đọc được. Hai thứ không
            buộc phải đổi cùng một mốc. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          {/* ══ CỘT ĐỜI — trái tim của trang ═══════════════════════════ */}
          <section>
            {/* ── Ô TÌM đứng ĐẦU TIÊN ────────────────────────────────────────────────────
                `EXPERIENCE.md § Key Flows` — Luồng 1: bước 1 mở web, **bước 2 gõ tên bố**. Tìm là
                nước đi tiếp theo của luồng chính, nên nó phải là thứ đầu tiên chạm tới được.

                Và FR-48 chốt *mọi đường vào việc thêm đều qua tìm*. Trước đây trang chủ không có ô
                tìm nào: muốn tìm phải bấm mục **"Thêm"** — trong khi người dùng đang nghĩ mình
                *đi tìm*, không nghĩ mình *đi thêm*. Cái cổng chặn trùng quan trọng nhất của sản
                phẩm nằm sau một cái nhãn nói sai việc nó làm.

                MỘT ô, không phải bốn như các cổng đa dòng họ: một họ thì lọc theo họ là vô nghĩa.

                ⚠️ KHÔNG có `href` từ 16/08/2026 — màn `tim-nguoi-than` đã bị xoá khi thu phạm vi.
                `OTim` không có href thì render ra một cái ô chết, đúng bản chất xưởng tĩnh. Dựng
                lại màn tìm thì trả `href` về. */}
            <OTim
              className="mb-9"
              goiY="Gõ tên để xem người ấy đã có trong phả chưa."
            />

            <TuaMuc phu={nhanChi(toi.id)}>Đường về cụ xa nhất hiện biết</TuaMuc>

            <ol className="mt-6">
              {doiTruoc.map((n, i) => {
                const laMinh = n.id === toi.id;
                const cuoi = i === doiTruoc.length - 1;
                const tonNghi = n.tinCay === "ton-nghi";
                return (
                  <li key={n.id} className="relative flex gap-4">
                    {/* Cột số đời — nhịp của một cuốn sổ, và là thứ neo mắt khi lướt. */}
                    <span className="w-12 shrink-0 pt-1 text-right text-[15px] tabular-nums text-muted-foreground">
                      đời {doiCua(n.id)}
                    </span>

                    {/* Nét dọc nối các đời: đường gáy sổ, không phải viền khối. Đoạn cuối cắt đi
                        để cột không thò xuống dưới tên chót. */}
                    <span
                      aria-hidden
                      className={`absolute left-[3.65rem] top-4 w-px bg-border ${cuoi ? "h-0" : "bottom-0"}`}
                    />

                    <span className="relative z-10 flex flex-col items-center pt-2">
                      {/* Dấu đời. Nét đứt cho tồn nghi — KHÁC CHẤT LIỆU, không khác độ đậm.
                          DESIGN.md Don't #1: không bao giờ làm mờ node tồn nghi. */}
                      <span
                        aria-hidden
                        className={
                          tonNghi
                            ? "size-2.5 rounded-full border border-dashed bg-background"
                            : "size-2.5 rounded-full"
                        }
                        style={
                          tonNghi
                            ? { borderColor: "var(--color-tin-ton-nghi)" }
                            : {
                                backgroundColor:
                                  n.tinCay === "chac-chan"
                                    ? "var(--color-tin-chac-chan)"
                                    : "var(--color-tin-loi-ke)",
                              }
                        }
                      />
                    </span>

                    <div className={cuoi ? "pb-0" : "pb-7"}>
                      <p className="font-[family-name:var(--font-pha)] text-[21px] font-semibold leading-snug">
                        {n.hoTen}
                        {/* "mình" bằng son — cùng cách đánh dấu với thẻ người trên cây, để một
                            người không phải lúc là son lúc là chữ đậm. */}
                        {laMinh && (
                          <span className="ml-2.5 text-[17px] font-semibold text-primary">
                            mình
                          </span>
                        )}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {/* Chấm + CHỮ. Ba mức không bao giờ chỉ mã hoá bằng màu. */}
                        <ChamTinCay muc={n.tinCay} />
                        {i === 0 && (
                          // FR-63: nói rõ đây là gốc TẠM, không phải khẳng định đã là Thuỷ tổ.
                          <span className="text-[15px] text-muted-foreground">
                            cụ xa nhất hiện biết
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* Con số thứ nhất trong hai — câu kết của cột, nên đứng ngay dưới cột. */}
            <div aria-hidden className="mt-7 h-px bg-border" />
            <p className="mt-4 text-[17px]">
              <span className="font-semibold">{doiTruoc.length} đời</span> từ{" "}
              <span className="font-[family-name:var(--font-pha)]">{goc.hoTen}</span> tới đây.
            </p>
            {/* Con số thứ hai. FR-48 đòi hiện TRUNG THỰC số mảnh chưa nối. */}
            <p className="mt-1.5 text-[15px] text-muted-foreground">
              Còn {SO_MANH_CHUA_NOI} mảnh chưa nối được vào cây này — chưa ai tìm ra chỗ nối.
            </p>

            {/* ══ HAI HÀNH ĐỘNG — NẰM TRONG CỘT TRÁI ═══════════════════════
                Chuyển vào đây 16/08/2026. Trước đó khối nút đứng NGOÀI lưới, kéo hết bề ngang
                1024px dưới cả hai cột — nên trên máy nó treo lơ lửng dưới đường viền của rail,
                không thuộc về cột nào.

                Nút là **câu kết của cột đời**, không phải chân trang của cả bố cục: đọc xong sáu
                đời, con số "6 đời tới đây", rồi "còn 12 mảnh chưa nối" — thì "Thêm người thân" là
                câu trả lời cho đúng ba dòng vừa đọc. Đặt nó trong cột giữ được mạch ấy.

                Kéo hết bề ngang là đúng trên điện thoại (ngón cái), sai trên máy — một nút rộng
                600px không đọc ra như nút. Chính = nền son; phụ = viền, nền trong (DESIGN.md § Nút). */}
            <div className="mt-12 md:flex md:gap-3">
              <Button type="button" className="h-12 w-full text-[17px] md:w-auto md:px-8">
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
          </section>

          {/* ══ RAIL PHẢI — ghi chú lề + tranh chèn ════════════════════
              Trên máy đứng CẠNH cột đời: đây là bằng chứng dòng họ đang sống, đặt ngang hàng với
              đường về cụ thì hai thứ đọc ra một cặp. Xếp chồng thì nó tụt khỏi mép màn.

              Rail giữ `stretch` (không `items-start`): đường viền trái chạy hết chiều cao hàng,
              nên nó đọc ra **vạch chia cột của một trang sách**, không phải viền của một cái hộp
              nội dung. Đây cũng là lý do rail không có nền riêng. */}
          <aside className="mt-12 lg:mt-0 lg:border-l lg:border-border lg:pl-8">
            <TuaMuc>Vừa vào phả</TuaMuc>

            <ul className="mt-5 space-y-5">
              {vuaVaoPha.map((n) => {
                const tonNghi = n.tinCay === "ton-nghi";
                return (
                  <li
                    key={n.id}
                    // Tồn nghi khác CHẤT LIỆU: vân giấy + nét đứt, tuyệt đối không opacity.
                    className={
                      tonNghi
                        ? "van-ton-nghi rounded-md border border-dashed px-3.5 py-3"
                        : "px-3.5 py-3"
                    }
                    style={
                      tonNghi ? { borderColor: "var(--color-tin-ton-nghi)" } : undefined
                    }
                  >
                    <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold leading-snug">
                      {n.hoTen}
                    </p>
                    <p className="mt-0.5 text-[15px] text-muted-foreground">
                      đời {doiCua(n.id)} · {nhanChi(n.id)}
                      {tonNghi ? " · tồn nghi" : ""}
                    </p>
                    {/* Dòng ghi công là BẮT BUỘC, không phải trang trí: tên người đóng góp nằm
                        TRÊN PHẢ, không chỉ trong nhật ký. DESIGN.md § Components. */}
                    {n.nguoiThem && (
                      <p className="mt-2 text-[15px] italic text-primary">
                        {n.nguoiThem} ghi · {n.ngayThem}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* ── TRANH CHÈN — xuống rail 16/08/2026 ────────────────────────────────────
                Trước đó tấm phim đứng thứ hai trong cột trái, ngay dưới ô tìm. Trên điện thoại
                đó là chỗ đúng. Trên máy nó tốn **415px** đầu cột — và 415px ấy chính là khoảng
                đẩy cột đời, thứ file này gọi là trái tim của trang, ra khỏi tầm nhìn đầu tiên.

                Nghịch lý phải gọi tên: chú thích cũ viết *"video vẫn trong tầm nhìn đầu tiên
                trên máy"*. Đúng — nhưng nó ở đó BẰNG CÁCH đẩy cột đời ra. Trên một màn cao 900px
                chỉ có chỗ cho một trong hai, và không thể là cái video.

                Xuống rail thì video KHÔNG mất tầm nhìn đầu tiên — rail nằm cạnh, không nằm dưới.
                Nó chỉ thôi cạnh tranh theo trục dọc. Đây đúng là việc mà bề ngang mua được, và là
                lý do bố cục này chỉ tồn tại từ 1024px.

                Đặt DƯỚI "Vừa vào phả" chứ không trên: người mới cần đường lui, nhưng bằng chứng
                dòng họ đang sống mới là thứ trả công tức thì (FR-13). Rail đọc từ trên xuống theo
                đúng thứ tự ấy. */}
            <TamPhim
              className="mt-10"
              chuThich="Phả này hoạt động thế nào"
              thoiLuong="1 phút 20"
            />
          </aside>
        </div>
      </main>

      <ChanTrang tenPha="Nguyễn Quang" />
      <ThanhDieuHuong hienTai="trang-chu" tenPha={TEN_PHA} />
    </div>
  );
}
