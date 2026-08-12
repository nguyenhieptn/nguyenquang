/**
 * ĐĂNG NHẬP & KHAI MÌNH LÀ AI — hai lớp tách rời, không phải một luồng đăng ký.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture — "Tài khoản ≠ người trong phả"
 *   · EXPERIENCE.md § Key Flows — Luồng 1, bước 4 ("tới đây MỚI cần xác thực")
 *   · EXPERIENCE.md § State Patterns — "Chưa gắn node" là trạng thái THƯỜNG TRỰC
 *   · DESIGN.md § Nút, § Do's and Don'ts (cấm từ kỹ thuật trên bề mặt A)
 *
 * FR: FR-64 (đăng nhập & quản lý người dùng) · FR-11 (xem cây không cần đăng ký) · FR-3 (ghi vào
 *     Tầng tồn nghi ngay, không chờ duyệt)
 *
 * ── VÌ SAO XÁC THỰC NẰM Ở ĐÂY, KHÔNG NẰM Ở CỬA ──────────────────────────────────────────────
 * FR-11 chốt xem cây không cần đăng ký, nên bắt đăng nhập ngay từ cửa là chặn đúng người sản
 * phẩm cần nhất: người vừa nghe về web ở buổi họp họ và chưa tin nó có gì. Luồng 1 đặt xác thực
 * ở **bước 4** — sau khi Khánh đã tìm, đã không thấy, và đã tự quyết định sẽ thêm bố. Lúc đó
 * việc tạo tài khoản có lý do, và lý do ấy là của người dùng chứ không phải của hệ thống.
 *
 * ── HAI LỚP, VÀ VÌ SAO KHÔNG ĐƯỢC GỘP ───────────────────────────────────────────────────────
 * Lớp 1 **tài khoản** chứng minh sở hữu một email hoặc số điện thoại — ai cũng làm được.
 * Lớp 2 **chỗ của mình trong phả** chứng minh *là người này trong dòng họ* — phải có người trong
 * họ bảo lãnh hoặc ban tu phả xác nhận.
 *
 * Gộp hai lớp thì hoặc là bất kỳ ai đăng ký xong đều nhận mình là một cụ trong phả, hoặc là phải
 * chờ duyệt mới được ghi gì — mà cái sau giết đúng FR-3. Tách ra thì lớp 1 mở ngay, lớp 2 chậm
 * mà không chặn ai.
 *
 * KHÔNG dùng chữ "node", "xác thực", "tài khoản đã kích hoạt" trên màn — bề mặt A cấm từ kỹ
 * thuật (DESIGN.md § Do's and Don'ts). Trong mã nguồn thì gọi đúng tên, đó là chuyện khác.
 */
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
import { NGUOI, doiCua, nhanChi } from "../_mock/seed";

type TrangThai = "tai-khoan" | "khai-minh-la-ai" | "chua-gan";

/** Ô nhập — hình ảnh, không phải form thật. */
function ONhap({
  nhan,
  giaTri,
  goiY,
}: {
  nhan: string;
  giaTri?: string;
  goiY?: string;
}) {
  return (
    <div className="rounded-md border border-input bg-card px-4 py-3">
      <p className="text-[15px] text-muted-foreground">{nhan}</p>
      <p className="mt-0.5 text-[17px]">
        {giaTri ?? <span className="text-muted-foreground">{goiY}</span>}
      </p>
    </div>
  );
}

/** LỚP 1 — tài khoản. Ngắn nhất có thể: mỗi trường thêm vào là một người bỏ dở. */
function TaiKhoan() {
  return (
    <section>
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
        Thêm bố vào phả
      </h1>
      {/* Nói rõ VÌ SAO đang bị hỏi, ngay dòng đầu. Một màn đăng nhập không có lý do là chỗ người
          dùng quay ra — và họ vừa mới quyết định đóng góp, đúng khoảnh khắc đắt nhất. */}
      <p className="mt-2 text-[17px]">
        Xem phả thì không cần gì cả. Nhưng ghi thêm người thì phả cần biết ai
        ghi — tên người ghi sẽ nằm luôn trên phả, cạnh người được ghi.
      </p>

      <div className="mt-6 grid gap-3">
        <ONhap nhan="Số điện thoại hoặc email" goiY="09xx xxx xxx" />
        <ONhap nhan="Họ tên" goiY="Nguyễn Quang Khánh" />
      </div>

      <Button type="button" className="mt-5 h-12 w-full text-[17px]">
        Gửi mã xác nhận
      </Button>
      <p className="mt-3 text-[15px] text-muted-foreground">
        Đã có tài khoản?{" "}
        <span className="underline">Đăng nhập bằng số điện thoại</span>
      </p>
    </section>
  );
}

