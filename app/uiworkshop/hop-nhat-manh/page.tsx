/**
 * MẢNH CHƯA NỐI — bàn nối hai mảnh rời thành một cây (bề mặt B).
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture › Bề mặt B — "Hợp nhất mảnh | FR-48"
 *   · EXPERIENCE.md § State Patterns › Cây rỗng / mảnh rời — hiện TRUNG THỰC số mảnh chưa nối,
 *     không bao giờ vẽ các mảnh rời như một cây liền
 *   · EXPERIENCE.md § Component Patterns — "Bot gợi ý, KHÔNG tự gộp"; không cái nào chọn sẵn;
 *     ứng viên luôn bày kèm đời + chi
 *   · DESIGN.md § Cảnh báo là chàm mực (ghi chú của máy, không phải báo hỏng)
 *
 * FR: FR-48 (chặn và gỡ bản trùng) · FR-63 (mỗi mảnh có gốc tạm riêng) · FR-1 (nguồn)
 *
 * ── MÀN NÀY TỐN KÉM, VÀ ĐÓ LÀ CHỦ Ý ─────────────────────────────────────────────────────────
 * Nối hai mảnh là thao tác đắt nhất trong cả sản phẩm: nối đúng thì hai nhánh dòng họ tìm lại
 * được nhau sau mấy chục năm; nối sai thì hai cụ khác nhau bị nhập làm một, và mọi đời tính từ
 * đó trở xuống lệch — hỏng phả của cả một chi. Nên màn cố tình KHÔNG có đường nhanh: không gộp
 * hàng loạt, không "gộp tất cả cái giống nhau", không gợi ý nào được tích sẵn.
 *
 * ── PHẢI BÀY CẢ CHỖ KHÁC NHAU ───────────────────────────────────────────────────────────────
 * Ràng buộc quan trọng nhất. Một màn chỉ liệt kê điểm giống là một màn dụ người bấm gộp: mắt đọc
 * ba dòng "giống" rồi kết luận. Chỗ khác nhau mới là thứ ngăn được lần gộp sai, nên nó đứng
 * NGANG HÀNG với chỗ giống nhau, cùng cỡ chữ, cùng vị trí.
 *
 * Và câu trả lời "hai người khác nhau" phải là một nút thật, không phải nút "bỏ qua": trong một
 * dòng họ, trùng tên là chuyện thường, nên phần lớn ứng viên bot bày ra sẽ KHÔNG phải một người.
 * Ghi lại phán quyết ấy khiến bot không hỏi lại lần sau.
 */
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThanhBanDuyet } from "@/components/pha/thanh-ban-duyet";
import {
  MANH,
  NGUOI,
  UNG_VIEN_NOI,
  doiCua,
  nhanChi,
  type Nguoi,
} from "../_mock/seed";

