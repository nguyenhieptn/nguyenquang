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
 *
 * Mục đã GỠ vì đã vá (không chỉ vì hết đếm): chấm tin cậy "tồn nghi" 2.72:1 — story 6-10 cho chấm
 * mang màu mực và phân biệt bằng hình (`the-nguoi.tsx § MAU_TIN_CAY`). Một mục vá xong mà còn
 * nằm đây là một miễn trừ chờ hồi quy chui vào.
 */
import type { ViPham } from './luat';

export type MucDaBiet = {
  loai: string;
  /** Chuỗi phải xuất hiện trong `moTa`. Hẹp nhất có thể. */
  khop: string;
  /**
   * Khoá màn mà món nợ này thuộc về. VẮNG nghĩa là mọi màn — chỉ dành cho nợ ở tầng TOKEN, tức
   * một màu sai lặp ở mọi nơi. Nợ của MỘT màn mà không khai khoá thì `khop` của nó nuốt luôn vi
   * phạm cùng hình ở màn khác: `23×` từng khớp mọi đích chạm cao 23px trên cả sản phẩm, chứ không
   * chỉ tám liên kết ở hợp nhất mảnh (code review 6-6).
   */
  man?: string;
  /**
   * Số vi phạm đếm được lúc ghi nợ. Đếm VƯỢT là một hồi quy mới đang nấp sau một miễn trừ cũ —
   * bản kê nêu ra thành mục cần mắt, không hạ cổng: con số phụ thuộc DỮ LIỆU đang có (một dòng
   * họ nhiều người thì nhiều chữ phụ hơn), nên đỏ vì nó là đỏ oan trên mọi phả khác phả đã đo.
   */
  toiDa: number;
  moTa: string;
  viSao: string;
  theoDoi: string;
};

export const DA_BIET: readonly MucDaBiet[] = [
  {
    loai: 'tuong-phan-thap',
    khop: '4.42:1',
    toiDa: 185,
    moTa: '`--muted-foreground` #796952 trên nền bàn làm việc #edeae4',
    viSao:
      'Đổi một token màu là quyết định THIẾT KẾ, không phải bản vá kỹ thuật: nó đổi diện mạo mọi ' +
      'màn của bề mặt B, và `specs/frontend-stack.md § 7` buộc đổi token thì đổi cả DESIGN.md. ' +
      'Trên ô bảng trắng #ffffff cùng token ấy đạt 5.31:1 — chỉ nền bàn mới hụt.',
    theoDoi: 'deferred-work.md § 6-6',
  },
  {
    loai: 'tuong-phan-thap',
    khop: 'React Flow',
    // 3 = hai lượt `/admin/cay` (cay · cay-them) + `/gia-pha` ở 1280 (story 6-10 thêm canvas thứ ba).
    toiDa: 3,
    moTa: 'nhãn ghi công của thư viện React Flow — 2.85:1',
    viSao: 'Đánh dấu của thư viện, không phải mã của dự án. Gỡ nó là một quyết định về giấy phép.',
    theoDoi: 'deferred-work.md § 6-6',
  },
  {
    loai: 'cham-duoi-san',
    khop: 'React Flow',
    // 3 = hai lượt `/admin/cay` (cay · cay-them) + `/gia-pha` ở 1280 (story 6-10 thêm canvas thứ ba).
    toiDa: 3,
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
    // 3 = hai lượt `/admin/cay` (cay · cay-them) + `/gia-pha` ở 1280 (story 6-10 thêm canvas thứ ba).
    toiDa: 3,
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
    man: 'hang-cho',
    toiDa: 10,
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
    man: 'hop-nhat',
    toiDa: 8,
    moTa: 'hợp nhất mảnh: liên kết tên người cao 23px, dưới sàn chạm 44px',
    viSao:
      'Khiếm khuyết THẬT trên một màn chưa script nào từng đo, và trông như một dòng class ' +
      '(`min-h-11 inline-flex items-center`). Không vá trong 6-6 vì story này cố ý không sửa giao ' +
      'diện — nhưng đây là món đáng làm ngay sau, sàn 44px sinh ra cho "người dùng đích có tay run".',
    theoDoi: 'deferred-work.md § 6-6',
  },
];

/**
 * Tách vi phạm MỚI khỏi nợ đã ghi. `khoa` là màn đang đo — nợ khai `man` chỉ khớp trên đúng màn
 * ấy; không truyền `khoa` (bài test, hoặc một bản kê không theo màn) thì nợ theo màn không khớp
 * gì cả, tức nghiêng về phía ĐỎ.
 */
export function tachDaBiet(
  ds: readonly ViPham[],
  khoa?: string,
): { moi: ViPham[]; daBiet: { vp: ViPham; muc: MucDaBiet }[] } {
  const moi: ViPham[] = [];
  const daBiet: { vp: ViPham; muc: MucDaBiet }[] = [];
  for (const vp of ds) {
    const muc = DA_BIET.find(
      (m) => m.loai === vp.loai && vp.moTa.includes(m.khop) && (m.man === undefined || m.man === khoa),
    );
    if (muc) daBiet.push({ vp, muc });
    else moi.push(vp);
  }
  return { moi, daBiet };
}
