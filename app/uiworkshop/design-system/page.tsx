import { Card, CardBody, CardTitle } from "@/components/ui/card";

/**
 * Từ điển thị giác của hệ thống — token + component thật ở đủ biến thể.
 *
 * KIT: đây là bản KHUNG tối thiểu. Thay bằng bảng token + component THẬT của project bạn
 * (mọi màu gọi bằng TÊN TOKEN, không hex — nguồn: app/globals.css @theme ← DESIGN.md). Xem
 * design-system gốc của một project đã dựng để biết mức chi tiết mong muốn (màu, hai giọng chữ,
 * nút × biến thể × kích thước, badge/chip, thẻ, ô nhập, trạng thái rỗng…).
 */
export default function DesignSystemPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">
          Bộ nhận diện & component
        </h1>
        <p className="text-body-ink">
          Bản khung — thay bằng bảng token và component thật của project.
        </p>
      </div>

      <Card>
        <CardBody>
          <CardTitle>TODO(setup)</CardTitle>
          <p className="text-sm text-body-ink">
            Liệt kê ở đây: dải màu gọi theo tên token, các giọng chữ, các
            primitive
            <code className="mx-1 font-mono">@/components/ui/*</code> ở đủ biến
            thể. Đây là bảng tra khi dựng mọi màn khác.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
