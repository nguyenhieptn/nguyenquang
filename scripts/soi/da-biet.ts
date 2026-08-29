/**
 * NỀN ĐÃ BIẾT — những vi phạm đã tìm ra, đã ghi nợ, và CHƯA vá.
 *
 * ── Vì sao phải có danh sách này, và vì sao nó nguy hiểm ────────────────────────────────────
 * Lượt chạy trọn bộ đầu tiên (28/08) trả về **426 vi phạm** trên 37 lượt đo. Không cái nào giả —
 * nhưng phần lớn là MỘT khiếm khuyết nhân lên: một token màu sai lặp ở 370 chỗ. Để nguyên thì
 * `npm run soi` đỏ vĩnh viễn, và một cổng lúc nào cũng đỏ thì người ta thôi đọc nó — vô dụng
 * ngang một cổng lúc nào cũng xanh.
 *
 * Nhưng một danh sách miễn trừ là chỗ dễ giấu lỗi nhất trong cả bộ đo. Nên nó có ba ràng buộc:
 *
 *  1. Mỗi mục phải nói **vì sao chưa vá** và **ghi nợ ở đâu**. Không có chỗ cho "tạm thời".
 *  2. Bản kê in SỐ LƯỢNG từng mục. Một mục đã biết mà đếm tăng lên là một hồi quy MỚI đang nấp
 *     sau một miễn trừ cũ — và nó nhìn thấy được.
 *  3. Khớp theo `loai` **và** một chuỗi trong mô tả. Miễn trừ cả một `loai` là tắt luôn phép đo.
 */
import type { ViPham } from './luat';

export type MucDaBiet = {
  loai: string;
  /** Chuỗi phải xuất hiện trong `moTa`. Hẹp nhất có thể. */
  khop: string;
  moTa: string;
  viSao: string;
  theoDoi: string;
};

export const DA_BIET: readonly MucDaBiet[] = [
  {
    loai: 'tuong-phan-thap',
    khop: '4.42:1',
    moTa: '`--muted-foreground` #796952 trên nền bàn làm việc #edeae4',
    viSao:
      'Đổi một token màu là quyết định THIẾT KẾ, không phải bản vá kỹ thuật: nó đổi diện mạo mọi ' +
      'màn của bề mặt B, và `specs/frontend-stack.md § 7` buộc đổi token thì đổi cả DESIGN.md. ' +
      'Trên ô bảng trắng #ffffff cùng token ấy đạt 5.31:1 — chỉ nền bàn mới hụt.',
    theoDoi: 'deferred-work.md § 6-6',
  },
  {
    loai: 'tuong-phan-thap',
    khop: '2.72:1',
    moTa: 'chấm tin cậy "tồn nghi" (`--color-tin-ton-nghi`) trên nền bàn',
    viSao:
      'Cùng lớp quyết định thiết kế, nhưng nặng hơn: `EXPERIENCE.md:394` gọi đích danh ca này ' +
      '("≥ 4.5:1, KỂ CẢ node tồn nghi"), và `app/globals.css:191-195` cấm làm mờ tầng tồn nghi ' +
      'vì "làm mờ đóng góp của người vừa khai là giết đúng cảm xúc sản phẩm tồn tại để tạo ra". ' +
      'Hai ràng buộc ấy phải được hoà giải bởi người đặt ra chúng.',
    theoDoi: 'deferred-work.md § 6-6',
  },
  {
    loai: 'tuong-phan-thap',
    khop: 'React Flow',
    moTa: 'nhãn ghi công của thư viện React Flow — 2.85:1',
    viSao: 'Đánh dấu của thư viện, không phải mã của dự án. Gỡ nó là một quyết định về giấy phép.',
    theoDoi: 'deferred-work.md § 6-6',
  },
  {
    loai: 'cham-duoi-san',
    khop: 'React Flow',
    moTa: 'nhãn ghi công React Flow — đích chạm 13×60px',
    viSao:
      'Cùng phần tử của thư viện, cùng quyết định giấy phép. Ghi riêng chứ không gộp vào mục trên: ' +
      'gỡ nhãn ấy chữa cả ba, còn giữ nó thì phải chấp nhận cả ba — và ba con số phải đếm được ' +
      'riêng để không mục nào lặng lẽ biến mất.',
    theoDoi: 'deferred-work.md § 6-6',
  },
  {
    loai: 'chu-duoi-san',
    khop: 'React Flow',
    moTa: 'nhãn ghi công React Flow — chữ 10px, dưới sàn tuyệt đối 15px',
    viSao:
      'Vi phạm NẶNG nhất trong ba mục React Flow — 10px hụt sàn tuyệt đối 5px, mà sàn ấy ' +
      '`DESIGN.md:190-192` nói là "áp cho mọi chữ, không ngoại lệ". Miễn trừ ở đây là miễn trừ ' +
      'cho mã của người khác, không phải cho mã của dự án; nếu giữ thì phải giữ có chủ ý.',
    theoDoi: 'deferred-work.md § 6-6',
  },
  {
    loai: 'tran-bo-cuon',
    khop: '1517px trong hộp 972px',
    moTa: 'hàng chờ: 10 bộ cuộn bảng tràn 1517/972px khi mở hết khối "Trả lại"',
    viSao:
      'Cùng LỚP lỗi mà code review 6-8 đã vá một lần (1239/972, do `whitespace-nowrap`), nhưng đây ' +
      'là ca chưa ai đo: nó chỉ hiện khi mở hết `<details>`, mà bốn script đời trước không mở. Vá ' +
      'nó là sửa bố cục bảng của story 6-8, nằm ngoài phạm vi "dựng cái cân" của 6-6.',
    theoDoi: 'deferred-work.md § 6-6',
  },
  {
    loai: 'cham-duoi-san',
    khop: '23×',
    moTa: 'hợp nhất mảnh: liên kết tên người cao 23px, dưới sàn chạm 44px',
    viSao:
      'Khiếm khuyết THẬT trên một màn chưa script nào từng đo, và trông như một dòng class ' +
      '(`min-h-11 inline-flex items-center`). Không vá trong 6-6 vì story này cố ý không sửa giao ' +
      'diện — nhưng đây là món đáng làm ngay sau, sàn 44px sinh ra cho "người dùng đích có tay run".',
    theoDoi: 'deferred-work.md § 6-6',
  },
];

export function tachDaBiet(ds: readonly ViPham[]): { moi: ViPham[]; daBiet: { vp: ViPham; muc: MucDaBiet }[] } {
  const moi: ViPham[] = [];
  const daBiet: { vp: ViPham; muc: MucDaBiet }[] = [];
  for (const vp of ds) {
    const muc = DA_BIET.find((m) => m.loai === vp.loai && vp.moTa.includes(m.khop));
    if (muc) daBiet.push({ vp, muc });
    else moi.push(vp);
  }
  return { moi, daBiet };
}
