/**
 * BẢN ĐĂNG KÝ đối chiếu MÃ NGUỒN — không render gì cả.
 *
 * Con bug cần chặn ở đây không phải "màn này đo sai", mà **"một màn nào đó không ai đo"**. Một
 * bài test mở trình duyệt thì kiểm đúng những màn nó mở; một bài test đọc mã nguồn thì bắt được
 * cả màn người sau thêm vào rồi quên khai. Lối mượn thẳng từ `app/admin/chrome.test.ts`.
 *
 * Bài học đắt của chính story này: lượt liệt kê route đầu tiên — bằng mắt — bỏ sót `/them`, trang
 * chỉ mục của luồng bốn bước. Danh sách chép tay không giữ được; bài test thì giữ.
 */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DANG_KY, KHUNG, duongTuTep, timMan } from './dang-ky';

const GOC = path.resolve(__dirname, '..', '..');
const GOC_APP = path.join(GOC, 'app');

/**
 * `uiworkshop/` đứng ngoài: nó `notFound()` khi `NODE_ENV === 'production'`
 * (`app/uiworkshop/layout.tsx`), nên nó không phải bề mặt sản phẩm. Năm mươi mốt chỗ chữ nhỏ
 * trong đó là CỐ Ý và không chịu sàn.
 */
const NGOAI_PHAM = ['uiworkshop'];

function moiTrangTrong(thuMuc: string): string[] {
  const ra: string[] = [];
  for (const ten of readdirSync(thuMuc)) {
    if (NGOAI_PHAM.includes(ten)) continue;
    const duong = path.join(thuMuc, ten);
    if (statSync(duong).isDirectory()) ra.push(...moiTrangTrong(duong));
    else if (ten === 'page.tsx') ra.push(duong);
  }
  return ra;
}

const TRANG = moiTrangTrong(GOC_APP);
const DUONG_THAT = TRANG.map(duongTuTep).sort();

describe('quy đường dẫn tệp về URL', () => {
  it('bỏ nhóm route vì chúng không có trong URL', () => {
    expect(duongTuTep('app/(pha)/loi-ke/thu/page.tsx')).toBe('/loi-ke/thu');
  });
  it('trang gốc của một nhóm route ra "/"', () => {
    expect(duongTuTep('app/(pha)/page.tsx')).toBe('/');
  });
  it('giữ nguyên đoạn động', () => {
    expect(duongTuTep('app/(pha)/nguoi/[id]/page.tsx')).toBe('/nguoi/[id]');
  });
  it('giữ nguyên catch-all', () => {
    expect(duongTuTep('app/admin/[...khong-co-man]/page.tsx')).toBe('/admin/[...khong-co-man]');
  });
  it('chạy được trên đường dẫn tuyệt đối', () => {
    expect(duongTuTep('/home/ai/du-an/app/admin/cay/page.tsx')).toBe('/admin/cay');
  });
});

describe('bản đăng ký phủ hết mã nguồn', () => {
  it('tìm được trang trong app/ (nếu 0 thì chính bài test này hỏng, không phải mã sạch)', () => {
    expect(TRANG.length).toBeGreaterThan(20);
  });

  it('MỌI page.tsx đều có một dòng trong bản đăng ký', () => {
    const thieu = DUONG_THAT.filter((d) => !timMan(d));
    expect(thieu, `Màn chưa khai trong scripts/soi/dang-ky.ts:\n  ${thieu.join('\n  ')}`).toEqual([]);
  });

  it('KHÔNG dòng nào trong bản đăng ký trỏ vào màn không tồn tại', () => {
    const thua = DANG_KY.map((m) => m.duong).filter((d) => !DUONG_THAT.includes(d));
    expect(thua, `Dòng trỏ vào màn đã xoá hoặc gõ sai:\n  ${thua.join('\n  ')}`).toEqual([]);
  });

  it('không khoá nào trùng nhau — khoá là thứ gõ trên dòng lệnh', () => {
    const khoa = DANG_KY.map((m) => m.khoa);
    expect(new Set(khoa).size).toBe(khoa.length);
  });
});

describe('mỗi dòng đủ thông tin để chạy', () => {
  it('màn có đoạn động thì phải có cách giải ra đường thật', () => {
    const hong = DANG_KY.filter((m) => /\[.+\]/.test(m.duong) && !m.giaiDuong).map((m) => m.khoa);
    expect(hong, `Đoạn động mà không có \`giaiDuong\`: ${hong.join(', ')}`).toEqual([]);
  });

  it('mỗi màn khai ít nhất một khung nhìn và một phép đo', () => {
    for (const m of DANG_KY) {
      expect(m.rong.length, `${m.khoa} không khai khung nhìn`).toBeGreaterThan(0);
      expect(m.pheDo.length, `${m.khoa} không khai phép đo nào`).toBeGreaterThan(0);
    }
  });

  it('mỗi màn nói được nó bày gì', () => {
    for (const m of DANG_KY) expect(m.bay.length, m.khoa).toBeGreaterThan(5);
  });
});

describe('sàn viết cho điện thoại thì điện thoại phải được đo', () => {
  it('MỌI màn bề mặt A đo ở 390px', () => {
    const bo = DANG_KY.filter((m) => m.beMat === 'A' && !m.rong.includes(KHUNG.dienThoai)).map((m) => m.khoa);
    expect(bo, `Màn bề mặt A không đo ở 390px: ${bo.join(', ')}`).toEqual([]);
  });

  it('MỌI màn bề mặt B đo ở 1280px', () => {
    const bo = DANG_KY.filter((m) => m.beMat === 'B' && !m.rong.includes(KHUNG.may)).map((m) => m.khoa);
    expect(bo).toEqual([]);
  });

  it('bề mặt A có ít nhất mười lăm màn — nếu tụt xuống thì ai đó vừa xoá mà không ai biết', () => {
    expect(DANG_KY.filter((m) => m.beMat === 'A').length).toBeGreaterThanOrEqual(15);
  });
});
