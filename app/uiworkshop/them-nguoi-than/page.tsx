/**
 * THÊM NGƯỜI THÂN — tự khai bốn bước, một câu hỏi một màn.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture — "Tự khai — 4 bước | FR-11 | Một câu hỏi một màn"
 *   · EXPERIENCE.md § Interaction Primitives — "Một câu hỏi một màn. RÀNG BUỘC CỨNG."
 *   · EXPERIENCE.md § Key Flows — Luồng 1, bước 5 (vào thẳng Tầng tồn nghi, hiện ngay)
 *   · EXPERIENCE.md § Vừa được thêm bởi người khác (FR-55) — nghĩa vụ phát sinh ngay tại bước 3
 *   · DESIGN.md § Layout & Spacing (một câu hỏi một màn là ràng buộc BỐ CỤC), § Components
 *
 * FR: FR-11 (tự khai) · FR-3 (ghi thẳng vào Tầng tồn nghi, KHÔNG chờ duyệt) · FR-1 (mọi khẳng
 *     định mang nguồn) · FR-39 (ghi công) · FR-55 (quyền của người sống) · NFR-5 (≤ 4 màn, ≤ 3 phút)
 *
 * ── NGÂN SÁCH MÀN, ĐẾM CHO ĐÚNG ─────────────────────────────────────────────────────────────
 * NFR-5 cho phép **4 màn** để thêm một người. Bốn câu hỏi dùng hết đúng ngân sách ấy — nghĩa là
 * không còn chỗ cho một câu thứ năm, dù câu ấy hữu ích tới đâu. Màn "đã vào phả" ở cuối KHÔNG
 * tính vào ngân sách: nó không hỏi gì, nó trả công. Bỏ nó đi mới là hỏng, vì lúc đó người vừa
 * đóng góp không thấy việc mình làm hiện ra ở đâu cả.
 *
 * Hệ quả thực hành: câu hỏi nào muốn thêm sau này phải ĐẨY MỘT CÂU KHÁC RA. Bốn câu dưới đây là
 * bốn câu tối thiểu để một người có mặt trên cây mà vẫn mang nguồn: quan hệ (để nối), tên (để
 * gọi), năm (để phân biệt người trùng tên), nguồn (để FR-1 không rỗng).
 *
 * ── VÌ SAO CÂU 4 LÀ NGUỒN, KHÔNG PHẢI ẢNH HAY NƠI Ở ─────────────────────────────────────────
 * FR-1 nói mọi khẳng định mang nguồn. Không hỏi nguồn thì hoặc là hệ thống tự bịa một nguồn, hoặc
 * là có những khẳng định không nguồn — cả hai đều làm hỏng chính thứ phân biệt phả này với một
 * danh bạ. Hỏi ở bước cuối vì lúc ấy người khai đã kể xong và câu hỏi đọc ra tự nhiên.
 *
 * `?v=b1…b4|xong` chọn một bước cho bản đồ luồng; không có `?v=` thì bày cả năm màn chồng nhau.
 */
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
import { NGUOI, doiCua, nhanChi } from "../_mock/seed";

type Buoc = "b1" | "b2" | "b3" | "b4" | "xong";

/**
 * Thanh nhịp — "Câu 2 / 4". Chữ, không phải một dãy chấm: dãy chấm là câu đố với người ít dùng
 * máy, và § Accessibility Floor cấm mã hoá trạng thái chỉ bằng hình.
 */
