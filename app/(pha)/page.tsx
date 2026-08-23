/**
 * TRANG CHỦ — promote từ `app/uiworkshop/trang-chu` (Story 2-1). "Trang đầu của cuốn phả".
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture — Màn chủ (bốn ô, Đợt 1 dựng HAI)
 *   · EXPERIENCE.md § Responsive — "xuống là đi về phía sau" (sửa 11/08/2026)
 *   · EXPERIENCE.md § State Patterns — "Chưa gắn node": cột đời thành lời mời, KHÔNG phải lỗi
 *   · DESIGN.md § Brand & Style (một cảm xúc: tự hào) · § Colors (son khan hiếm)
 *     · § Elevation (không đổ bóng) · § Components (dòng ghi công bắt buộc) · § Do's and Don'ts
 *
 * FR: FR-13 (trả công tức thì) · FR-39 (nhật ký → "vừa vào phả") · FR-63 (gốc tạm) · FR-48 (mảnh)
 *
 * Dữ liệu thật (AD-24 — core tự biết người xem, trang KHÔNG truyền danh tính):
 *   · `getAncestryPath` — cột đời, đọc TỪ CỤ XUỐNG MÌNH
 *   · `getClanOverview` — số mảnh chưa nối ở chân cột; số người/chi cho trạng thái mời
 *   · `getRecentAdditions` — ô "Vừa vào phả", đã lọc bán kính riêng tư trong core
 *   · `resolveViewer` — CHỈ để chọn biến thể (đã gắn / chưa gắn), không để lấy dữ liệu
 *
 * ── Ý đồ (giữ nguyên từ bản xưởng đã duyệt) ───────────────────────────────
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
 * ── KHÔNG có tiêu đề "Gia phả họ …" trên thân trang ───────────────────────
 *
 * Măng-sét đã gánh danh tính rồi (`ThanhDieuHuong`). Lặp lại tên ở thân trang, cách nhau chưa tới
 * một trăm điểm ảnh, chính là chỗ đọc ra "chưa thuần nhất" — và nó ăn mất khoảng mở đầu mà cột
 * đời đang cần.
 *
 * ── Ba thứ cố ý KHÔNG thêm ────────────────────────────────────────────────
 *
 *   · **Không con số thứ ba** ở biến thể đã gắn. Trang có đúng hai: số đời tới gốc tạm, và số
 *     mảnh chưa nối. EXPERIENCE.md: *"Bảng chỉ số càng dài thì càng không ai đọc."*
 *   · **Không vẽ hai ô chưa tới lượt** (FR-22 lời giáo huấn, FR-41 sự kiện).
 *   · **Không đổ bóng, không gradient, không bo tròn chân dung.**
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChamTinCay } from "@/components/pha/tin-cay";
import { ChanTrang } from "@/components/pha/chan-trang";
import { KHUNG } from "@/components/pha/khung";
import { OTim } from "@/components/pha/o-tim";
import { TamPhim } from "@/components/pha/tam-phim";
import { ThanhDieuHuong, tenPhaTuThongTin } from "@/components/pha/thanh-dieu-huong";
import { TuaMuc } from "@/components/pha/vach";
import { getRecentAdditions } from "@/core/audit";
import { getClanInfo, resolveViewer } from "@/core/identity";
import { getAncestryPath, getClanOverview, type AncestryPath, type ClanOverview } from "@/core/tree";

/**
 * Nhãn chi hiển thị — "chi Hai", KHÔNG phải mã đường đi "1.3.2". Dẫn xuất lúc đọc từ khúc đầu
 * của `branchCode` (AD-5: không lưu, không cache): con của gốc tạm mang mã 1..n theo thứ tự
 * sinh, đúng cách dòng họ tự gọi các chi theo thứ tự ấy.
 */
const TEN_CHI = ["Nhất", "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Tám", "Chín", "Mười"];
function nhanChi(maChi: string | null): string | undefined {
  if (!maChi) return undefined;
  const dau = Number(maChi.split(".")[0]);
  if (!Number.isInteger(dau) || dau < 1) return undefined;
  return `chi ${TEN_CHI[dau - 1] ?? dau}`;
}

/**
 * Thời gian tương đối tiếng Việt, ngắn — cho dòng ghi công (FR-39). Đếm theo NGÀY LỊCH chứ không
 * theo 24 giờ tròn: "hôm qua" là chuyện của tờ lịch, không phải của đồng hồ.
 */
