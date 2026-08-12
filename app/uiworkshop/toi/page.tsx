/**
 * TÔI — tài khoản, chỗ của mình trong phả, và quyền của người sống.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture — "Tài khoản ≠ người trong phả" (hai lớp)
 *   · EXPERIENCE.md § State Patterns — "Vừa được thêm bởi người khác (FR-55)": thông báo LƯU SẴN
 *     trên node, hiện ra lần đầu người đó đăng nhập và gắn được vào chỗ của mình, kèm BA đường —
 *     sửa · ẩn khỏi phần công khai (vẫn giữ liên kết phả hệ) · từ chối xuất hiện trong bản in
 *   · EXPERIENCE.md § Điều hướng gốc — mục "Tôi" gánh FR-64 và FR-55
 *
 * FR: FR-64 (đăng nhập & quản lý người dùng) · FR-55 (quyền của người sống) · FR-39 (nhật ký sửa
 *     — đọc ngược thành "đóng góp của mình")
 *
 * ── VÌ SAO THÔNG BÁO FR-55 LÀ THỨ ĐẦU TIÊN TRÊN MÀN ─────────────────────────────────────────
 * Vì nó là thứ duy nhất trên màn này có **người khác** làm chủ động. Mọi mục còn lại là việc
 * mình tự làm và có thể làm bất cứ lúc nào; còn việc ai đó đã ghi về mình thì đã xảy ra rồi, và
 * lần đăng nhập đầu tiên là cơ hội đầu tiên — có khi là duy nhất — để người ấy được biết.
 *
 * Ba đường phải bày ngang nhau, KHÔNG được xếp "sửa" to còn "từ chối" thành một dòng chữ nhỏ ở
 * dưới. Nếu quyền từ chối khó tìm hơn quyền sửa thì đó không còn là quyền.
 *
 * ⚠️ GIỚI HẠN ĐÃ CHẤP NHẬN, MANG XUỐNG EPIC — cơ chế này là **kéo**. Người không bao giờ mở web
 * thì không bao giờ biết mình đã bị đưa vào phả, mà đó chính là nhóm cao niên FR-55 sinh ra để
 * bảo vệ. PRD §12 đã tự thú ở tầng sản phẩm. Đừng để story nào ngầm hiểu rằng FR-55 đã xong.
 */
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
import {
  NGUOI,
  NHAT_KY,
  THONG_BAO_NODE,
  doiHienThi,
  nhanChi,
  duongVeGoc,
} from "../_mock/seed";

type TrangThai = "vua-gan" | "thuong-ngay";

/**
 * LẦN ĐẦU GẮN ĐƯỢC VÀO CHỖ CỦA MÌNH — thông báo FR-55 bật ra.
 *
 * Nhân vật ở đây là Khoa (anh trai Khánh): ban tu phả nạp tên anh từ khung nhập tay hồi 02/2026,
 * rồi hôm nay Khánh nối anh vào cụ Hùng. Cả hai việc đều xảy ra khi anh không có mặt.
 */
