/**
 * TRANG MỘT NGƯỜI — đích của mọi lần chạm vào một node trên cây.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture — "Trang một người | FR-1, FR-2, FR-37, FR-39"
 *   · EXPERIENCE.md § Component Patterns — Node người ("chạm → mở trang một người"), Chip mức
 *     tin cậy ("chạm → panel giải nghĩa: mức này là gì, ai khai, dựa vào đâu")
 *   · EXPERIENCE.md § Accessibility Floor — bán kính riêng tư là chuyện DỮ LIỆU, không phải CSS
 *   · DESIGN.md § Ba mức tin cậy không được mã hoá chỉ bằng màu, § Components
 *
 * FR: FR-1 (mọi khẳng định mang nguồn) · FR-2 (ba mức tin cậy) · FR-37 (bán kính riêng tư) ·
 *     FR-39 (nhật ký sửa) · FR-47/FR-49 (lời kể + đồng thuận) · FR-63 (gốc tạm)
 *
 * ── VÌ SAO MÀN NÀY LÀ CHỖ DUY NHẤT FR-1 LỘ RA ───────────────────────────────────────────────
 * § Chip mức tin cậy chốt: panel giải nghĩa là chỗ **duy nhất** FR-1 lộ ra với người thường,
 * và **không nhét nguồn vào node**. Lý do là số học của cây: một node có chỗ cho ba dòng, mà một
 * người có thể mang chục khẳng định, mỗi cái một nguồn và một mức. Nhồi nguồn lên cây thì cây
 * hết đọc được; giấu nguồn hẳn đi thì phả này thành một danh bạ. Trang người là chỗ thứ ba.
 *
 * ── MỨC TIN CẬY GẮN VÀO KHẲNG ĐỊNH, KHÔNG GẮN VÀO NGƯỜI ─────────────────────────────────────
 * Ràng buộc quan trọng nhất của màn, và dễ vẽ sai nhất. Một người có thể vừa "chắc chắn" là con
 * của cụ này, vừa "tồn nghi" về năm sinh. Vẽ một huy hiệu "TỒN NGHI" to trên đầu trang là dán
 * nhãn lên một con người — sai ở tầng dữ liệu, và xúc phạm ở tầng người đọc. Nên mức nằm cạnh
 * TỪNG DÒNG, và cái duy nhất ở đầu trang là mức của khẳng định yếu nhất, nói rõ nó là của cái gì.
 *
 * Ba section: (1) người vừa được thêm, đang ở tồn nghi; (2) người đã khuất, có tên huý và lời kể;
 * (3) người còn sống ngoài bán kính riêng tư — trang MỎNG, không phải trang bị che.
 */
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";
import {
  NGUOI,
  doiHienThi,
  nhanChi,
  khangDinhVe,
  nhatKyVe,
  loiKeVe,
  doDai,
  NHAN_TIEP_CAN,
  type Nguoi,
  type MucTinCay,
} from "../_mock/seed";

const NHAN_TIN_CAY: Record<MucTinCay, string> = {
  "chac-chan": "chắc chắn",
  "theo-loi-ke": "theo lời kể",
  "ton-nghi": "tồn nghi",
};

/** Câu giải nghĩa cho từng mức — chú giải tại chỗ, đúng chữ DESIGN.md § Do's. */
const NGHIA_TIN_CAY: Record<MucTinCay, string> = {
  "chac-chan": "đã đối chiếu được với giấy tờ, bia mộ hoặc ảnh chụp",
  "theo-loi-ke": "có người trong họ kể lại, chưa đối chiếu được giấy tờ",
  "ton-nghi": "dòng họ ghi lại để không quên, còn chỗ để chắc chắn thêm",
};

const MAU_TIN_CAY: Record<MucTinCay, string> = {
  "chac-chan": "var(--color-tin-chac-chan)",
  "theo-loi-ke": "var(--color-tin-loi-ke)",
  "ton-nghi": "var(--color-tin-ton-nghi)",
};

/** Thứ tự yếu dần — dùng để tìm mức yếu nhất trong một chồng khẳng định. */
const THU_TU: MucTinCay[] = ["chac-chan", "theo-loi-ke", "ton-nghi"];

