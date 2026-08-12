/**
 * HÀNG CHỜ DUYỆT LÊN TẦNG CHÍNH THỨC — bề mặt B.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture › Bề mặt B — "Hàng chờ duyệt lên Tầng chính thức"
 *   · EXPERIENCE.md § Component Patterns › Thanh bàn duyệt, § Bề mặt B (sàn chữ 17px vẫn áp
 *     nguyên; bảng chật thì BỚT CỘT, không thu chữ)
 *   · DESIGN.md § Colors › Bề mặt B (khung trần, dữ liệu phả giữ chất liệu)
 *
 * FR: FR-3 (hai tầng dữ liệu) · FR-1 (khẳng định mang nguồn) · FR-2 (mức tin cậy) · FR-64 (vai)
 *
 * ── HIỂU NHẦM PHẢI CHẶN NGAY Ở ĐẦU MÀN ──────────────────────────────────────────────────────
 * "Hàng chờ" trong hầu hết phần mềm nghĩa là: nằm đây thì chưa ai thấy. Ở đây thì **ngược lại** —
 * FR-3 chốt người tự khai vào thẳng Tầng tồn nghi và **hiện ngay, không chờ duyệt**. Những người
 * trong bảng này ĐÃ ở trên cây, con cháu họ đã nhìn thấy họ.
 *
 * Duyệt ở đây không phải "cho phép xuất hiện" mà là **nâng mức**: từ điều dòng họ ghi lại thành
 * điều dòng họ đã đối chiếu. Nếu người vận hành hiểu nhầm chiều này, họ sẽ duyệt vội để "mở khoá"
 * cho người ta — và Tầng chính thức mất luôn ý nghĩa ngay tuần đầu.
 *
 * Hệ quả bố cục: bảng KHÔNG có nút "từ chối". Từ chối một người đã đứng trên cây là xoá họ đi,
 * mà đó là việc khác hẳn và cần đường khác. Ở đây chỉ có nâng lên, hoặc để nguyên.
 *
 * ── BỚT CỘT, KHÔNG THU CHỮ ──────────────────────────────────────────────────────────────────
 * Bốn cột, không hơn: người · phả ghi gì và dựa vào đâu · ai ghi · chọn. Mọi thứ khác (số đời,
 * mảnh, nhật ký) không giúp ra quyết định NÂNG HAY KHÔNG, nên không được chiếm bề ngang.
 *
 * ⚠️ NỢ TÀI LIỆU: hành trình gốc của việc duyệt (UJ-3) đã mất khi PRD được viết lại, và phần còn
 * lại phụ thuộc FR-4 vốn ngoài Đợt 1. Màn này dựng từ § IA, KHÔNG từ một hành trình có thật —
 * nhịp của nó chưa được kiểm. Xem EXPERIENCE.md § Luồng chưa distill.
 */
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThanhBanDuyet } from "@/components/pha/thanh-ban-duyet";
import {
  hangChoDuyet,
  doiCua,
  nhanChi,
  MANH,
  type MucTinCay,
} from "../_mock/seed";

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

