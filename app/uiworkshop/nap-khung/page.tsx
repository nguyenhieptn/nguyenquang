/**
 * NẠP KHUNG DÒNG HỌ — màn đầu của bề mặt B (bàn duyệt).
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture › Bề mặt B (chrome, sàn chữ, bộ lọc)
 *   · EXPERIENCE.md § Key Flows — Luồng 2, bước 1–3 (tải mẫu → điền ngoài hệ thống → tải lên)
 *   · DESIGN.md § Colors › Bề mặt B (khung trần, dữ liệu phả giữ chất liệu)
 *
 * FR: FR-51 (nhập khung dòng họ) · FR-63 (gốc tạm là "cụ xa nhất hiện biết", không phải Thuỷ tổ)
 *
 * VÌ SAO MÀN NÀY CHỦ YẾU LÀ CHỮ: việc thật của bước này xảy ra NGOÀI hệ thống — Hiệp ngồi điền
 * tay một file, hỏi các cụ, tra bia. Màn không rút ngắn được việc đó; thứ nó phải làm là khiến
 * người điền biết CÁI GÌ ĐƯỢC PHÉP ĐỂ TRỐNG. Một khung mà người điền sợ ô trống thì họ sẽ đoán,
 * và một con số đoán trong phả khó gỡ hơn một ô trống rất nhiều.
 *
 * Hai section: (1) trước khi chọn file — trạng thái chuẩn; (2) đã chọn file, chờ xem trước.
 */
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ThanhBanDuyet } from '@/components/pha/thanh-ban-duyet';
import { DONG_KHUNG, TEN_FILE_KHUNG } from '../_mock/seed';

/**
 * Các cột của file mẫu. Cột "để trống được" là cột QUAN TRỌNG NHẤT của bảng này — xem đầu file.
 * Chỉ họ tên là bắt buộc: một người không tên thì không có gì để ghi, còn lại đều có thể chưa biết.
 */
