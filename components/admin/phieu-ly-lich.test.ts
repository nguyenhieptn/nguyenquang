/**
 * Phiếu lý lịch ở cột phải (thu gọn 26/08/2026) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import {
  chenHangCon,
  hangNguon,
  hienGiaTriTrongChiTiet,
  KHOA_CON,
  type NguonDong,
} from './phieu-ly-lich';

/** Thứ tự `core/person/chong.ts § HANG` trả về cho một người có đủ mọi loại. */
const DU = [
  'name',
  'gender',
  'birth',
  'death',
  'parent-child',
  'union-partner',
  'place',
  'note',
] as const;

describe('chèn hàng Con', () => {
  it('có Vợ chồng ⇒ Con đứng ngay sau, TRƯỚC nơi chốn và ghi chú', () => {
    expect(chenHangCon(DU, true)).toEqual([
      'name',
      'gender',
      'birth',
      'death',
      'parent-child',
      'union-partner',
      KHOA_CON,
      'place',
      'note',
    ]);
  });

  it('chưa lập gia đình mà đã có con ⇒ Con bám Cha mẹ', () => {
    expect(chenHangCon(['name', 'birth', 'parent-child', 'note'], true)).toEqual([
      'name',
      'birth',
      'parent-child',
      KHOA_CON,
      'note',
    ]);
  });

  /** Không có neo nào thì XUỐNG CUỐI — lên đầu là Con đứng trên cả Tên. */
  it('không có cha mẹ lẫn vợ chồng ⇒ Con xuống cuối, không lên đầu', () => {
    expect(chenHangCon(['name', 'birth'], true)).toEqual(['name', 'birth', KHOA_CON]);
  });

  it('người mới toanh chưa có chồng nào ⇒ phiếu chỉ có hàng Con', () => {
    expect(chenHangCon([], true)).toEqual([KHOA_CON]);
  });

  it('không có con ⇒ không chèn gì, thứ tự giữ nguyên', () => {
    expect(chenHangCon(DU, false)).toEqual([...DU]);
    expect(chenHangCon([], false)).toEqual([]);
  });

  it('không sửa mảng gọi vào', () => {
    const vao = ['name', 'union-partner'];
    chenHangCon(vao, true);
    expect(vao).toEqual(['name', 'union-partner']);
  });
});

const nguon = (d: Partial<NguonDong> = {}): NguonDong => ({
  chinhThuc: false,
  tinCay: 'theo-loi-ke',
  xuatXu: '',
  nguoiGhi: '',
  luc: '',
  ...d,
});

