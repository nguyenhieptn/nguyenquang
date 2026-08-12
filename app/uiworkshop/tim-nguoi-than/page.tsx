/**
 * TÌM NGƯỜI THÂN — cửa vào của cả vòng lặp đóng góp.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture — Bề mặt A ("Tìm người thân", FR-11 + FR-48)
 *   · EXPERIENCE.md § Key Flows — Luồng 1, bước 2 (gõ tên bố) VÀ bước 6 (gõ tên anh trai)
 *   · EXPERIENCE.md § State Patterns — "Không tìm thấy" là màn RIÊNG, không phải trạng thái của đây
 *   · DESIGN.md § Components (dòng ghi công), § Nút (chính = son, phụ = viền)
 *
 * FR: FR-11 (tự khai · xem không cần đăng ký) · FR-48 (chặn bản trùng TẠI NGUỒN) · NFR-9 (khớp
 *     không dấu, đồng âm và cận âm)
 *
 * ── VÌ SAO MÀN NÀY ĐỨNG TRƯỚC MÀN "THÊM" ────────────────────────────────────────────────────
 * Không phải để tra cứu. Tìm là **thao tác chặn trùng**: mọi đường vào việc thêm người đều bắt
 * buộc đi qua đây trước, vì gỡ hai bản trùng ra khỏi nhau (FR-48) tốn gấp nhiều lần so với chặn
 * một lần gõ. Người dùng nghĩ mình đang tìm; hệ thống đang chặn.
 *
 * ── BA TRẠNG THÁI, VÀ VÌ SAO ĐỦ BA ──────────────────────────────────────────────────────────
 * Trạng thái thứ tư — "không tìm thấy" — KHÔNG nằm ở đây: nó là màn riêng (`khong-tim-thay`),
 * đúng chữ § State Patterns. Lý do là nó phải làm được nhiều hơn một dòng chữ rỗng.
 *
 * `?v=` chọn một trạng thái để bản đồ luồng nhúng đúng nhịp; không có `?v=` thì bày cả ba chồng
 * nhau cho người duyệt quét một lượt.
 */
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
import { NGUOI, doiCua, nhanChi, MANH, type Nguoi } from "../_mock/seed";

type TrangThai = "go-ten" | "thay-mot-nguoi" | "nhieu-trung-ten";

/** Ô tìm kiếm — HÌNH ẢNH, không phải form thật: xưởng là tĩnh, mock-only. */
function OTim({ tuKhoa }: { tuKhoa?: string }) {
  return (
    <div className="rounded-md border border-input bg-card px-4 py-3 md:px-5 md:py-4">
      <p className="text-[15px] text-muted-foreground">Tìm người thân</p>
      <p className="mt-0.5 font-[family-name:var(--font-pha)] text-[17px]">
        {tuKhoa ?? (
          <span className="text-muted-foreground">Gõ tên người cần tìm</span>
        )}
      </p>
    </div>
  );
}

/**
 * Một kết quả. ĐỜI + CHI là bắt buộc, ngang hàng với tên — không phải siêu dữ liệu trang trí:
 * trong một dòng họ trùng tên là chuyện thường, và chọn nhầm một người ở đây thành một liên kết
 * cha–con sai, hỏng phả của cả một chi.
 */
function KetQua({ n, ghiChu }: { n: Nguoi; ghiChu?: string }) {
  const tonNghi = n.tang === "ton-nghi";
  return (
    <Card
      className={tonNghi ? "van-ton-nghi gap-0 border-dashed py-3.5" : "gap-0 py-3.5"}
      style={tonNghi ? { borderColor: "var(--color-tin-ton-nghi)" } : undefined}
    >
      <CardBody className="px-4">
        <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
          {n.hoTen}
        </p>
        <p className="mt-0.5 text-[15px] text-muted-foreground">
          đời {doiCua(n.id)} · {nhanChi(n.id)}
          {n.namSinh ? ` · sinh ${n.namSinh}` : ""}
          {n.namMat ? ` · mất ${n.namMat}` : ""}
        </p>
        {n.nguoiThem && (
          <p className="mt-1.5 text-[15px] italic text-primary">
            {n.nguoiThem} ghi · {n.ngayThem}
          </p>
        )}
        {ghiChu && <p className="mt-1.5 text-[15px]">{ghiChu}</p>}
      </CardBody>
    </Card>
  );
}

/** Bước 2 của Luồng 1 — ô còn trống, chưa gõ gì. */
function GoTen() {
  return (
    <section>
      <OTim />
      {/* NFR-9 nói ra thành lời: người gõ không dấu trên điện thoại phải biết là vẫn tìm được,
          nếu không họ tự kết luận "phả không có" ngay ở lần gõ đầu. */}
      <p className="mt-3 text-[15px] text-muted-foreground">
        Gõ có dấu hay không dấu đều tìm được. Tên đọc gần giống cũng hiện ra.
      </p>

      <h1 className="mt-7 font-[family-name:var(--font-pha)] text-[23px]">
        Tìm trước khi thêm
      </h1>
      <p className="mt-2 text-[17px]">
        Phả đang có {MANH.reduce((s, m) => s + m.soNguoi, 0)} người. Tìm một lượt
        rồi hãy thêm — thêm trùng thì về sau phải gỡ ra, mà gỡ khó hơn nhiều.
      </p>

      <Button type="button" className="mt-5 h-12 w-full text-[17px]">
        Tìm
      </Button>
    </section>
  );
}