const COT_MAU: { ten: string; batBuoc: boolean; viDu: string; ghiChu?: string }[] = [
  { ten: 'họ tên', batBuoc: true, viDu: 'Nguyễn Quang Thản' },
  { ten: 'giới tính', batBuoc: false, viDu: 'nam', ghiChu: 'nam / nữ' },
  { ten: 'năm sinh', batBuoc: false, viDu: '1888' },
  { ten: 'năm mất', batBuoc: false, viDu: '1901', ghiChu: 'để trống nếu còn sống' },
  {
    ten: 'tên cha',
    batBuoc: false,
    viDu: 'Nguyễn Quang Thản',
    ghiChu: 'để trống nếu chưa truy được đời trên',
  },
  {
    ten: 'vợ/chồng của',
    batBuoc: false,
    viDu: 'Nguyễn Quang Đệ',
    ghiChu: 'cột nối người kết hôn vào họ',
  },
  { ten: 'nguồn', batBuoc: false, viDu: 'Bia nhà thờ họ — ảnh chụp 03/2026' },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-ban-nen">
      <ThanhBanDuyet hienTai="nap-khung" />

      <main className="mx-auto max-w-[900px] px-6 py-10">
        <h1 className="text-[23px] font-semibold">Nạp khung dòng họ</h1>
        <p className="mt-2 max-w-[62ch] text-[17px]">
          Khung là phần đã biết trước khi có ai tự khai: các chi hiện có, người đứng đầu mỗi chi,
          những cụ đã biết tên.
        </p>

        {/* FR-51 + FR-63 — hai lời hứa phải nói TRƯỚC khi người ta bỏ công điền, không phải sau
            khi đã ghi. Chúng là thứ khiến việc điền một khung còn thiếu không đáng sợ. */}
        <Card className="mt-5 border-ban-vien bg-ban-o py-4">
          <CardBody className="px-5">
            <ul className="space-y-2 text-[17px]">
              <li>
                Mọi dòng vào <strong>Tầng tồn nghi</strong> — ghi rồi vẫn sửa được, không có gì
                khoá lại.
              </li>
              <li>
                Người không truy được đời trên sẽ thành{' '}
                <strong>gốc tạm của một mảnh</strong>, và trên phả ghi rõ đó là{' '}
                <em>cụ xa nhất hiện biết</em> — không phải khẳng định đã là Thuỷ tổ.
              </li>
              <li className="text-muted-foreground">
                Chưa dòng nào được ghi vào phả cho tới khi bấm ghi ở trang xem trước.
              </li>
            </ul>
          </CardBody>
        </Card>

        {/* ── Bước 1 — tải mẫu ──────────────────────────────────────────────── */}
        <h2 className="mt-10 text-[19px] font-semibold">1 · Tải file mẫu</h2>
        <p className="mt-1.5 max-w-[62ch] text-[17px] text-muted-foreground">
          Điền ngoài hệ thống, mỗi người một dòng. <strong>Để trống cột chưa biết.</strong> Khung
          là thứ chưa đầy đủ theo định nghĩa — một ô trống nói đúng sự thật, còn một con số điền
          tạm thì về sau không ai biết là đoán.
        </p>

        <div className="mt-4 overflow-hidden rounded-md border border-ban-vien bg-ban-o">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[15px]">Cột</TableHead>
                <TableHead className="text-[15px]">Bắt buộc</TableHead>
                <TableHead className="text-[15px]">Ví dụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COT_MAU.map((c) => (
                <TableRow key={c.ten}>
                  <TableCell className="text-[17px]">{c.ten}</TableCell>
                  <TableCell className="text-[17px]">
                    {c.batBuoc ? (
                      'bắt buộc'
                    ) : (
                      <span className="text-muted-foreground">để trống được</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[17px]">
                    {/* Ví dụ là TÊN NGƯỜI THẬT trong phả ⇒ theo luật bề mặt A: serif-phả. */}
                    <span className="font-[family-name:var(--font-pha)]">{c.viDu}</span>
                    {c.ghiChu ? (
                      <span className="block text-[15px] text-muted-foreground">{c.ghiChu}</span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button type="button" variant="outline" className="mt-4 h-11 text-[17px]">
          Tải file mẫu
        </Button>

        {/* ── Bước 2 — tải lên ──────────────────────────────────────────────── */}
        <h2 className="mt-10 text-[19px] font-semibold">2 · Tải file đã điền lên</h2>

        {/* Ô thả file là HÌNH ẢNH — prototype tĩnh, không action, nút type="button". */}
        <div className="mt-3 rounded-md border-2 border-dashed border-ban-vien bg-ban-o px-6 py-10 text-center">
          <p className="text-[17px]">Kéo file vào đây</p>
          <p className="mt-1 text-[15px] text-muted-foreground">hoặc</p>
          <Button type="button" variant="outline" className="mt-3 h-11 text-[17px]">
            Chọn file từ máy
          </Button>
          <p className="mt-3 text-[15px] text-muted-foreground">Nhận file .csv theo mẫu ở trên</p>
        </div>

        {/* ── Trạng thái phụ: đã chọn file, chưa xem trước ──────────────────── */}
        <hr className="my-12 border-ban-vien" />
        <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
          Trạng thái phụ · đã chọn file
        </p>

        <div className="rounded-md border border-ban-vien bg-ban-o px-5 py-4">
          <p className="text-[17px]">
            <strong>{TEN_FILE_KHUNG}</strong>
          </p>
          <p className="mt-1 text-[17px] text-muted-foreground">
            Đọc được {DONG_KHUNG.length} dòng · 7 cột đúng mẫu
          </p>

          <div className="mt-4 flex items-center gap-4">
            {/* Hành động chính ⇒ son. Đây là chỗ duy nhất trên màn dùng son. */}
            <Button type="button" className="h-11 text-[17px]">
              Xem trước so khớp
            </Button>
            <Button type="button" variant="ghost" className="h-11 text-[17px]">
              Chọn file khác
            </Button>
          </div>

          <p className="mt-3 text-[15px] text-muted-foreground">
            Chưa dòng nào được ghi vào phả.
          </p>
        </div>
      </main>
    </div>
  );
}