describe('câu nguồn — hai hàng', () => {
  /**
   * HAI hàng, không một: *cái này chắc tới đâu* và *nghe từ đâu, ai ghi* là hai câu hỏi khác
   * nhau. Nối làm một thì trong cột 360px nó quấn ba dòng và người đọc phải tự tách bằng mắt.
   */
  it('đủ bốn mục ⇒ hai hàng: chắc-tới-đâu, rồi nghe-từ-đâu', () => {
    expect(
      hangNguon(
        nguon({
          chinhThuc: true,
          tinCay: 'chac-chan',
          xuatXu: 'giấy khai sinh',
          nguoiGhi: 'Nguyễn Quang Hiệp',
          luc: '18/03/2026',
        }),
      ),
    ).toEqual(['Tầng chính thức · chắc chắn', 'giấy khai sinh · Nguyễn Quang Hiệp ghi 18/03/2026']);
  });

  /**
   * Tầng và mức tin cậy là hai trục khác nhau, nhưng ở ca mặc định của hệ này (AD-9) chúng nói
   * đúng cùng một chữ. In hai lần là đọc như máy hỏng.
   */
  it('tầng tồn nghi + mức tồn nghi ⇒ nói MỘT lần, không "Tầng tồn nghi · tồn nghi"', () => {
    expect(hangNguon(nguon({ tinCay: 'ton-nghi', nguoiGhi: 'Khánh', luc: '02/04/2026' })).join(' · ')).toBe(
      'Tầng tồn nghi · Khánh ghi 02/04/2026',
    );
  });

  it('tầng tồn nghi + mức theo lời kể ⇒ giữ CẢ HAI, chúng nói hai chuyện khác nhau', () => {
    expect(hangNguon(nguon({ tinCay: 'theo-loi-ke', xuatXu: 'lời cụ Bảng' })).join(' · ')).toBe(
      'Tầng tồn nghi · theo lời kể · lời cụ Bảng',
    );
  });

  it('Tầng chính thức mà mức vẫn tồn nghi ⇒ giữ cả hai — nâng tầng không đổi mức tin cậy', () => {
    expect(hangNguon(nguon({ chinhThuc: true, tinCay: 'ton-nghi' })).join(' · ')).toBe('Tầng chính thức · tồn nghi');
  });

  it('vắng xuất xứ ⇒ bỏ hẳn mục ấy, không để lại dấu chấm treo', () => {
    expect(hangNguon(nguon({ tinCay: 'chac-chan', nguoiGhi: 'Hiệp', luc: '18/03/2026' })).join(' · ')).toBe(
      'Tầng tồn nghi · chắc chắn · Hiệp ghi 18/03/2026',
    );
  });

  it('khoảng trắng suông cũng là vắng', () => {
    expect(hangNguon(nguon({ tinCay: 'chac-chan', xuatXu: '   ', nguoiGhi: ' ', luc: ' ' })).join(' · ')).toBe(
      'Tầng tồn nghi · chắc chắn',
    );
  });

  it('vắng tên người ghi ⇒ còn cái ngày, KHÔNG in "ghi" cụt đầu', () => {
    expect(hangNguon(nguon({ tinCay: 'chac-chan', luc: '18/03/2026' })).join(' · ')).toBe(
      'Tầng tồn nghi · chắc chắn · 18/03/2026',
    );
  });

  it('có tên mà vắng ngày ⇒ vẫn ghi công, chỉ thiếu mốc', () => {
    expect(hangNguon(nguon({ tinCay: 'chac-chan', nguoiGhi: 'Khánh' })).join(' · ')).toBe(
      'Tầng tồn nghi · chắc chắn · Khánh ghi',
    );
  });
});

describe('có in lại giá trị trong khối chi tiết không', () => {
  const hoi = (d: Partial<Parameters<typeof hienGiaTriTrongChiTiet>[0]>) =>
    hienGiaTriTrongChiTiet({ mauThuan: false, soDong: 1, giaTriGon: '', chuTrenHang: [], ...d });

  it('mâu thuẫn ⇒ in — cả hai giá trị phải thấy được cùng lúc', () => {
    expect(hoi({ mauThuan: true, soDong: 2, giaTriGon: '1986' })).toBe(true);
  });

  it('chồng nhiều dòng ⇒ in, kẻo hai nút không nói được chúng thuộc giá trị nào', () => {
    expect(hoi({ soDong: 2, giaTriGon: 'quê quán: Quang Trung' })).toBe(true);
  });

  it('hàng thường một dòng ⇒ IM, giá trị vừa đứng ngay trên', () => {
    expect(hoi({ giaTriGon: '1986' })).toBe(false);
  });

  it('chip cha mẹ ⇒ in, vì chuỗi mang thêm rel mà chip không mang', () => {
    expect(
      hoi({
        giaTriGon: 'là con ruột của Nguyễn Quang Vinh',
        chuTrenHang: ['Nguyễn Quang Vinh'],
      }),
    ).toBe(true);
  });

  it('chip vợ chồng ⇒ IM, chuỗi đúng bằng chữ trên chip', () => {
    expect(
      hoi({ giaTriGon: 'Kiều Thị Thanh Nga', chuTrenHang: ['Kiều Thị Thanh Nga'] }),
    ).toBe(false);
  });

  it('nhiều chip, giá trị khớp một cái ⇒ IM', () => {
    expect(
      hoi({ giaTriGon: 'Quản Thị Huyền', chuTrenHang: ['Kiều Thị Thanh Nga', 'Quản Thị Huyền'] }),
    ).toBe(false);
  });

  /** Người kia ngoài bán kính riêng tư ⇒ hàng rơi về chuỗi chữ, `chuTrenHang` rỗng. */
  it('vắng chip ⇒ IM, vì hàng đang bày chính chuỗi ấy', () => {
    expect(hoi({ giaTriGon: 'là con ruột của một người' })).toBe(false);
  });
});