function thoiGianTuongDoi(luc: string, bayGio = new Date()): string {
  const at = new Date(luc);
  const ngayCua = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const chenh = Math.round((ngayCua(bayGio) - ngayCua(at)) / 86_400_000);
  if (chenh <= 0) return "hôm nay";
  if (chenh === 1) return "hôm qua";
  if (chenh < 30) return `${chenh} ngày trước`;
  if (chenh < 365) return `${Math.floor(chenh / 30)} tháng trước`;
  return `${Math.floor(chenh / 365)} năm trước`;
}

export default async function Page() {
  // CHỈ để chọn biến thể màn (đã gắn vào phả hay chưa) — dữ liệu vẫn do core tự resolve (AD-24).
  const viewer = await resolveViewer();
  // Không còn cả khách lẫn phả để xem — phả chưa dựng. Chỉ đăng nhập quản trị mới đi tiếp được.
  if (!viewer) redirect("/dang-nhap");

  const [tongQuanKq, vuaVaoKq, duongVeKq, thongTinPha] = await Promise.all([
    getClanOverview(),
    getRecentAdditions(8),
    viewer.personId !== null ? getAncestryPath(viewer.personId) : Promise.resolve(null),
    // AD-14: tên phả đọc từ `clan.settings` qua core/identity — không còn hằng trong mã.
    getClanInfo(),
  ]);
  const tenPha = tenPhaTuThongTin(thongTinPha.ok ? thongTinPha.value : null);

  // 'forbidden' / 'not-found' ⇒ vắng lặng lẽ, KHÔNG băng rôn lỗi (EXPERIENCE.md § State
  // Patterns): cột đời rơi về trạng thái mời, tổng quan rơi về rỗng.
  const tongQuan: ClanOverview | null = tongQuanKq.ok ? tongQuanKq.value : null;
  const vuaVao = vuaVaoKq.ok ? vuaVaoKq.value : [];
  const duongVe: AncestryPath | null = duongVeKq && duongVeKq.ok ? duongVeKq.value : null;

  const soManh = tongQuan?.unconnectedFragments.length ?? 0;

  // `steps` trả [mình … gốc]. Đảo lại để đọc TỪ TRÊN XUỐNG: cụ trước, mình sau.
  // Không phải sở thích bố cục — xuống là đi về phía sau, và hướng đọc mang nghĩa.
  const doiTruoc = duongVe ? [...duongVe.steps].reverse() : null;
  const goc = doiTruoc?.[0] ?? null;

  return (
    // `min-h-dvh` + `flex-col`: trang ngắn thì chân trang vẫn tụt xuống đáy thay vì lửng lơ giữa
    // màn — ở bề ngang thật đây là chỗ dễ lộ nhất.
    <div className="flex min-h-dvh flex-col">
      <main className={`${KHUNG} flex-1 pt-9 md:pt-32`}>
        {/* ── HAI CỘT BẮT ĐẦU Ở `lg`, KHÔNG PHẢI `md` (sửa 16/08/2026) ──────────────────
            Khung 768 − 64 lề − 288 rail − 48 khe = 368px cho cột chữ — thấp hơn tầm đọc
            510–640px của `khung.ts` gần một phần ba. Dời lên `lg` thì dải 768–1023px xếp chồng
            (một cột rộng 704px, đọc tốt), còn từ 1024px lưới bật với cột chữ 624px. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          {/* ══ CỘT ĐỜI — trái tim của trang ═══════════════════════════ */}
          <section>
            {/* ── Ô TÌM đứng ĐẦU TIÊN ────────────────────────────────────────────────────
                `EXPERIENCE.md § Key Flows` — Luồng 1: bước 1 mở web, **bước 2 gõ tên bố**. Tìm là
                nước đi tiếp theo của luồng chính, nên nó phải là thứ đầu tiên chạm tới được.
                Và FR-48 chốt *mọi đường vào việc thêm đều qua tìm*.
                MỘT ô, không phải bốn như các cổng đa dòng họ: một họ thì lọc theo họ là vô nghĩa. */}
            <OTim
              className="mb-9"
              href="/tim"
              goiY="Gõ tên để xem người ấy đã có trong phả chưa."
            />

            {duongVe && doiTruoc && goc ? (
              <>
                <TuaMuc
                  phu={
                    doiTruoc.length === 1
                      ? "gốc của tộc"
                      : nhanChi(doiTruoc[doiTruoc.length - 1].branchCode)
                  }
                >
                  Đường về cụ xa nhất hiện biết
                </TuaMuc>

                <ol className="mt-6">
                  {doiTruoc.map((n, i) => {
                    const laMinh = n.personId === viewer.personId;
                    const cuoi = i === doiTruoc.length - 1;
                    const tonNghi = n.confidence === "ton-nghi";
                    return (
                      <li key={n.personId} className="relative flex gap-4">
                        {/* Cột số đời — nhịp của một cuốn sổ, và là thứ neo mắt khi lướt.
                            Đời tính lúc đọc trong core (AD-5); null thì bỏ trống, không bịa. */}
                        <span className="w-12 shrink-0 pt-1 text-right text-[15px] tabular-nums text-muted-foreground">
                          {n.generation !== null ? `đời ${n.generation}` : ""}
                        </span>

                        {/* Nét dọc nối các đời: đường gáy sổ, không phải viền khối. Đoạn cuối cắt
                            đi để cột không thò xuống dưới tên chót. */}
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
                                      n.confidence === "chac-chan"
                                        ? "var(--color-tin-chac-chan)"
                                        : "var(--color-tin-loi-ke)",
                                  }
                            }
                          />
                        </span>

                        <div className={cuoi ? "pb-0" : "pb-7"}>
                          <p className="font-[family-name:var(--font-pha)] text-[21px] font-semibold leading-snug">
                            {n.fullName}
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
                            <ChamTinCay muc={n.confidence} />
                            {i === 0 && (
                              // FR-63: gốc TẠM, không phải khẳng định đã là Thuỷ tổ.
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
                  <span className="font-[family-name:var(--font-pha)]">{goc.fullName}</span> tới
                  đây.
                </p>
                {/* Đường nằm trong một mảnh rời — nói thật, không vẽ liền (FR-48/FR-63). */}
                {!duongVe.reachesMainRoot && (
                  <p className="mt-1.5 text-[15px] text-muted-foreground">
                    Đường này nằm trong một mảnh chưa nối được vào cây chính.
                  </p>
                )}
                {/* Con số thứ hai. FR-48 đòi hiện TRUNG THỰC số mảnh chưa nối. */}
                {soManh > 0 && (
                  <p className="mt-1.5 text-[15px] text-muted-foreground">
                    Còn {soManh} mảnh chưa nối được vào cây này — chưa ai tìm ra chỗ nối.
                  </p>
                )}
              </>
            ) : (
              <>
                {/* ══ CHƯA GẮN VÀO PHẢ — cột đời thành LỜI MỜI, vẫn là Ô ĐẦU ═══════════
                    EXPERIENCE.md § State Patterns — "Chưa gắn node": xem được phần công khai;
                    mọi hành động ghi dẫn về luồng tìm chỗ của mình, KHÔNG PHẢI màn lỗi. Cùng
                    tựa mục với biến thể đã gắn: đây là chính cái ô ấy, đang chờ một cái tên. */}
                <TuaMuc>Đường về cụ xa nhất hiện biết</TuaMuc>

                <div className="mt-6">
                  <p className="font-[family-name:var(--font-pha)] text-[21px] font-semibold leading-snug">
                    Tìm chỗ của mình trong phả
                  </p>
                  <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">
                    Đường về cụ sẽ hiện ở đây, đọc từ cụ xuống mình, khi đã tìm được tên của mình
                    trong phả. Bắt đầu bằng một lần gõ tên.
                  </p>
                </div>

                {/* Con số mời — tổng quan của phả, đã lọc riêng tư trong core. */}
                <div aria-hidden className="mt-7 h-px bg-border" />
                {tongQuan?.mainFragment ? (
                  <>
                    <p className="mt-4 text-[17px]">
                      <span className="font-semibold">
                        {tongQuan.mainFragment.personCount +
                          tongQuan.unconnectedFragments.reduce((s, f) => s + f.personCount, 0)}{" "}
                        người
                      </span>
                      {tongQuan.branches.length > 0 && (
                        <>
                          {" "}
                          trong{" "}
                          <span className="font-semibold">{tongQuan.branches.length} chi</span>
                        </>
                      )}{" "}
                      đã có mặt trong phả, tính từ{" "}
                      <span className="font-[family-name:var(--font-pha)]">
                        {tongQuan.mainFragment.rootName}
                      </span>
                      .
                    </p>
                    {soManh > 0 && (
                      <p className="mt-1.5 text-[15px] text-muted-foreground">
                        Còn {soManh} mảnh chưa nối được vào cây này — chưa ai tìm ra chỗ nối.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-[17px] text-muted-foreground">
                    Cuốn phả đang chờ những cái tên đầu tiên.
                  </p>
                )}
              </>
            )}

            {/* ══ HAI HÀNH ĐỘNG — NẰM TRONG CỘT TRÁI ═══════════════════════
                Nút là **câu kết của cột đời**, không phải chân trang của cả bố cục: đọc xong các
                đời, con số "N đời tới đây", rồi "còn N mảnh chưa nối" — thì hành động chính là
                câu trả lời cho đúng ba dòng vừa đọc.
                Kéo hết bề ngang là đúng trên điện thoại (ngón cái), sai trên máy — một nút rộng
                600px không đọc ra như nút. Chính = nền son; phụ = viền, nền trong (DESIGN.md § Nút).
                Cả hai đường vào việc THÊM đều qua màn tìm (FR-48 — chặn trùng tại nguồn). */}
            <div className="mt-12 md:flex md:gap-3">
              <Button asChild className="h-12 w-full text-[17px] md:w-auto md:px-8">
                <Link href="/tim">
                  {doiTruoc ? "Thêm người thân" : "Tìm chỗ của mình trong phả"}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="mt-2.5 h-12 w-full text-[17px] md:mt-0 md:w-auto md:px-8"
              >
                <Link href="/gia-pha/ca-toc">Xem cả tộc</Link>
              </Button>
            </div>
          </section>

          {/* ══ RAIL PHẢI — ghi chú lề + tranh chèn ════════════════════
              Trên máy đứng CẠNH cột đời: đây là bằng chứng dòng họ đang sống, đặt ngang hàng với
              đường về cụ thì hai thứ đọc ra một cặp. Rail giữ `stretch`: đường viền trái chạy hết
              chiều cao hàng — vạch chia cột của một trang sách, không phải viền của một cái hộp. */}
          <aside className="mt-12 lg:mt-0 lg:border-l lg:border-border lg:pl-8">
            <TuaMuc>Vừa vào phả</TuaMuc>

            {vuaVao.length > 0 ? (
              <ul className="mt-5 space-y-5">
                {/* FR-39 đọc ngược từ nhật ký sửa — KHÔNG cần FR-14. Mỗi dòng: tên + dòng ghi
                    công. Dòng ghi công là BẮT BUỘC, không phải trang trí: tên người đóng góp nằm
                    TRÊN PHẢ, không chỉ trong nhật ký (DESIGN.md § Components).
                    TODO (missing core API): `RecentAddition` chưa mang đời/chi/mức tin cậy, nên
                    hàng chưa vẽ được nhãn "đời 6 · chi Hai" và chất liệu tồn nghi như bản xưởng. */}
                {vuaVao.map((n) => (
                  <li key={n.personId} className="px-3.5 py-3">
                    <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold leading-snug">
                      {n.fullName}
                    </p>
                    <p className="mt-2 text-[15px] italic text-primary">
                      {n.byName} ghi · {thoiGianTuongDoi(n.at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              // Ngày 0 trung thực: ô lề trống nói việc của nó, không vẽ dữ liệu giả.
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                Những cái tên vừa được ghi vào phả sẽ hiện ở đây, kèm tên người ghi.
              </p>
            )}

            {/* ── TRANH CHÈN — dưới "Vừa vào phả": người mới cần đường lui, nhưng bằng chứng
                dòng họ đang sống mới là thứ trả công tức thì (FR-13). Rail đọc từ trên xuống
                theo đúng thứ tự ấy.
                TODO: video hướng dẫn chưa quay — `TamPhim` không `src` hiện ô kẻ chéo dành chỗ
                theo đúng quy ước dàn trang bản in. Gắn `src` + `poster` khi có phim thật. */}
            <TamPhim
              className="mt-10"
              chuThich="Phả này hoạt động thế nào"
              thoiLuong="1 phút 20"
            />
          </aside>
        </div>
      </main>

      <ChanTrang tenPha={tenPha} />
      <ThanhDieuHuong hienTai="trang-chu" tenPha={tenPha} />
    </div>
  );
}