/** Thẻ người — dữ liệu phả giữ nguyên luật bề mặt A giữa khung trần của bàn duyệt. */
function TheNguoi({ n }: { n: Nguoi }) {
  const tonNghi = n.tang === "ton-nghi";
  return (
    <div
      className={[
        "rounded-md border px-3.5 py-3",
        tonNghi
          ? "van-ton-nghi border-dashed border-tin-ton-nghi"
          : "border-border bg-card",
      ].join(" ")}
    >
      <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
        {n.hoTen}
      </p>
      <p className="mt-0.5 text-[15px] text-muted-foreground">
        đời {doiCua(n.id)} · {nhanChi(n.id)}
        {n.namSinh ? ` · sinh ${n.namSinh}` : ""}
        {n.namMat ? ` · mất ${n.namMat}` : ""}
      </p>
      <p className="mt-0.5 text-[15px] text-muted-foreground">
        {MANH.find((m) => m.id === n.manhId)?.nhan}
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-ban-nen">
      <ThanhBanDuyet hienTai="manh-chua-noi" />

      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <h1 className="text-[23px] font-semibold">Mảnh chưa nối</h1>
        <p className="mt-2 max-w-[70ch] text-[17px]">
          Phả đang có <strong>{MANH.length} mảnh</strong> chưa nối được với nhau.
          Đây không phải lỗi: đó là phần dòng họ còn nhớ nhưng chưa tìm ra chỗ
          nối lại.
        </p>

        {/* Hai mảnh bày cạnh nhau, KHÔNG có nét nào nối giữa chúng — vẽ một nét mờ "nối tạm" là
            nói dối đúng cái điều FR-48 sinh ra để chống. */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {MANH.map((m) => {
            const goc = NGUOI.find((n) => n.id === m.gocTamId)!;
            return (
              <Card key={m.id} className="border-ban-vien bg-ban-o py-4">
                <CardBody className="px-5">
                  <p className="text-[19px] font-semibold">{m.nhan}</p>
                  <p className="mt-1 text-[17px] text-muted-foreground">
                    {m.soNguoi} người
                  </p>
                  <p className="mt-3 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
                    Gốc tạm
                  </p>
                  <div className="mt-1.5">
                    <TheNguoi n={goc} />
                  </div>
                  {/* FR-63 nói thành lời ngay tại chỗ: gốc tạm là "cụ xa nhất hiện biết", không
                      phải khẳng định đã là Thuỷ tổ. Nối hai mảnh thì một trong hai gốc tạm sẽ
                      thôi là gốc — người vận hành phải biết trước điều đó. */}
                  <p className="mt-2 text-[15px] text-muted-foreground">
                    cụ xa nhất mảnh này hiện biết
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <h2 className="mt-10 text-[19px] font-semibold">
          Bot thấy {UNG_VIEN_NOI.length} chỗ có thể là cùng một người
        </h2>
        <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
          Gợi ý, không tự nối. Trong một dòng họ trùng tên là chuyện thường, nên
          phần lớn những chỗ dưới đây sẽ là <em>hai người khác nhau</em> — và trả
          lời như vậy cũng là một quyết định, ghi lại được.
        </p>

        <div className="mt-5 grid gap-5">
          {UNG_VIEN_NOI.map((uv) => {
            const a = NGUOI.find((n) => n.id === uv.aId)!;
            const b = NGUOI.find((n) => n.id === uv.bId)!;
            return (
              <div
                key={uv.id}
                className="rounded-md border border-ban-vien bg-ban-o"
              >
                <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                  <TheNguoi n={a} />
                  <TheNguoi n={b} />
                </div>

                {/* Khối chàm — ghi chú của máy, không phải báo hỏng. Ở đây không có gì hỏng: chỉ
                    có một câu hỏi máy không tự trả lời được và đang chuyển cho người. */}
                <div className="border-l-4 border-destructive bg-canh-bao-nen px-5 py-4">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-[17px] font-semibold">Giống nhau</p>
                      <ul className="mt-1.5 grid gap-1">
                        {uv.giongNhau.map((g) => (
                          <li key={g} className="text-[17px]">
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* NGANG HÀNG, không phải một dòng chú thích phía dưới. Xem đầu file. */}
                    <div>
                      <p className="text-[17px] font-semibold">Khác nhau</p>
                      <ul className="mt-1.5 grid gap-1">
                        {uv.khacNhau.map((k) => (
                          <li key={k} className="text-[17px]">
                            {k}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {uv.soNguoiAnhHuong > 0 && (
                    <p className="mt-4 max-w-[70ch] text-[17px]">
                      Nối hai người này thì <strong>{uv.soNguoiAnhHuong}</strong>{" "}
                      người ở mảnh kia về cùng một cây, và mọi số đời từ đó trở
                      xuống tính lại. Gỡ ra được, nhưng phải gỡ tay từng liên kết.
                    </p>
                  )}

                  {/* Hai câu trả lời, cùng cỡ, cùng kiểu nút PHỤ — không cái nào là mặc định.
                      Dùng nút chính (son) cho một bên là bot đã nghiêng về bên đó. */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 text-[17px]"
                    >
                      Là cùng một người — nối lại
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 text-[17px]"
                    >
                      Là hai người khác nhau
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 text-[17px]"
                    >
                      Chưa quyết được — để lại
                    </Button>
                  </div>
                  <p className="mt-2 text-[15px] text-muted-foreground">
                    Chưa quyết được cũng là một câu trả lời đúng. Bot sẽ hỏi lại
                    khi có thêm dữ liệu về một trong hai người.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