/**
 * LỚP 2 — khai mình là ai trong họ.
 *
 * Đây KHÔNG phải một bước nữa của đăng ký: nó là một khẳng định về người thật, nên nó mang nguồn
 * và mang người bảo lãnh, y như mọi khẳng định khác (FR-1). Vẽ nó như một trường hồ sơ là làm
 * mất chính điều khiến nó khác.
 *
 * Ba đường, cố ý xếp theo mức chắc chắn giảm dần — và đường thứ ba (chưa biết) KHÔNG phải lối
 * thoát hiểm: nó là ca thật của người ở xa, biết tên cụ mà không biết mình thuộc chi nào.
 */
function KhaiMinhLaAi() {
  // Người trong ô "đã có trong phả" là KHOA (n-011), không phải Khánh.
  //
  // Sửa 12/08/2026 — ô này từng bày Khánh, và đó là mâu thuẫn với chính Luồng 1: Khánh CHƯA có
  // trong phả, đó là lý do anh phải tự khai. Người thật sự rơi vào ca "tên mình đã nằm sẵn trên
  // phả do người khác ghi" là Khoa — ban tu phả nạp tên anh từ khung nhập tay hồi 02/2026. Bày
  // nhầm người ở đây khiến hai đường trên màn đọc ra như nhau, và người duyệt không thấy được
  // rằng chúng dẫn tới hai hệ quả khác hẳn (một bên cần bảo lãnh, một bên ghi ngay).
  const daCoSan = NGUOI.find((n) => n.id === "n-011")!;
  return (
    <section>
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
        Mình là ai trong họ?
      </h1>
      <p className="mt-2 text-[17px]">
        Trả lời được thì phả nối được người mình ghi vào đúng nhánh, và ghi được
        ngay.
      </p>

      <div className="mt-6 grid gap-3">
        <Card className="gap-0 py-4">
          <CardBody className="px-4">
            <p className="text-[17px] font-semibold">Mình đã có trong phả</p>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Tìm tên mình rồi nhận. Cần một người trong họ xác nhận, hoặc ban
              tu phả duyệt.
            </p>
            <div className="mt-3 rounded-md border border-border bg-background px-3.5 py-3">
              <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                {daCoSan.hoTen}
              </p>
              <p className="mt-0.5 text-[15px] text-muted-foreground">
                đời {doiCua(daCoSan.id)} · {nhanChi(daCoSan.id)} · sinh{" "}
                {daCoSan.namSinh}
              </p>
              {/* Ai ghi tên này vào — người sắp nhận chỗ phải biết trước khi bấm, vì đó là thứ
                  quyết định họ sẽ thấy gì ở màn kế tiếp (FR-55). */}
              <p className="mt-1 text-[15px] italic text-primary">
                {daCoSan.nguoiThem} ghi · {daCoSan.ngayThem}
              </p>
            </div>
            <Button type="button" className="mt-3 h-12 w-full text-[17px]">
              Đây là mình
            </Button>
          </CardBody>
        </Card>

        <Card className="gap-0 py-4">
          <CardBody className="px-4">
            <p className="text-[17px] font-semibold">Mình chưa có trong phả</p>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Khai bốn câu là xong, rồi nhận luôn chỗ vừa khai.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-12 w-full text-[17px]"
            >
              Tự khai chỗ của mình
            </Button>
          </CardBody>
        </Card>

        {/* Đường thứ ba KHÔNG phải "ghi mà không cần nhận chỗ" — spine chốt ngược lại: chưa nhận
            chỗ thì chỉ xem được phần công khai, và mọi hành động ghi dẫn về đúng luồng này chứ
            không dẫn tới một màn lỗi (§ State Patterns › Chưa gắn node).

            Vì sao chặt ở đây mà không chặt ở cửa: mỗi dòng trên phả phải mang tên người ghi
            (FR-39), và tên ấy chỉ có nghĩa khi phả biết người ấy là ai trong họ. Một dòng mang
            tên "một tài khoản nào đó" thì vừa không tạo được tự hào, vừa không truy được về ai
            khi cần hỏi lại. */}
        <Card className="gap-0 py-4">
          <CardBody className="px-4">
            <p className="text-[17px] font-semibold">Chưa muốn khai gì lúc này</p>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Xem phả, tìm người thì vẫn đủ như trước. Lúc nào muốn ghi thêm ai
              vào phả thì quay lại đây — phả cần biết người ghi là ai trong họ,
              vì tên người ghi sẽ nằm luôn cạnh người được ghi.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-12 w-full text-[17px]"
            >
              Để sau, xem tiếp
            </Button>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

/**
 * TRẠNG THÁI THƯỜNG TRỰC — có tài khoản, chưa nhận chỗ của mình.
 *
 * § State Patterns gọi đây là trạng thái thường trực chứ không phải bước chuyển tiếp, và mọi màn
 * phải xử được nó. Nên nó KHÔNG được vẽ như một màn lỗi hay một hàng rào: xem thì vẫn xem đủ,
 * ghi thì vẫn ghi được vào Tầng tồn nghi (FR-3); thứ duy nhất còn thiếu là phần thưởng cá nhân —
 * đường ngược lên cụ của riêng mình (FR-13), thứ chỉ có nghĩa khi phả biết mình đứng ở đâu.
 */
function ChuaGan() {
  return (
    <section>
      <Card className="gap-0 py-4">
        <CardBody className="px-4">
          <p className="text-[17px] font-semibold">
            Phả chưa biết mình là ai trong họ
          </p>
          <p className="mt-1.5 text-[17px]">
            Xem phả và tìm người thì vẫn đủ như trước. Còn hai việc chưa làm
            được: ghi thêm người vào phả, và xem đường ngược lên cụ của riêng
            mình — cả hai đều cần phả biết mình đứng ở đâu đã.
          </p>
          <Button type="button" className="mt-4 h-12 w-full text-[17px]">
            Nhận chỗ của mình
          </Button>
        </CardBody>
      </Card>
      <p className="mt-3 text-[15px] text-muted-foreground">
        Tự khai chỗ của mình thì xong ngay, ghi vào phả luôn. Nhận một chỗ đã có
        sẵn thì cần một người trong họ xác nhận, có thể mất vài ngày.
      </p>
    </section>
  );
}

const NHAN: Record<TrangThai, string> = {
  "tai-khoan": "lớp 1 — tài khoản",
  "khai-minh-la-ai": "lớp 2 — chỗ của mình trong phả",
  "chua-gan": "trạng thái thường trực — có tài khoản, chưa nhận chỗ",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const chon = (["tai-khoan", "khai-minh-la-ai", "chua-gan"] as const).find(
    (t) => t === v,
  );

  return (
    <>
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-xl md:pb-16 md:pt-28">
        {chon === "khai-minh-la-ai" ? (
          <KhaiMinhLaAi />
        ) : chon === "chua-gan" ? (
          <ChuaGan />
        ) : chon === "tai-khoan" ? (
          <TaiKhoan />
        ) : (
          <>
            <TaiKhoan />
            <hr className="my-10 border-border" />
            <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
              {NHAN["khai-minh-la-ai"]}
            </p>
            <KhaiMinhLaAi />
            <hr className="my-10 border-border" />
            <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
              {NHAN["chua-gan"]}
            </p>
            <ChuaGan />
          </>
        )}
      </main>
      <ThanhDieuHuong hienTai="toi" />
    </>
  );
}
