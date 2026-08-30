/**
 * DANH SÁCH CẤM BẤM.
 *
 * Bộ đo chạy trên phả THẬT. Kho không có phép xoá (AD-4), nên mọi lượt ghi là vĩnh viễn — và
 * chuyện này đã xảy ra rồi: một lượt bấm thử của agent nâng tầng **40 khẳng định**, không gỡ lại
 * được. [Source: 6-9-nhap-nhanh-tren-canvas.md:467-470]
 *
 * Đây không phải lời dặn. `cam-bam.test.ts` đọc mã nguồn của cả bộ đo và ĐỎ nếu một trong những
 * nhãn dưới đây xuất hiện trong một BIỂU THỨC CHỌN PHẦN TỬ — `getByRole`, `getByText`, `locator`,
 * … — tức đúng chỗ người ta viết khi định bấm vào nó.
 *
 * Bản đầu soi cả tệp và ĐỎ ngay lượt chạy thứ nhất, nhưng đỏ oan: nó bắt trúng những chuỗi MÔ TẢ
 * trong bản đăng ký ("chưa ai bấm Duyệt cả nhóm" ở mục nợ). Một cổng đỏ oan sẽ bị người ta tắt
 * đi, nên nó phải nhắm đúng — chọn tử, không phải văn xuôi.
 */

/** Nhãn của những điều khiển GHI vĩnh viễn vào phả. */
export const NHAN_CAM_BAM: readonly RegExp[] = [
  /Duyệt/, // Duyệt · Duyệt cả nhóm · Duyệt trọn người này — nâng lên Tầng chính thức (AD-9)
  /Trả lại/, // trả khẳng định về người khai — cũng là một lượt ghi
  /Ghi \S+ dòng vào phả/, // nút ghi của bộ nạp khung
  /Ghi vào phả/,
  /Nâng lên chính thức/,
  /Loại quan hệ này/, // gỡ một cạnh cha-con / vợ chồng
  /Loại khẳng định/,
  /Gộp hai người/,
  /Tách lại/,
  /Trao vai/,
  /Đổi vai/,
  /Gỡ gắn kết/,
  /Xoá/,
  // ── Thêm sau code review 6-6: bản đầu liệt kê theo trí nhớ, và quét mã nguồn ra thêm mười ────
  // hai nhãn GHI thật mà danh sách bỏ sót. Mỗi dòng dưới trỏ vào một nút có thật.
  /Nhận vào phả/, // thao-tac-xin-vao-pha — trao quyền ghi và mở bán kính riêng tư
  /Xác nhận từ chối/, // cùng panel — từ chối một yêu cầu vào phả
  /Đây là mình/, // gan-node — gửi lời nhận chỗ (`requestAttachment`)
  /Gộp —/, // hop-nhat — gộp hai hồ sơ (AD-3, huỷ được nhưng vẫn là một lượt ghi)
  /Xác nhận gỡ/, // tai-khoan — gỡ gắn kết của người khác
  /Nâng các dòng/, // hang-cho — nâng hàng loạt lên Tầng chính thức
  /Ghi vào sổ dòng họ/, // so-dong-ho — đổi tên họ, chữ đệm, đề từ
  /Lưu vào phả/, // loi-ke/thu — gửi một bản thu lên kho media
  /Ẩn khỏi phần/, // toi — FR-55, đổi `hiddenFromPublic`
  /Hiện lại với cả họ/,
  /Không in tên/, // toi — FR-55, đổi `refusePrint`
  /Cho in tên/,
  /Đã xem/, // toi — đánh dấu thông báo (ngoại lệ AD-10, nhưng vẫn là một lượt ghi)
  /Để nguyên như đang ghi/,
  /Tạo tài khoản/, // dang-nhap — ghi vào bảng tài khoản
  /Đăng xuất/, // toi — xoá phiên; không ghi vào phả, nhưng làm hỏng mọi phép đo sau nó
  /Ghi lại/, // noi-chon (6-4) — sửa tên / đơn vị cha của một nơi
];

/**
 * Tệp mã nguồn của bộ đo. Mọi tệp ở đây bị `cam-bam.test.ts` soi.
 * Thêm tệp mới vào bộ đo thì thêm vào đây — nếu không, tệp ấy không ai gác.
 */
export const TEP_BO_DO: readonly string[] = [
  'scripts/soi.ts',
  'scripts/soi/dang-ky.ts',
  'scripts/soi/trinh-duyet.ts',
  'scripts/soi/thu-so.ts',
  'scripts/soi/xem-truoc.ts',
  'scripts/soi/ban-ke.ts',
];

/**
 * Bỏ chú thích khỏi mã nguồn, để bài test soi đúng phần MÃ.
 *
 * Cố ý thô: chỉ cắt `//…` và `/*…*\/`. Nó có thể cắt nhầm một chuỗi chứa `//` (như `http://`),
 * và thế là AN TOÀN theo đúng hướng — cắt nhầm chỉ làm cổng bỏ sót ít hơn, không bao giờ làm nó
 * đỏ oan.
 */
export function boChuThich(ma: string): string {
  return ma.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
}

/** Những hàm nhận vào một chọn tử hoặc một nhãn để TÌM phần tử — tức chỗ dẫn tới một cú bấm. */
const HAM_CHON = /\.(getByRole|getByText|getByLabel|getByTitle|getByPlaceholder|getByAltText|getByTestId|locator|click)\s*\(/g;

/**
 * Rút ra phần văn bản nằm trong các biểu thức chọn phần tử.
 *
 * Cắt theo dấu ngoặc cân bằng chứ không theo `[^)]*` — `getByRole('button', { name: /^Ghi \d+/ })`
 * có ngoặc lồng, và một regex ngây thơ sẽ dừng ở ngoặc đầu tiên rồi bỏ sót đúng phần nguy hiểm.
 */
export function bieuThucChon(ma: string): string[] {
  const ra: string[] = [];
  for (const khop of ma.matchAll(HAM_CHON)) {
    let i = (khop.index ?? 0) + khop[0].length;
    let sau = 1;
    const dau = i;
    while (i < ma.length && sau > 0) {
      const c = ma[i];
      if (c === '(') sau++;
      else if (c === ')') sau--;
      i++;
    }
    ra.push(ma.slice(dau, i - 1));
  }
  return ra;
}
