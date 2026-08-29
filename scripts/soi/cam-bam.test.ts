/**
 * KHÔNG SCRIPT NÀO CỦA BỘ ĐO ĐƯỢC BẤM MỘT NÚT GHI.
 *
 * Đọc mã nguồn, không chạy trình duyệt — cùng lối `chrome.test.ts` và `dang-ky.test.ts`.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { NHAN_CAM_BAM, TEP_BO_DO, bieuThucChon, boChuThich } from './cam-bam';

const GOC = path.resolve(__dirname, '..', '..');

describe('bỏ chú thích', () => {
  it('cắt chú thích một dòng', () => {
    expect(boChuThich("const a = 1; // bấm Duyệt").includes('Duyệt')).toBe(false);
  });
  it('cắt chú thích khối', () => {
    expect(boChuThich('/* nói về nút Duyệt */ const a = 1;').includes('Duyệt')).toBe(false);
  });
  it('KHÔNG cắt mã thật', () => {
    expect(boChuThich("p.getByRole('button', { name: 'Duyệt' })").includes('Duyệt')).toBe(true);
  });
});

describe('rút biểu thức chọn phần tử', () => {
  it('lấy được đối số của getByRole', () => {
    expect(bieuThucChon("p.getByRole('button', { name: 'Duyệt' })")[0]).toContain('Duyệt');
  });

  it('cắt theo ngoặc CÂN BẰNG — regex ngây thơ dừng ở ngoặc đầu và bỏ sót phần nguy hiểm', () => {
    const ra = bieuThucChon("p.getByRole('button', { name: /^Ghi \\d+ dòng vào phả$/ })");
    expect(ra[0]).toContain('dòng vào phả');
  });

  it('KHÔNG lấy chuỗi mô tả nằm ngoài biểu thức chọn', () => {
    const ma = "const no = ['chưa ai bấm \"Duyệt cả nhóm\"']; p.locator('main');";
    expect(bieuThucChon(ma).join(' ')).not.toContain('Duyệt');
  });

  it('bắt cả `.click()` trực tiếp trên một chuỗi', () => {
    expect(bieuThucChon("await p.click('text=Duyệt')")[0]).toContain('Duyệt');
  });
});

describe('hàng rào AD-4 — bộ đo không được ghi vào phả', () => {
  it('mọi tệp khai trong TEP_BO_DO đều tồn tại (khai một tệp ma thì cổng gác không khí)', () => {
    const mat = TEP_BO_DO.filter((t) => !existsSync(path.join(GOC, t)));
    expect(mat, `Tệp khai mà không có thật: ${mat.join(', ')}`).toEqual([]);
  });

  for (const tep of TEP_BO_DO) {
    it(`${tep} không nhắc tới nhãn của điều khiển GHI trong phần mã`, () => {
      const duong = path.join(GOC, tep);
      if (!existsSync(duong)) return;
      const chon = bieuThucChon(boChuThich(readFileSync(duong, 'utf8'))).join('\n');
      const dinh = NHAN_CAM_BAM.filter((r) => r.test(chon)).map((r) => r.source);
      expect(
        dinh,
        `${tep} nhắm vào điều khiển GHI: ${dinh.join(' · ')}\n` +
          'Bộ đo chỉ ĐỌC. Nhắc tới nút ghi trong chú thích thì được; nhắm vào nó thì không.',
      ).toEqual([]);
    });
  }
});
