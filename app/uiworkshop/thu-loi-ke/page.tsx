/**
 * THU LỜI KỂ — việc duy nhất của sản phẩm có hạn dùng.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture — "Thu lời kể | FR-47, FR-49 | Đồng thuận nằm
 *     TRONG luồng thu, không phải màn riêng"
 *   · EXPERIENCE.md § Interaction Primitives — "một nút to, một trạng thái đang ghi, một nút
 *     dừng. Không dạng sóng, không cắt ghép — thu là việc bây giờ, bóc tách là việc sau"
 *   · DESIGN.md § Brand & Style (không icon tròn màu mè), § Nút
 *
 * FR: FR-47 (thu và lưu lời kể) · FR-49 (đồng thuận cho lời kể)
 *
 * ── VÌ SAO MÀN NÀY KHÔNG ĐƯỢC PHỨC TẠP ──────────────────────────────────────────────────────
 * Người cầm điện thoại ở đây thường là con cháu, nhưng người đang nói là cụ 84 tuổi ngồi đối
 * diện — và cụ sẽ ngừng kể ngay khi thấy người kia loay hoay với máy. Mỗi nút thêm vào màn này
 * là một lần ngắt mạch câu chuyện. Đó là lý do § Interaction Primitives cấm dạng sóng và cắt
 * ghép: không phải vì khó làm, mà vì chúng mời người ta nghịch máy giữa lúc phải nghe.
 *
 * ── VÌ SAO ĐỒNG THUẬN NẰM TRONG LUỒNG, KHÔNG PHẢI MÀN RIÊNG ─────────────────────────────────
 * FR-49 chỉ có nghĩa nếu người kể **đang còn ngồi đó** khi câu hỏi được hỏi. Tách ra thành một
 * màn cài đặt là hỏi sau khi cụ đã về — và lúc ấy người trả lời là con cháu, không phải người có
 * quyền trả lời. Nên câu hỏi đồng thuận đứng ngay sau nút dừng, trước khi bản thu được lưu.
 *
 * ⚠️ NỢ TÀI LIỆU: hành trình gốc của việc này (UJ-1 — bà Nhàn 84 tuổi, cháu Quân) đã mất khi PRD
 * được viết lại. PRD từng gắn nhãn đây là "hành trình quan trọng nhất của sản phẩm". Màn dưới đây
 * dựng từ § IA và § Interaction Primitives, KHÔNG từ một câu chuyện có thật — nên nó đúng luật mà
 * chưa chắc đúng nhịp. Cần người duyệt kể lại một lần thu thật. Xem EXPERIENCE.md § Luồng chưa
 * distill.
 */
import { Mic, Square } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
import {
  LOI_KE,
  NGUOI,
  GIO_GHI_AM,
  NHAN_TIEP_CAN,
  doDai,
} from "../_mock/seed";

type TrangThai = "san-sang" | "dang-ghi" | "dong-thuan" | "da-thu";

/** SẴN SÀNG — một nút, và không có gì khác để bấm nhầm. */
function SanSang() {
  return (
    <section>
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
        Thu lời kể
      </h1>
      <p className="mt-2 text-[17px]">
        Cứ để các cụ kể tự nhiên. Không cần đúng thứ tự, không cần đầy đủ — nghe
        được câu nào là dòng họ giữ được câu ấy.
      </p>

      {/* Nút to hơn mọi nút khác trong sản phẩm. Vùng chạm 44px là sàn; ở đây người bấm thường
          đang vừa cầm máy vừa nhìn người đối diện, nên nút phải bấm trúng mà không cần nhìn. */}
      <button
        type="button"
        className="mt-7 flex min-h-24 w-full items-center justify-center gap-3 rounded-lg bg-primary px-6 text-primary-foreground"
      >
        <Mic size={28} strokeWidth={2} aria-hidden />
        <span className="text-[19px] font-semibold">Bắt đầu thu</span>
      </button>

      <p className="mt-4 text-[17px] text-muted-foreground">
        Thu xong sẽ hỏi một câu: ai được nghe bản này. Người kể tự chọn.
      </p>
    </section>
  );
}

/**
 * ĐANG GHI — đúng ba thứ: biết là đang ghi, biết đã bao lâu, dừng được.
 *
 * Đồng hồ chạy là thứ duy nhất động trên màn. Không dạng sóng: dạng sóng đẹp nhưng nó kéo mắt
 * người cầm máy xuống màn hình đúng lúc phải nhìn người đang kể.
 */
function DangGhi() {
  return (
    <section>
      <div className="flex items-center gap-2.5">
        <span
          className="size-3 rounded-full bg-primary"
          aria-hidden
        />
        {/* Trạng thái không bao giờ mã hoá chỉ bằng màu — chấm son đi kèm chữ. */}
        <p className="text-[17px] font-semibold">Đang thu</p>
      </div>

      <p className="mt-6 font-mono text-[44px] tabular-nums leading-none">
        6:12
      </p>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Cụ Nguyễn Thị Lành kể · thu ngày 12/08/2026
      </p>

      <button
        type="button"
        className="mt-7 flex min-h-24 w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-6"
      >
        <Square size={26} strokeWidth={2} aria-hidden />
        <span className="text-[19px] font-semibold">Dừng và lưu</span>
      </button>

      <p className="mt-4 text-[17px] text-muted-foreground">
        Dừng giữa chừng không mất gì. Kể tiếp thì thu thêm bản nữa.
      </p>
    </section>
  );
}