/**
 * Bước 6 của Luồng 1 — nhịp ngay trước cao trào: gõ tên anh trai, thấy ĐÚNG MỘT người.
 *
 * Đây là chỗ hệ thống trả lại công của bước 5. Không có nhịp này thì việc khai bố ở bước trước
 * chỉ là điền biểu mẫu; có nó, dòng họ nhận ra Khánh.
 *
 * Nút xác nhận là hành động CHÍNH (son) vì đây là việc duy nhất đáng làm trên màn — nhưng câu
 * hỏi phải hỏi rõ QUAN HỆ, không hỏi "đúng người này không": biết đúng người mà nối sai vai thì
 * cây vẫn hỏng.
 */
function ThayMotNguoi() {
  const anh = NGUOI.find((n) => n.id === "n-011")!;
  return (
    <section>
      <OTim tuKhoa="Nguyễn Quang Khoa" />
      <h1 className="mt-7 font-[family-name:var(--font-pha)] text-[23px]">
        Thấy một người
      </h1>
      <div className="mt-4">
        <KetQua n={anh} />
      </div>

      <p className="mt-5 text-[17px]">Người này là ai của mình?</p>
      <div className="mt-3 grid gap-2.5">
        <Button type="button" className="h-12 w-full text-[17px]">
          Anh ruột
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-[17px]"
        >
          Người khác — chọn quan hệ
        </Button>
      </div>
      {/* Nói trước điều sắp xảy ra. Người dùng đích không đoán được hệ quả của một lần bấm, và
          một liên kết cha–con sai là thứ tốn công nhất để gỡ. */}
      <p className="mt-3 text-[15px] text-muted-foreground">
        Xác nhận xong, hai người sẽ đứng cùng một nhánh trên cây. Sửa lại được
        về sau, nhưng phải nhờ ban tu phả.
      </p>
    </section>
  );
}

/**
 * Ca khó: hai người TRÙNG TÊN KHÍT. Không phải trạng thái hiếm — trong một dòng họ, tên đệm và
 * tên chính lặp lại theo đời là chuyện bình thường, đôi khi cố ý.
 *
 * Màn tuyệt đối không được đoán hộ. Ba thứ phân biệt được bày ngang nhau: đời, chi, năm.
 */
function NhieuTrungTen() {
  const trungTen = NGUOI.filter((n) => n.hoTen === "Nguyễn Quang Hùng");
  return (
    <section>
      <OTim tuKhoa="Nguyễn Quang Hùng" />
      <h1 className="mt-7 font-[family-name:var(--font-pha)] text-[23px]">
        Thấy {trungTen.length} người cùng tên
      </h1>
      <p className="mt-2 text-[17px]">
        Trong họ, trùng tên là chuyện thường. Xem đời và chi để biết là ai.
      </p>
      <ul className="mt-4 space-y-3">
        {trungTen.map((n) => (
          <li key={n.id}>
            <KetQua
              n={n}
              ghiChu={
                n.chaId
                  ? `con của ${NGUOI.find((x) => x.id === n.chaId)?.hoTen}`
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        className="mt-5 h-12 w-full text-[17px]"
      >
        Không ai trong số này
      </Button>
    </section>
  );
}

const NHAN: Record<TrangThai, string> = {
  "go-ten": "chưa gõ gì",
  "thay-mot-nguoi": "thấy đúng một người",
  "nhieu-trung-ten": "nhiều người trùng tên",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const chon = (["go-ten", "thay-mot-nguoi", "nhieu-trung-ten"] as const).find(
    (t) => t === v,
  );

  return (
    <>
      {/* Cố tình KHÔNG nới rộng trên máy (EXPERIENCE.md § Responsive): danh sách kết quả kéo
          ngang 1280px là khó đọc chứ không phải sang. */}
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-xl md:pb-16 md:pt-28">
        {chon ? (
          chon === "go-ten" ? (
            <GoTen />
          ) : chon === "thay-mot-nguoi" ? (
            <ThayMotNguoi />
          ) : (
            <NhieuTrungTen />
          )
        ) : (
          <>
            <GoTen />
            <hr className="my-10 border-border" />
            <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
              Trạng thái phụ · {NHAN["thay-mot-nguoi"]}
            </p>
            <ThayMotNguoi />
            <hr className="my-10 border-border" />
            <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
              Trạng thái phụ · {NHAN["nhieu-trung-ten"]}
            </p>
            <NhieuTrungTen />
            <hr className="my-10 border-border" />
            {/* Trạng thái thứ tư sống ở màn khác — nói rõ ra để người duyệt không đi tìm nó ở đây. */}
            <p className="text-[15px] text-muted-foreground">
              Không tìm thấy gì là một màn riêng, không phải một dòng chữ rỗng
              trên màn này —{" "}
              <a
                className="underline"
                href="/uiworkshop/khong-tim-thay"
                target="_top"
              >
                xem màn “Không tìm thấy”
              </a>
              .
            </p>
          </>
        )}
      </main>
      <ThanhDieuHuong hienTai="them" />
    </>
  );
}