function Nhip({ so }: { so: number }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="text-[15px] font-semibold uppercase tracking-wider text-muted-foreground">
        Câu {so} / 4
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

function CauHoi({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-[family-name:var(--font-pha)] text-[23px]">{children}</h1>
  );
}

/** Lựa chọn to — vùng chạm 44px là sàn, ở đây rộng hơn vì người dùng đích có tay run. */
function OChon({ children, phu }: { children: React.ReactNode; phu?: string }) {
  return (
    <button
      type="button"
      className="flex min-h-14 w-full flex-col items-start justify-center rounded-md border border-input bg-card px-4 py-3 text-left"
    >
      <span className="text-[17px]">{children}</span>
      {phu && <span className="text-[15px] text-muted-foreground">{phu}</span>}
    </button>
  );
}

function ONhap({ nhan, goiY }: { nhan: string; goiY: string }) {
  return (
    <div className="rounded-md border border-input bg-card px-4 py-3">
      <p className="text-[15px] text-muted-foreground">{nhan}</p>
      <p className="mt-0.5 font-[family-name:var(--font-pha)] text-[17px] text-muted-foreground">
        {goiY}
      </p>
    </div>
  );
}

function NutTiep({ nhan = "Tiếp" }: { nhan?: string }) {
  return (
    <Button type="button" className="mt-6 h-12 w-full text-[17px]">
      {nhan}
    </Button>
  );
}

/** CÂU 1 — quan hệ. Hỏi trước vì nó quyết định người mới nối vào đâu; hỏi sau thì phải quay lại. */
function B1() {
  return (
    <section>
      <Nhip so={1} />
      <CauHoi>Người này là ai của mình?</CauHoi>
      <div className="mt-5 grid gap-2.5">
        <OChon>Bố</OChon>
        <OChon>Mẹ</OChon>
        <OChon>Anh hoặc chị</OChon>
        <OChon>Em</OChon>
        <OChon>Con</OChon>
        <OChon>Vợ hoặc chồng</OChon>
        <OChon phu="ông bà, cô dì chú bác, cháu…">Quan hệ khác</OChon>
      </div>
    </section>
  );
}

/**
 * CÂU 2 — tên. Ô tên huý CHỈ hiện khi bước 3 trả lời "đã mất"; ở đây nói trước để người khai
 * không phải đoán. Hỏi tên huý của người còn sống là sai lễ, không chỉ là thừa một ô.
 */
function B2() {
  return (
    <section>
      <Nhip so={2} />
      <CauHoi>Tên đầy đủ là gì?</CauHoi>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Ghi như tên vẫn gọi trong nhà cũng được. Sửa lại được về sau.
      </p>
      <div className="mt-5">
        <ONhap nhan="Họ và tên" goiY="Nguyễn Quang Hùng" />
      </div>
      <NutTiep />
    </section>
  );
}

/**
 * CÂU 3 — còn sống hay đã mất.
 *
 * Đây là chỗ FR-55 và FR-37 phát sinh nghĩa vụ, nên câu trả lời "còn sống" phải kéo theo một câu
 * nói rõ hệ quả NGAY TẠI ĐÂY, không đẩy xuống một trang điều khoản. Người đang được ghi vào phả
 * không có mặt để tự bảo vệ mình; người khai là người duy nhất đọc được câu này.
 *
 * Và chỉ hỏi NĂM, không hỏi ngày tháng, với người còn sống — mặc định riêng tư của PRD §11.
 */
function B3() {
  return (
    <section>
      <Nhip so={3} />
      <CauHoi>Còn sống hay đã mất?</CauHoi>
      <div className="mt-5 grid gap-2.5">
        <OChon phu="chỉ hỏi năm sinh">Còn sống</OChon>
        <OChon phu="hỏi năm sinh, năm mất và tên huý">Đã mất</OChon>
        <OChon phu="ghi được luôn, để trống phần năm">Không rõ</OChon>
      </div>

      <div className="mt-5">
        <ONhap nhan="Năm sinh" goiY="1975" />
      </div>

      {/* Khối chàm = ghi chú của hệ thống, KHÔNG phải cảnh báo lỗi (DESIGN.md § Cảnh báo là chàm
          mực). Ở đây không có gì hỏng — chỉ có một hệ quả người khai cần biết trước khi bấm. */}
      <div
        className="mt-5 border-l-4 px-4 py-3.5"
        style={{
          backgroundColor: "var(--color-canh-bao-nen)",
          borderColor: "var(--destructive)",
        }}
      >
        <p className="text-[17px] font-semibold">Người còn sống tự quyết về mình</p>
        <p className="mt-1 text-[17px]">
          Ghi về người đang sống thì người đó, khi vào phả, sẽ thấy đúng những gì
          đã ghi và tự sửa, tự ẩn, hoặc từ chối có tên trong bản in. Chỉ hiện năm
          sinh, không hiện ngày tháng.
        </p>
      </div>
      <NutTiep />
    </section>
  );
}

/**
 * CÂU 4 — nguồn (FR-1).
 *
 * Các lựa chọn cố ý xếp theo mức tin cậy giảm dần và NÓI RA mức ấy: người khai cần thấy rằng câu
 * trả lời của mình quyết định người này hiện ra trên cây với chất liệu nào. Giấu mối liên hệ đó
 * đi thì mức tin cậy thành thứ hệ thống tự dán, và FR-2 mất nghĩa.
 */
function B4() {
  return (
    <section>
      <Nhip so={4} />
      <CauHoi>Biết điều này từ đâu?</CauHoi>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Phả ghi cả điều biết và chỗ biết. Không có câu trả lời nào là sai.
      </p>
      <div className="mt-5 grid gap-2.5">
        <OChon phu="lên mức chắc chắn">Có giấy tờ, bia mộ hoặc ảnh chụp</OChon>
        <OChon phu="lên mức theo lời kể">Nghe người trong họ kể</OChon>
        <OChon phu="ở mức tồn nghi">Người trong nhà, mình biết rõ</OChon>
        <OChon phu="ở mức tồn nghi">Nhớ mang máng, chưa chắc</OChon>
      </div>
      <NutTiep nhan="Ghi vào phả" />
    </section>
  );
}

/**
 * MÀN TRẢ CÔNG — không hỏi gì, nên không tính vào ngân sách 4 màn của NFR-5.
 *
 * Ba việc phải làm cùng lúc, thiếu một là hỏng:
 *   1. Cho thấy người vừa khai ĐÃ ở trên phả rồi — FR-3, không chờ duyệt, không hàng đợi.
 *   2. Giải nghĩa "tồn nghi" ngay tại chỗ, lần đầu từ này xuất hiện (DESIGN.md § Do's).
 *   3. Đẩy tiếp một bước — Luồng 1 chưa xong ở đây; cao trào nằm ở bước tìm anh trai kế tiếp.
 */
function Xong() {
  const bo = NGUOI.find((n) => n.id === "n-009")!;
  return (
    <section>
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
        Đã vào phả
      </h1>
      <p className="mt-2 text-[17px]">
        Hiện ngay, không phải chờ ai duyệt. Tên người ghi nằm luôn trên phả.
      </p>

      <Card
        className="van-ton-nghi mt-5 gap-0 border-dashed py-4"
        style={{ borderColor: "var(--color-tin-ton-nghi)" }}
      >
        <CardBody className="px-4">
          <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold">
            {bo.hoTen}
          </p>
          <p className="mt-0.5 text-[15px] text-muted-foreground">
            đời {doiCua(bo.id)} · {nhanChi(bo.id)} · sinh {bo.namSinh} ·
            tồn nghi
          </p>
          <p className="mt-1.5 text-[15px] italic text-primary">
            {bo.nguoiThem} ghi · {bo.ngayThem}
          </p>
        </CardBody>
      </Card>

      {/* Chú giải tại chỗ cho từ phả học, ngay lần đầu nó xuất hiện. Không link ra trang từ điển:
          người đang ở giữa một việc thì không rời màn để tra nghĩa. */}
      <p className="mt-3 text-[15px] text-muted-foreground">
        <strong className="font-semibold">Tồn nghi</strong> là mức của điều dòng
        họ ghi lại nhưng chưa đối chiếu được giấy tờ. Vẫn nằm trên phả, vẫn sửa
        được, vẫn thấy được — nét đứt chỉ nói rằng còn chỗ để chắc chắn thêm.
      </p>

      <div className="mt-6 grid gap-2.5">
        <Button type="button" className="h-12 w-full text-[17px]">
          Tìm thêm người thân
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-[17px]"
        >
          Xem trên cây
        </Button>
      </div>
    </section>
  );
}

const MAN: Record<Buoc, { nhan: string; Ve: () => React.ReactElement }> = {
  b1: { nhan: "câu 1 — quan hệ", Ve: B1 },
  b2: { nhan: "câu 2 — tên", Ve: B2 },
  b3: { nhan: "câu 3 — còn sống hay đã mất", Ve: B3 },
  b4: { nhan: "câu 4 — nguồn", Ve: B4 },
  xong: { nhan: "đã vào phả — màn trả công", Ve: Xong },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const chon = (Object.keys(MAN) as Buoc[]).find((b) => b === v);

  return (
    <>
      {/* KHÔNG nới rộng trên máy: một câu hỏi một màn là ràng buộc bố cục, và một câu hỏi kéo
          ngang 1280px không đọc ra như một câu hỏi. */}
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-lg md:pb-16 md:pt-28">
        {chon ? (
          MAN[chon].Ve()
        ) : (
          (Object.keys(MAN) as Buoc[]).map((b, i) => (
            <div key={b}>
              {i > 0 && (
                <>
                  <hr className="my-10 border-border" />
                  <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
                    {MAN[b].nhan}
                  </p>
                </>
              )}
              {MAN[b].Ve()}
            </div>
          ))
        )}
      </main>
      <ThanhDieuHuong hienTai="them" />
    </>
  );
}
