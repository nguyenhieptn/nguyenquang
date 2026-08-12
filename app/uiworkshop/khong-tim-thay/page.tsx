/**
 * KHÔNG TÌM THẤY — màn quan trọng nhất của Đợt 1.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § State Patterns — "Không tìm thấy"
 *   · EXPERIENCE.md § Key Flows — Luồng 1, bước 3 (chỗ dễ hỏng nhất của cả luồng)
 *   · DESIGN.md § Do's and Don'ts (nút tạo là hành động PHỤ)
 *
 * FR: FR-48 (chặn bản trùng tại nguồn) · FR-11 (tìm người thân) · NFR-9 (khớp không dấu)
 *
 * Vì sao đây là MÀN RIÊNG chứ không phải "trạng thái rỗng": ngày ra mắt, phần lớn người gõ tên bố
 * sẽ không thấy gì. Đây là trạng thái MẶC ĐỊNH trong nhiều tháng đầu, không phải trạng thái lỗi.
 * Nó quyết định người ta ở lại hay đóng máy. Một ô rỗng ở đây là mất Khánh trước khi tới cao trào.
 *
 * Hai section: (1) có ứng viên gần giống — ca thường; (2) không có ứng viên nào — ca rỗng thật.
 */
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  NGUOI,
  MANH,
  UNG_VIEN_GAN_GIONG,
  doiCua,
  nhanChi,
} from "../_mock/seed";
import { ThanhDieuHuong } from "@/components/pha/thanh-dieu-huong";

const TU_KHOA = "Nguyễn Quang Hùng";
const ungVien = UNG_VIEN_GAN_GIONG.map((id) => NGUOI.find((n) => n.id === id)!);

function nhanManh(manhId: string) {
  return MANH.find((m) => m.id === manhId)?.nhan ?? "";
}

export default function Page() {
  return (
    <>
      <main className="mx-auto max-w-md px-5 pb-28 pt-7 md:max-w-xl md:pb-16 md:pt-28">
        {/* Ô tìm kiếm là HÌNH ẢNH — prototype tĩnh, không action, nút type="button". */}
        <div className="mb-7 rounded-md border border-input bg-card px-4 py-3 md:px-5 md:py-4">
          <p className="text-[15px] text-muted-foreground">Tìm người thân</p>
          <p className="mt-0.5 font-[family-name:var(--font-pha)] text-[17px]">
            {TU_KHOA}
          </p>
        </div>

        {/* ── Ca thường: có ứng viên gần giống ─────────────────────────────── */}
        <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
          Chưa tìm thấy “{TU_KHOA}”
        </h1>
        <p className="mt-2 text-[17px]">Có phải một trong những người này?</p>

        <ul className="mt-4 space-y-3">
          {ungVien.map((n) => (
            <li key={n.id}>
              <Card className="gap-0 py-3.5">
                <CardBody className="px-4">
                  <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                    {n.hoTen}
                  </p>
                  {/* Đời + chi là BẮT BUỘC: trong một dòng họ, trùng tên là chuyện thường.
                    Chỉ hiện tên thì người dùng chọn nhầm, và một liên kết cha-con sai
                    làm hỏng phả của cả một chi. */}
                  <p className="mt-0.5 text-[15px] text-muted-foreground">
                    đời {doiCua(n.id)} · {nhanChi(n.id)}
                    {n.namSinh ? ` · sinh ${n.namSinh}` : ""}
                  </p>
                  <p className="mt-0.5 text-[15px] text-muted-foreground">
                    {nhanManh(n.manhId)}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>

        {/* Nút tạo là hành động PHỤ, đặt dưới — chặn bản trùng tại nguồn rẻ hơn
          nhiều so với gỡ sau bằng FR-48. */}
        <Button
          type="button"
          variant="outline"
          className="mt-5 h-12 w-full text-[17px]"
        >
          Không ai cả — thêm bố vào phả
        </Button>

        {/* ── Ca rỗng thật: không ứng viên nào ─────────────────────────────── */}
        <hr className="my-10 border-border" />
        <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
          Trạng thái phụ · không có ứng viên nào
        </p>

        <h2 className="font-[family-name:var(--font-pha)] text-[23px]">
          Chưa tìm thấy “Nguyễn Quang Bổng”
        </h2>
        <p className="mt-2 text-[17px]">
          Chưa ai trong phả mang tên này, cũng chưa có tên nào gần giống.
        </p>
        <p className="mt-2 text-[17px] text-muted-foreground">
          Phả mới có {MANH.reduce((s, m) => s + m.soNguoi, 0)} người. Phần lớn
          dòng họ chưa được ghi — thêm được ai là phả dài thêm người ấy.
        </p>

        {/* Ở ca rỗng, tạo mới là hành động CHÍNH: không còn gì để chặn nhầm. */}
        <Button type="button" className="mt-5 h-12 w-full text-[17px]">
          Thêm Nguyễn Quang Bổng vào phả
        </Button>
      </main>
      <ThanhDieuHuong hienTai="them" />
    </>
  );
}