export default function Page() {
  const hang = hangChoDuyet();
  // Người có khẳng định mang nguồn đứng TRƯỚC: đó là những dòng duyệt được ngay. Người chưa có
  // nguồn nào không phải "hạng hai" — họ chỉ đơn giản là chưa duyệt được, và xếp sau để người vận
  // hành không mất thì giờ mở ra rồi đóng lại.
  const duyetDuoc = hang.filter((m) => m.khangDinh.length > 0);
  const chuaDuNguon = hang.filter((m) => m.khangDinh.length === 0);

  return (
    <div className="min-h-screen bg-ban-nen">
      <ThanhBanDuyet hienTai="hang-cho" />

      <main className="mx-auto max-w-[1280px] px-6 py-10">
        <h1 className="text-[23px] font-semibold">Hàng chờ duyệt</h1>

        {/* Câu chặn hiểu nhầm — đứng ngay dưới tiêu đề, trước cả con số. Xem đầu file. */}
        <p className="mt-2 max-w-[70ch] text-[17px]">
          {hang.length} người đang ở <strong>Tầng tồn nghi</strong>. Tất cả{" "}
          <strong>đã hiện trên cây</strong> và con cháu họ đã nhìn thấy — duyệt
          không phải để cho họ xuất hiện.
        </p>
        <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
          Duyệt là <strong>nâng mức</strong>: từ điều dòng họ ghi lại thành điều
          dòng họ đã đối chiếu được. Chưa đối chiếu thì để nguyên — để nguyên
          không làm ai mất gì.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" className="h-11 text-[17px]">
            Nâng các dòng đã chọn lên Tầng chính thức
          </Button>
          <span className="text-[17px] text-muted-foreground">
            Chưa chọn dòng nào
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-md border border-ban-vien bg-ban-o">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead className="text-[17px]">Người</TableHead>
                <TableHead className="text-[17px]">
                  Phả ghi gì, dựa vào đâu
                </TableHead>
                <TableHead className="text-[17px]">Ai ghi</TableHead>
                <TableHead className="w-44 text-[17px]">Chọn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duyetDuoc.map(({ nguoi, khangDinh, soLoiKe }) => (
                <Fragment key={nguoi.id}>
                  <TableRow>
                    <TableCell className="align-top">
                      {/* Không dòng nào được tích sẵn — người vận hành phải tự chọn từng dòng,
                          y như bảng xem trước. Tích sẵn là đã quyết hộ. */}
                      <Checkbox aria-label={`Chọn ${nguoi.hoTen}`} />
                    </TableCell>
                    <TableCell className="align-top">
                      {/* Dữ liệu phả giữ nguyên luật bề mặt A ngay giữa khung trần: serif-phả,
                          nét đứt tồn nghi. Bàn duyệt vẽ khác thì người vận hành duyệt một thứ và
                          người trong họ thấy một thứ khác. */}
                      <div
                        className="van-ton-nghi rounded-md border border-dashed px-3.5 py-2.5"
                        style={{ borderColor: "var(--color-tin-ton-nghi)" }}
                      >
                        <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                          {nguoi.hoTen}
                        </p>
                        <p className="mt-0.5 text-[15px] text-muted-foreground">
                          đời {doiCua(nguoi.id)} · {nhanChi(nguoi.id)}
                          {nguoi.namSinh ? ` · sinh ${nguoi.namSinh}` : ""}
                          {nguoi.namMat ? ` · mất ${nguoi.namMat}` : ""}
                        </p>
                        <p className="mt-0.5 text-[15px] text-muted-foreground">
                          {MANH.find((m) => m.id === nguoi.manhId)?.nhan}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <ul className="grid gap-2.5">
                        {khangDinh.map((k) => (
                          <li key={k.id}>
                            <p className="text-[17px]">{k.menhDe}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[15px] text-muted-foreground">
                              <ChipTinCay muc={k.tinCay} />· {k.nguon}
                            </p>
                          </li>
                        ))}
                      </ul>
                      {soLoiKe > 0 && (
                        <p className="mt-2 text-[15px] text-muted-foreground">
                          Có {soLoiKe} bản thu lời kể nhắc tới người này — nghe
                          trước khi nâng.
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-[17px]">
                      {khangDinh[0]?.nguoiKhai}
                      <span className="block text-[15px] text-muted-foreground">
                        {khangDinh[0]?.ngayKhai}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="grid gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full text-[17px]"
                        >
                          Nâng lên chính thức
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11 w-full text-[17px]"
                        >
                          Để nguyên
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Nhóm thứ hai — gọn hơn hẳn, vì với những dòng này không có gì để quyết. Bày ra để người
            vận hành biết việc còn lại là ĐI HỎI, không phải đi bấm. */}
        <h2 className="mt-10 text-[19px] font-semibold">
          Chưa đủ nguồn để duyệt · {chuaDuNguon.length} người
        </h2>
        <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
          Chưa có dòng nào ghi kèm nguồn, nên chưa có gì để đối chiếu. Việc ở đây
          là đi hỏi và ghi thêm, không phải bấm duyệt.
        </p>
        <ul className="mt-4 flex flex-wrap gap-3">
          {chuaDuNguon.map(({ nguoi }) => (
            <li key={nguoi.id}>
              <div
                className="van-ton-nghi rounded-md border border-dashed bg-ban-o px-3.5 py-2.5"
                style={{ borderColor: "var(--color-tin-ton-nghi)" }}
              >
                <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                  {nguoi.hoTen}
                </p>
                <p className="mt-0.5 text-[15px] text-muted-foreground">
                  đời {doiCua(nguoi.id)} · {nhanChi(nguoi.id)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Ai được duyệt — FR-64. Không phải chú thích: một bảng duyệt không nói rõ vai thì
            người mở nó ra không biết mình có quyền hay không, và bấm thử. */}
        <p className="mt-10 max-w-[70ch] text-[17px] text-muted-foreground">
          Chỉ quản trị và đầu mối chi nâng được mức. Mọi lần nâng đều vào nhật ký
          sửa, mang tên người nâng.
        </p>
      </main>
    </div>
  );
}