/**
 * ĐỒNG THUẬN (FR-49) — câu hỏi cuối của luồng thu, hỏi khi người kể còn ngồi đó.
 *
 * KHÔNG cái nào được chọn sẵn. Chọn sẵn "cả họ nghe được" là quyết hộ người vừa kể một chuyện có
 * thể chưa từng kể cho ai; chọn sẵn "niêm phong" là chôn một chuyện lẽ ra dòng họ nên biết. Cả
 * hai đều là quyết định của người kể, và câu hỏi này là lần duy nhất họ được hỏi.
 */
function DongThuan() {
  return (
    <section>
      <p className="text-[15px] uppercase tracking-wider text-muted-foreground">
        Đã thu 6 phút 12 giây
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-pha)] text-[23px]">
        Ai được nghe bản này?
      </h1>
      <p className="mt-2 text-[17px]">
        Hỏi người vừa kể, không tự quyết. Đổi lại được bất cứ lúc nào.
      </p>

      <div className="mt-6 grid gap-2.5">
        <button
          type="button"
          className="flex min-h-14 w-full flex-col items-start justify-center rounded-md border border-input bg-card px-4 py-3.5 text-left"
        >
          <span className="text-[17px] font-semibold">
            {NHAN_TIEP_CAN["cong-khai"]}
          </span>
          <span className="text-[15px] text-muted-foreground">
            hiện trên trang của những người được nhắc tới
          </span>
        </button>
        <button
          type="button"
          className="flex min-h-14 w-full flex-col items-start justify-center rounded-md border border-input bg-card px-4 py-3.5 text-left"
        >
          <span className="text-[17px] font-semibold">
            {NHAN_TIEP_CAN["chi-quan-tri"]}
          </span>
          <span className="text-[15px] text-muted-foreground">
            dùng để đối chiếu khi ghi phả, không mở cho cả họ
          </span>
        </button>
        <button
          type="button"
          className="flex min-h-14 w-full flex-col items-start justify-center rounded-md border border-input bg-card px-4 py-3.5 text-left"
        >
          <span className="text-[17px] font-semibold">
            {NHAN_TIEP_CAN["niem-phong"]}
          </span>
          <span className="text-[15px] text-muted-foreground">
            chọn một năm mở — không ai mở sớm được, kể cả ban tu phả
          </span>
        </button>
      </div>

      <p className="mt-5 text-[17px] text-muted-foreground">
        Chưa chọn thì bản thu vẫn được giữ, và chưa ai nghe được.
      </p>
    </section>
  );
}

/** ĐÃ THU — sổ của người đi thu. Tổng giờ là chỉ số M3 của PRD §9, không phải trang trí. */
function DaThu() {
  return (
    <section>
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
        Đã thu được
      </h1>
      <p className="mt-1 text-[17px] text-muted-foreground">
        {LOI_KE.length} bản · {GIO_GHI_AM.toFixed(1)} giờ
      </p>

      <ul className="mt-5 grid gap-3">
        {LOI_KE.map((l) => {
          const nguoiKe = NGUOI.find((x) => x.id === l.nguoiKeId);
          return (
            <li key={l.id}>
              <Card className="gap-0 py-3.5">
                <CardBody className="px-4">
                  <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                    {nguoiKe?.hoTen} kể
                  </p>
                  <p className="mt-0.5 text-[15px] text-muted-foreground">
                    {doDai(l.thoiLuong)} · {l.ngayThu}
                  </p>
                  <p className="mt-1.5 text-[15px]">
                    {NHAN_TIEP_CAN[l.tiepCan]}
                    {l.moNiemPhongNam ? ` tới ${l.moNiemPhongNam}` : ""}
                  </p>
                  <p className="mt-1.5 text-[15px] text-muted-foreground">
                    Nhắc tới:{" "}
                    {l.noiVe
                      .map((id) => NGUOI.find((x) => x.id === id)?.hoTen)
                      .join(" · ")}
                  </p>
                  {/* Bóc tách là việc SAU, và màn này nói thẳng điều đó thay vì im lặng — im lặng
                      khiến người đi thu tưởng mình còn phải làm gì nữa mới xong. */}
                  {!l.daBocTach && (
                    <p className="mt-1.5 text-[15px] text-muted-foreground">
                      Chưa bóc tách thành các dòng trong phả — việc để sau, bản
                      thu đã an toàn.
                    </p>
                  )}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>

      <Button type="button" className="mt-6 h-12 w-full text-[17px]">
        Thu bản mới
      </Button>
    </section>
  );
}

const MAN: Record<TrangThai, { nhan: string; Ve: () => React.ReactElement }> = {
  "san-sang": { nhan: "sẵn sàng", Ve: SanSang },
  "dang-ghi": { nhan: "đang thu", Ve: DangGhi },
  "dong-thuan": { nhan: "đồng thuận — FR-49, trong luồng thu", Ve: DongThuan },
  "da-thu": { nhan: "sổ bản đã thu", Ve: DaThu },
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
      <ThanhDieuHuong hienTai="loi-ke" />
    </>
  );
}
