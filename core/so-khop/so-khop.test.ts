/**
 * Ca kiểm cho tầng so khớp tất định.
 *
 * Chạy: `npm run test:so-khop`
 *
 * Ca lấy từ dữ liệu thật của seed — cụ Đệ có hai bản ở hai mảnh, hai cụ Hùng trùng tên cách nhau
 * 17 năm. Đó là những ca mà so khớp sai làm hỏng phả một chi, nên chúng phải là ca kiểm chứ không
 * phải ví dụ trong tài liệu.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { chuanHoa, soTen, tachTen } from './chuan-hoa';
import { luatCung, type MocKhai, type UngVienTho } from './cham-diem';
import { soKhopMoc } from './index';
import { bienNamSinh, nhan, nhanDien, tra, viTriTrongPha } from './xung-ho';

function nguoi(p: Partial<UngVienTho> & Pick<UngVienTho, 'id' | 'hoTen'>): UngVienTho {
  return { gioiTinh: 'nam', conSong: false, doi: 3, ...p };
}

describe('chuẩn hoá tên (AD-16)', () => {
  it('bỏ dấu thanh, dấu mũ và hạ đ→d', () => {
    assert.equal(chuanHoa('Nguyễn Quang Đệ'), 'nguyen quang de');
    assert.equal(chuanHoa('  TRẦN   Thị  Vẽ '), 'tran thi ve');
  });

  it('tách tên thành họ / đệm / tên chính', () => {
    assert.deepEqual(tachTen('Nguyễn Quang Thuyết'), {
      ho: 'nguyen', dem: ['quang'], ten: 'thuyet',
    });
    assert.deepEqual(tachTen('Trần Vẽ'), { ho: 'tran', dem: [], ten: 've' });
  });

  it('cùng họ KHÔNG được tính là bằng chứng mạnh — trong phả họ thì ai cũng cùng họ', () => {
    const cungHo = soTen('Nguyễn Quang An', 'Nguyễn Quang Bình');
    assert.ok(cungHo.diem < 0.5, `cùng họ+đệm khác tên phải điểm thấp, đang là ${cungHo.diem}`);
    assert.ok(cungHo.khac.some((k) => k.includes('Tên chính khác')));
  });

  it('khớp được qua tên huý — cụ trong phả thường chỉ được chép bằng tên huý', () => {
    const kq = soTen('Nguyễn Quang Đệ', 'Nguyễn Quang Bảng', ['Nguyễn Quang Đệ']);
    assert.equal(kq.diem, 1);
    assert.ok(kq.giong[0].includes('tên huý'));
  });

  it('luôn trả cả cột khác, không chỉ cột giống', () => {
    const kq = soTen('Nguyễn Quang Đệ', 'Nguyễn Văn Đệ');
    assert.ok(kq.giong.length > 0);
    assert.ok(kq.khac.length > 0, 'khác tên đệm mà không báo là bảng dụ người bấm gộp');
  });
});

describe('xưng hô → vị trí cấu trúc', () => {
  it('nhận diện được biến thể vùng miền', () => {
    assert.equal(nhanDien('bố'), 'bo');
    assert.equal(nhanDien('Thầy'), 'bo');
    assert.equal(nhanDien('  ÔNG   NỘI '), 'ong-noi');
    assert.equal(nhanDien('hàng xóm'), null, 'không nhận ra thì trả null, không đoán');
  });

  it('DẤU phân biệt nghĩa: cô (đời −1) không được lẫn với cố (đời −3)', () => {
    assert.equal(nhanDien('cô'), 'co');
    assert.equal(nhanDien('cố'), 'cu-ong');
    assert.equal(tra('co').doiLech, -1);
    assert.equal(tra('cu-ong').doiLech, -3);
    // Gõ không dấu thì hai nghĩa đụng nhau — hỏi lại, KHÔNG chọn hộ một bên.
    assert.equal(nhanDien('co'), null, 'không dấu mà đụng nghĩa thì phải trả null');
  });

  it('bà không được đọc thành ba (tiếng Nam gọi bố)', () => {
    assert.equal(nhanDien('ba'), 'bo');
    assert.equal(nhanDien('bà nội'), 'ba-noi');
    assert.equal(nhanDien('bà ngoại'), 'ba-ngoai');
  });

  it('nhãn hiện lên màn là tiếng Việt có dấu, không phải khoá máy', () => {
    assert.equal(nhan('cau'), 'cậu');
    assert.equal(nhan('cu-ong'), 'cụ ông');
    assert.equal(nhan('chat'), 'chắt');
  });

  it('chú là em trai bố: bên nội, nam, huyết thống, sinh sau bố', () => {
    const t = tra('chu');
    assert.equal(t.doiLech, -1);
    assert.equal(t.ben, 'noi');
    assert.equal(t.gioiTinh, 'nam');
    assert.equal(t.huyetThong, true);
    assert.equal(t.thuBac, 'duoi');
  });

  it('cậu và dì là bên ngoại → NGOÀI cuốn phả họ này', () => {
    assert.equal(viTriTrongPha('cau'), 'ngoai-ho');
    assert.equal(viTriTrongPha('di'), 'ngoai-ho');
    assert.equal(viTriTrongPha('ba-ngoai'), 'ngoai-ho');
  });

  it('chú, cô, ông nội là trong chính phả; thím và mẹ cũng vậy (chính phả chép vợ)', () => {
    for (const q of ['chu', 'co', 'ong-noi', 'bo'] as const) {
      assert.equal(viTriTrongPha(q), 'chinh-pha', q);
    }
    assert.equal(viTriTrongPha('me'), 'chinh-pha');
    assert.equal(viTriTrongPha('thim'), 'chinh-pha');
  });

  it('mẫu hệ đảo bên — không hardcode dòng họ nào (AD-14)', () => {
    assert.equal(viTriTrongPha('cau', 'mau-he'), 'chinh-pha');
    assert.equal(viTriTrongPha('chu', 'mau-he'), 'ngoai-ho');
  });

  it('từ mơ hồ mang theo lời cảnh báo thay vì tự chọn một nghĩa', () => {
    assert.ok(tra('bac').mapHo, '“bác” mơ hồ nội/ngoại — phải nói ra');
    assert.ok(tra('chau').mapHo, '“cháu” mơ hồ đời +1/+2 — phải nói ra');
    assert.equal(tra('chu').mapHo, undefined, '“chú” không mơ hồ — đừng cảnh báo thừa');
  });

  it('biên năm sinh: bề trên sinh trước, con cháu sinh sau', () => {
    const ong = bienNamSinh(-2);
    assert.ok(ong.toiThieu > 0 && ong.toiDa > ong.toiThieu);
    const con = bienNamSinh(1);
    assert.ok(con.toiDa < 0, 'con phải sinh SAU người khai');
  });
});

describe('luật cứng — loại thẳng, không trừ điểm', () => {
  const moc: MocKhai = { quanHe: 'chu', hoTen: 'Nguyễn Quang Bảng', namSinhNguoiKhai: 2004 };

  it('người còn sống không bao giờ là ứng viên tự động (FR-37, AD-13)', () => {
    const ly = luatCung(moc, nguoi({ id: 'n-1', hoTen: 'Nguyễn Quang Bảng', conSong: true }));
    assert.ok(ly?.includes('còn sống'));
  });

  it('sai giới tính so với từ xưng hô là loại, không phải kém giống', () => {
    const ly = luatCung(moc, nguoi({ id: 'n-2', hoTen: 'Nguyễn Quang Bảng', gioiTinh: 'nu' }));
    assert.ok(ly?.includes('giới tính'));
  });

  it('lệch năm mất là loại — năm mất là mốc người ta nhớ chắc vì giỗ hằng năm', () => {
    const m: MocKhai = { quanHe: 'ong-noi', hoTen: 'Nguyễn Quang Đệ', namMat: 1954 };
    const ly = luatCung(m, nguoi({ id: 'n-3', hoTen: 'Nguyễn Quang Đệ', namMat: 1970 }));
    assert.ok(ly?.includes('Năm mất khác'));
  });

  it('năm sinh ngoài biên đời là loại', () => {
    const ly = luatCung(moc, nguoi({ id: 'n-4', hoTen: 'Nguyễn Quang Bảng', namSinh: 1998 }));
    assert.ok(ly?.includes('ngoài biên'), `phải loại vì chú sinh 1998 mà cháu sinh 2004; nhận: ${ly}`);
  });

  it('ứng viên hợp lệ thì không bị loại', () => {
    assert.equal(luatCung(moc, nguoi({ id: 'n-5', hoTen: 'Nguyễn Quang Bảng', namSinh: 1960 })), null);
  });
});

describe('so khớp một mốc', () => {
  const PHA: UngVienTho[] = [
    nguoi({ id: 'n-002', hoTen: 'Nguyễn Quang Đệ', namSinh: 1888, namMat: 1954, doi: 2 }),
    nguoi({ id: 'n-101', hoTen: 'Nguyễn Quang Đệ', namMat: 1954, doi: 2 }),
    nguoi({ id: 'n-009', hoTen: 'Nguyễn Quang Hùng', namSinh: 1975, doi: 4 }),
    nguoi({ id: 'n-013', hoTen: 'Nguyễn Quang Hùng', namSinh: 1958, doi: 4 }),
    nguoi({ id: 'n-004', hoTen: 'Trần Thị Vẽ', gioiTinh: 'nu', namMat: 1961, ketHonVaoHo: true, doi: 2 }),
  ];

  it('người bên ngoại: từ chối so khớp, kèm lý do — không trả danh sách rỗng', () => {
    const kq = soKhopMoc({ quanHe: 'cau', hoTen: 'Nguyễn Quang Hùng' }, PHA);
    assert.equal(kq.ungVien.length, 0);
    assert.ok(kq.khongApDung?.includes('họ khác'));
  });

  it('cụ Đệ hai bản: trả về CẢ HAI, không chọn sẵn bản nào', () => {
    const kq = soKhopMoc({ quanHe: 'cu-ong', hoTen: 'Nguyễn Quang Đệ', namMat: 1954 }, PHA);
    const ids = kq.ungVien.map((u) => u.nguoiId);
    assert.ok(ids.includes('n-002') && ids.includes('n-101'), `nhận: ${ids.join(', ')}`);
  });

  it('hai cụ Hùng trùng tên: cả hai đều phải mang cột khác nhau để người phân biệt', () => {
    const kq = soKhopMoc({ quanHe: 'bo', hoTen: 'Nguyễn Quang Hùng', namSinhNguoiKhai: 2004 }, PHA);
    assert.ok(kq.ungVien.length >= 1);
    for (const u of kq.ungVien) {
      assert.ok(u.giongNhau.length > 0, `${u.nguoiId} thiếu cột giống`);
    }
  });

  it('không mốc nào đạt mức “cao” khi còn điểm khác chưa giải thích', () => {
    const kq = soKhopMoc({ quanHe: 'cu-ong', hoTen: 'Nguyễn Quang Đệ', namMat: 1954 }, PHA);
    for (const u of kq.ungVien) {
      if (u.chacChan === 'cao') assert.equal(u.khacNhau.length, 0, `${u.nguoiId} mức cao mà vẫn có cột khác`);
    }
  });

  it('người bị loại được ghi lại kèm lý do, không biến mất im lặng', () => {
    const kq = soKhopMoc({ quanHe: 'chu', hoTen: 'Trần Thị Vẽ' }, PHA);
    assert.ok(kq.biLoai.length > 0);
    assert.ok(kq.biLoai.every((b) => b.lyDo.length > 0));
  });

  it('tất định: chạy hai lần ra kết quả giống hệt', () => {
    const m: MocKhai = { quanHe: 'cu-ong', hoTen: 'Nguyễn Quang Đệ', namMat: 1954 };
    assert.deepEqual(soKhopMoc(m, PHA), soKhopMoc(m, PHA));
  });
});