function VuaGan() {
  const tb = THONG_BAO_NODE[0];
  const nguoi = NGUOI.find((n) => n.id === tb.veNguoiId)!;

  return (
    <section>
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
        Phả đã có tên mình từ trước
      </h1>
      <p className="mt-2 text-[17px]">
        {tb.nguoiThem} ghi vào {tb.khi}, khi chưa hỏi được. Từ giờ, phần về mình
        thì mình quyết.
      </p>

      {/* Kể ra HẾT những gì người khác đã ghi, kèm ai ghi và khi nào. Tóm tắt là giấu bớt — mà
          người sống chỉ quyết được về thứ họ nhìn thấy. */}
      <Card className="mt-5 gap-0 py-4">
        <CardBody className="px-4">
          <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold">
            {nguoi.hoTen}
          </p>
          <p className="mt-0.5 text-[15px] text-muted-foreground">
            đời {doiHienThi(nguoi.id)} · {nhanChi(nguoi.id)}
          </p>
          <ul className="mt-3 grid gap-2">
            {tb.daGhi.map((d) => (
              <li key={d.menhDe} className="text-[17px]">
                {d.menhDe}
                <span className="block text-[15px] text-muted-foreground">
                  {d.boi} ghi · {d.khi}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* BA ĐƯỜNG, ngang nhau. "Từ chối in" không được nhỏ hơn "sửa" — xem đầu file. */}
      <div className="mt-5 grid gap-2.5">
        <Button type="button" className="h-12 w-full text-[17px]">
          Sửa lại cho đúng
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-[17px]"
        >
          Ẩn khỏi phần cả họ xem được
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-[17px]"
        >
          Không in tên mình trong bản in
        </Button>
      </div>

      {/* Nói rõ hệ quả của "ẩn": liên kết phả hệ GIỮ NGUYÊN. Không nói thì người ta sợ rằng ẩn
          mình đi là làm đứt nhánh con cháu, và sẽ không dám dùng quyền của mình. */}
      <p className="mt-4 text-[17px] text-muted-foreground">
        Ẩn thì tên không hiện với cả họ, nhưng nhánh vẫn liền: con cháu vẫn nối
        được ngược lên các cụ qua chỗ của mình.
      </p>

      <Button
        type="button"
        variant="outline"
        className="mt-5 h-12 w-full text-[17px]"
      >
        Để nguyên như đang ghi
      </Button>
    </section>
  );
}

/**
 * TRẠNG THÁI THƯỜNG NGÀY — nhân vật là Khánh, đã nhận chỗ của mình.
 *
 * Ô "Mình đã ghi được" đọc NGƯỢC nhật ký sửa (FR-39): cùng một dữ liệu vẽ ô "Vừa vào phả" ở màn
 * chủ, chỉ khác góc nhìn. Đây là chỗ tên người đóng góp quay về với chính họ — cơ chế tạo tự hào
 * ở tầng dữ liệu, không phải một trang thống kê.
 */
function ThuongNgay() {
  const toi = NGUOI.find((n) => n.id === "n-010")!;
  const duong = duongVeGoc(toi.id);
  const daGhi = NHAT_KY.filter((m) => m.nguoiLam === "cháu Khánh");

  return (
    <section>
      <h1 className="font-[family-name:var(--font-pha)] text-[27px] leading-tight">
        {toi.hoTen}
      </h1>
      <p className="mt-1 text-[17px] text-muted-foreground">
        đời {doiHienThi(toi.id)} · {nhanChi(toi.id)} · sinh {toi.namSinh}
      </p>

      <Card className="mt-5 gap-0 py-4">
        <CardBody className="px-4">
          <p className="text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
            Chỗ của mình trong phả
          </p>
          <p className="mt-1.5 font-[family-name:var(--font-pha)] text-[17px] font-semibold">
            {duong.length} đời tới {duong[duong.length - 1]?.hoTen}
          </p>
          <p className="mt-1 text-[15px] text-muted-foreground">
            đã nhận · ban tu phả xác nhận 12/08/2026
          </p>
        </CardBody>
      </Card>

      <h2 className="mb-2 mt-7 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
        Mình đã ghi được
      </h2>
      <ul className="grid gap-2">
        {daGhi.map((m) => {
          const ve = NGUOI.find((n) => n.id === m.veNguoiId);
          return (
            <li key={m.id} className="text-[17px]">
              {m.viec}
              <span className="block text-[15px] text-muted-foreground">
                {ve?.hoTen} · {m.khi}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[17px] text-muted-foreground">
        Những dòng này mang tên mình trên phả, và ở lại đó.
      </p>

      <h2 className="mb-2 mt-7 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
        Phần về mình
      </h2>
      <div className="grid gap-2.5">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-[17px]"
        >
          Sửa thông tin về mình
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-[17px]"
        >
          Ai xem được gì về mình
        </Button>
      </div>

      <h2 className="mb-2 mt-7 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
        Tài khoản
      </h2>
      <p className="text-[17px]">0912 345 678</p>
      <p className="mt-3 text-[17px] text-muted-foreground underline">
        Đăng xuất
      </p>
    </section>
  );
}

const MAN: Record<TrangThai, { nhan: string; Ve: () => React.ReactElement }> = {
  "vua-gan": {
    nhan: "lần đầu nhận được chỗ của mình — thông báo FR-55",
    Ve: VuaGan,
  },
  "thuong-ngay": { nhan: "thường ngày — đã nhận chỗ", Ve: ThuongNgay },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const chon = (Object.keys(MAN) as TrangThai[]).find((t) => t === v);

  return (
    <>
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-xl md:pb-16 md:pt-28">
        {chon ? (
          MAN[chon].Ve()
        ) : (
          (Object.keys(MAN) as TrangThai[]).map((t, i) => (
            <div key={t}>
              {i > 0 && (
                <>
                  <hr className="my-10 border-border" />
                  <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
                    {MAN[t].nhan}
                  </p>
                </>
              )}
              {MAN[t].Ve()}
            </div>
          ))
        )}
      </main>
      <ThanhDieuHuong hienTai="toi" />
    </>
  );
}
