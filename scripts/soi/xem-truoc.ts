/**
 * Đưa `/admin/nap-khung` về trạng thái CÓ DỮ LIỆU: tải một tệp mẫu lên và mở bảng xem trước.
 *
 * ⚠ Bước này DỪNG ở bảng xem trước. Nút ghi ở cuối màn là một lượt ghi vĩnh viễn vào phả (AD-4)
 * và bộ đo không bao giờ chạm tới nó — `cam-bam.test.ts` gác chuyện ấy trên chính tệp này.
 *
 * Tệp mẫu giữ nguyên từ `soi-nap-khung.mjs` của story 6-3: năm ca sinh ra đủ năm loại cảnh báo,
 * và KHÔNG mượn tên nào của phả thật, nên cảnh báo đọc được không phụ thuộc dữ liệu đang có.
 */
import type { Page } from 'playwright';

const GHI_CHU_DAI =
  'Cụ có công mở ấp, dựng đình làng năm Bính Tuất, con cháu bốn đời sau vẫn giỗ vào rằm tháng bảy — chép theo lời cụ Bảng kể lại năm 1998';

/**
 *   dòng 2,3  hai người trùng tên  ⇒ nghi trùng (duplicate-in-file)
 *   dòng 4    con của họ            ⇒ father-ambiguous
 *   dòng 5    cha duy nhất
 *   dòng 6    con của cha ấy
 *   dòng 7,8  vợ mơ hồ + chồng     ⇒ spouse-ambiguous
 *   dòng 9    chồng có vợ vắng      ⇒ spouse-not-found
 */
const CSV = [
  'ho_ten,gioi_tinh,nam_sinh,nam_mat,ten_cha,ten_vo_chong,chi,ghi_chu',
  `Soi Cha Hai Bản,nam,1940,,,,Chi Nhất,"${GHI_CHU_DAI}"`,
  'Soi Cha Hai Bản,nam,1958,,,,Chi Ba,',
  'Soi Con Của Hai Bản,nam,1980,,Soi Cha Hai Bản,,,',
  'Soi Cha Duy Nhất,nam,1900,,,,,',
  'Soi Con Của Cha Duy Nhất,nam,1935,,Soi Cha Duy Nhất,,,',
  'Soi Vợ Mơ Hồ,nu,1940,,,,,',
  'Soi Vợ Mơ Hồ,nu,1958,,,,,',
  'Soi Chồng Của Vợ Mơ Hồ,nam,1938,,,Soi Vợ Mơ Hồ,,',
  'Soi Chồng Có Vợ Vắng,nam,1930,,,Soi Vợ Không Ai Biết,,',
  '',
].join('\n');

export async function moBangXemTruoc(p: Page): Promise<void> {
  await p.setInputFiles('input[name="tep"]', {
    name: 'soi-nam-ca.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('﻿' + CSV, 'utf8'),
  });
  await p.getByRole('button', { name: 'Xem trước so khớp' }).click();
  /**
   * Đợi BẢNG hiện ra, không đợi nút ở cuối màn.
   *
   * Bản `soi-nap-khung.mjs` đợi đúng cái nút ghi bằng `getByRole(... /^Ghi \d+ dòng vào phả$/)`.
   * Chờ thì vô hại, nhưng nó viết ra một chọn tử nhắm thẳng vào nút ghi — và một chọn tử đã có
   * sẵn ở đó thì chỉ cách một cú `.click()` của người sửa sau. Đợi bảng là đủ và không để lại
   * cái mồi ấy.
   */
  await p.locator('table tbody tr').first().waitFor({ timeout: 30000 });
  await p.waitForTimeout(600);
}