/**
 * Chip mức tin cậy. Chấm màu + CHỮ, không bao giờ chỉ màu — § Accessibility Floor, và nó phải
 * còn phân biệt được khi in đen trắng (FR-50 sau này đòi bản in tuân đúng luật riêng tư).
 */
function ChipTinCay({ muc }: { muc: MucTinCay }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[15px] text-muted-foreground">
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: MAU_TIN_CAY[muc] }}
        aria-hidden
      />
      {NHAN_TIN_CAY[muc]}
    </span>
  );
}

function TieuDeMuc({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-7 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

/**
 * Đầu trang. Tên huý và tên hèm CHỈ hiện với người đã khuất, và luôn kèm nhãn nói rõ đó là gì —
 * tên hèm là tên dùng khi khấn, đọc sai là lỗi nặng, nên hiện trần không nhãn còn tệ hơn không
 * hiện. Với người còn sống, hỏi tên huý đã là sai lễ, hiện lại càng sai.
 */
function DauTrang({ n, gocTam }: { n: Nguoi; gocTam?: boolean }) {
  const cac = khangDinhVe(n.id);
  const yeuNhat =
    cac.length > 0
      ? THU_TU[Math.max(...cac.map((k) => THU_TU.indexOf(k.tinCay)))]
      : n.tinCay;

  return (
    <header>
      <h1 className="font-[family-name:var(--font-pha)] text-[27px] leading-tight">
        {n.hoTen}
      </h1>
      <p className="mt-1 text-[17px] text-muted-foreground">
        đời {doiHienThi(n.id)} · {nhanChi(n.id)}
        {n.namSinh ? ` · sinh ${n.namSinh}` : ""}
        {n.namMat ? ` · mất ${n.namMat}` : ""}
      </p>

      {!n.conSong && (n.huy || n.tenHem) && (
        <dl className="mt-3 grid gap-1">
          {n.huy && (
            <div className="flex gap-2 text-[17px]">
              <dt className="text-muted-foreground">Tên huý</dt>
              <dd className="font-[family-name:var(--font-pha)]">{n.huy}</dd>
            </div>
          )}
          {n.tenHem && (
            <div className="flex gap-2 text-[17px]">
              <dt className="text-muted-foreground">Tên hèm</dt>
              <dd className="font-[family-name:var(--font-pha)]">{n.tenHem}</dd>
            </div>
          )}
        </dl>
      )}

      {/* FR-63: gốc tạm phải tự nói mình là gốc TẠM. Không có câu này thì "cụ xa nhất hiện biết"
          bị đọc thành "Thuỷ tổ", và cả cây đứng trên một khẳng định chưa ai đưa ra. */}
      {gocTam && (
        <p className="mt-3 text-[17px]">
          Cụ xa nhất dòng họ hiện biết. Chưa phải khẳng định đây là Thuỷ tổ —
          tìm được đời trên thì cụ dịch lên, và mọi số đời tự tính lại.
        </p>
      )}

      {cac.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-muted-foreground">
          Điều chắc nhất còn thiếu ở mức <ChipTinCay muc={yeuNhat} />— xem từng
          dòng bên dưới.
        </p>
      )}
    </header>
  );
}

/**
 * PANEL GIẢI NGHĨA — FR-1 lộ ra ở đây và chỉ ở đây.
 *
 * Trong sản phẩm thật, panel này mở ra khi chạm vào chip. Ở xưởng nó vẽ MỞ SẴN: prototype là
 * tĩnh, và một panel đóng thì người duyệt không nhìn thấy đúng cái phải duyệt.
 *
 * Mỗi dòng phải trả đủ ba câu § Component Patterns đòi: mức này là gì · ai khai · dựa vào đâu.
 * Thiếu "dựa vào đâu" thì đây chỉ là một danh sách có màu.
 */
function BangKhangDinh({ n }: { n: Nguoi }) {
  const cac = khangDinhVe(n.id);
  if (cac.length === 0) {
    return (
      <p className="text-[17px] text-muted-foreground">
        Chưa có dòng nào ghi kèm nguồn. Người trong họ biết gì thì ghi thêm được.
      </p>
    );
  }
  return (
    <ul className="grid gap-3">
      {cac.map((k) => (
        <li key={k.id}>
          <Card className="gap-0 py-3.5">
            <CardBody className="px-4">
              <p className="text-[17px]">{k.menhDe}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <ChipTinCay muc={k.tinCay} />
                <span className="text-[15px] text-muted-foreground">
                  · {NGHIA_TIN_CAY[k.tinCay]}
                </span>
              </div>
              <p className="mt-1.5 text-[15px] text-muted-foreground">
                {k.nguon}
              </p>
              <p className="mt-0.5 text-[15px] italic text-primary">
                {k.nguoiKhai} ghi · {k.ngayKhai}
              </p>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/** Quan hệ — mỗi ô là một đường sang trang người khác, đúng cách người ta thật sự đi trên phả. */
function QuanHe({ n }: { n: Nguoi }) {
  const cha = NGUOI.find((x) => x.id === n.chaId);
  const con = NGUOI.filter((x) => x.chaId === n.id);
  const banDoi = NGUOI.find((x) => x.id === n.voChongId || x.voChongId === n.id);

  const o = (nhan: string, ng: Nguoi) => (
    <a
      key={`${nhan}-${ng.id}`}
      href="/uiworkshop/trang-nguoi"
      target="_top"
      className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3"
    >
      <span>
        <span className="block text-[15px] text-muted-foreground">{nhan}</span>
        <span className="block font-[family-name:var(--font-pha)] text-[17px]">
          {ng.hoTen}
        </span>
      </span>
      <span className="shrink-0 text-[15px] text-muted-foreground">
        đời {doiHienThi(ng.id)}
      </span>
    </a>
  );

  return (
    <div className="grid gap-2.5">
      {cha && o("Cha", cha)}
      {banDoi && o(banDoi.gioiTinh === "nu" ? "Vợ" : "Chồng", banDoi)}
      {con.map((c) => o("Con", c))}
      {!cha && !banDoi && con.length === 0 && (
        <p className="text-[17px] text-muted-foreground">
          Chưa nối được với ai. Ai biết thì nối giúp — đây là việc quý nhất mà ai
          cũng làm được.
        </p>
      )}
    </div>
  );
}

/**
 * LỜI KỂ nhắc tới người này (FR-47) — bày kèm mức đồng thuận do CHÍNH NGƯỜI KỂ chọn (FR-49).
 *
 * `[CẦN NGƯỜI DUYỆT TRẢ LỜI]` Spine chưa chốt: bản thu "chỉ ban tu phả nghe" và bản "niêm phong"
 * có được để lộ SỰ TỒN TẠI với người trong họ không? Ở đây tạm vẽ là CÓ — biết rằng bà đã kể một
 * lần về cụ, và biết bản ấy mở năm 2046, tự nó đã là một điều dòng họ nên giữ; giấu hẳn thì đến
 * đời sau không ai biết mà đi tìm. Nhưng đây là quyết định về quyền riêng tư của người kể, không
 * phải quyết định về giao diện — cần người duyệt chốt trước khi promote.
 */
function DanhSachLoiKe({ n }: { n: Nguoi }) {
  const cac = loiKeVe(n.id);
  if (cac.length === 0) return null;
  return (
    <>
      <TieuDeMuc>Lời kể có nhắc tới</TieuDeMuc>
      <ul className="grid gap-3">
        {cac.map((l) => {
          const nguoiKe = NGUOI.find((x) => x.id === l.nguoiKeId);
          const moDuoc = l.tiepCan === "cong-khai";
          return (
            <li key={l.id}>
              <Card className="gap-0 py-3.5">
                <CardBody className="px-4">
                  <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                    {nguoiKe?.hoTen} kể
                  </p>
                  <p className="mt-0.5 text-[15px] text-muted-foreground">
                    {doDai(l.thoiLuong)} · thu ngày {l.ngayThu} · {l.nguoiThu}{" "}
                    ghi âm
                  </p>
                  <p className="mt-1.5 text-[15px]">
                    {NHAN_TIEP_CAN[l.tiepCan]}
                    {l.moNiemPhongNam
                      ? ` — mở năm ${l.moNiemPhongNam}, không ai mở sớm được, kể cả ban tu phả`
                      : ""}
                  </p>
                  {moDuoc && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 h-12 w-full text-[17px]"
                    >
                      Nghe
                    </Button>
                  )}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** NHẬT KÝ SỬA (FR-39) — cũng là chỗ tên người đóng góp nằm lại lâu nhất. */
function NhatKy({ n }: { n: Nguoi }) {
  const cac = nhatKyVe(n.id);
  if (cac.length === 0) return null;
  return (
    <>
      <TieuDeMuc>Ai đã ghi gì</TieuDeMuc>
      <ul className="grid gap-2">
        {cac.map((m) => (
          <li key={m.id} className="flex flex-wrap gap-x-2 text-[17px]">
            <span>{m.viec}</span>
            <span className="text-muted-foreground">
              — {m.nguoiLam} · {m.khi}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Trang đầy đủ — dùng cho cả người vừa thêm lẫn người đã khuất. */
function TrangDayDu({ n, gocTam }: { n: Nguoi; gocTam?: boolean }) {
  return (
    <article>
      <DauTrang n={n} gocTam={gocTam} />
      <TieuDeMuc>Phả ghi gì, dựa vào đâu</TieuDeMuc>
      <BangKhangDinh n={n} />
      <TieuDeMuc>Quan hệ</TieuDeMuc>
      <QuanHe n={n} />
      <DanhSachLoiKe n={n} />
      <NhatKy n={n} />

      <div className="mt-7 grid gap-2.5">
        <Button type="button" className="h-12 w-full text-[17px]">
          Ghi thêm điều mình biết
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-[17px]"
        >
          Xem trên cây
        </Button>
      </div>
    </article>
  );
}

/**
 * NGOÀI BÁN KÍNH RIÊNG TƯ (FR-37) — trang MỎNG, không phải trang bị che.
 *
 * § Accessibility Floor chốt: cái ngoài bán kính **không được gửi tới client**, và màn phải vẽ nó
 * như **không tồn tại**, không phải như ô bị che. Nên ở đây không có một ô xám nào, không có dòng
 * "3 mục bị ẩn", không có ổ khoá. Trang chỉ đơn giản là ngắn.
 *
 * Cái được phép nói là **LUẬT** — vì luật áp cho tất cả và không tiết lộ gì về riêng người này.
 * Nói luật ra còn là cách sản phẩm tự chứng minh nó không bán dữ liệu dòng họ; im lặng ở đây bị
 * đọc thành "chắc là hỏng".
 */
function NgoaiBanKinh({ n }: { n: Nguoi }) {
  return (
    <article>
      <h1 className="font-[family-name:var(--font-pha)] text-[27px] leading-tight">
        {n.hoTen}
      </h1>
      <p className="mt-1 text-[17px] text-muted-foreground">
        đời {doiHienThi(n.id)} · {nhanChi(n.id)}
      </p>

      <TieuDeMuc>Quan hệ</TieuDeMuc>
      <QuanHe n={n} />

      <p className="mt-7 text-[17px] text-muted-foreground">
        Người còn sống chỉ hiện tên, đời và chi với người ngoài chi. Người trong
        cùng chi thấy thêm năm sinh. Ngày tháng sinh thì không hiện với ai — phả
        không giữ thứ dòng họ không cần.
      </p>
    </article>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const bo = NGUOI.find((n) => n.id === "n-009")!;
  const cuTo = NGUOI.find((n) => n.id === "n-001")!;
  const nguoiXa = NGUOI.find((n) => n.id === "n-032")!;

  const mot = v === "cu-to" ? cuTo : v === "ngoai-ban-kinh" ? nguoiXa : bo;
  const chon = v === "cu-to" || v === "ngoai-ban-kinh" || v === "vua-them";

  return (
    <>
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-xl md:pb-16 md:pt-28">
        {chon ? (
          v === "ngoai-ban-kinh" ? (
            <NgoaiBanKinh n={mot} />
          ) : (
            <TrangDayDu n={mot} gocTam={v === "cu-to"} />
          )
        ) : (
          <>
            <TrangDayDu n={bo} />
            <hr className="my-10 border-border" />
            <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
              Người đã khuất · gốc tạm của mảnh · có tên huý và lời kể
            </p>
            <TrangDayDu n={cuTo} gocTam />
            <hr className="my-10 border-border" />
            <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
              Người còn sống, ngoài bán kính riêng tư (FR-37)
            </p>
            <NgoaiBanKinh n={nguoiXa} />
          </>
        )}
      </main>
      <ThanhDieuHuong hienTai="gia-pha" />
    </>
  );
}
