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
