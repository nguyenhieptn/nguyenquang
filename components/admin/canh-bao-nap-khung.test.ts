/**
 * Từ vựng cảnh báo của bộ nạp khung (story 6-3) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import {
  canhBaoHienHanh,
  cauCanhBao,
  huongMacDinh,
  NHAN_CANH_BAO,
  type LoaiCanhBao,
} from './canh-bao-nap-khung';

const MOI_LOAI: LoaiCanhBao[] = [
  'father-not-found',
  'father-ambiguous',
  'spouse-not-found',
  'spouse-ambiguous',
  'skip-drops-edges',
  'duplicate-in-file',
];

describe('nhãn cảnh báo', () => {
  it('loại nào cũng nói được CÁI GÌ MẤT, không chỉ bot thấy gì', () => {
    for (const loai of MOI_LOAI) {
      expect(NHAN_CANH_BAO[loai].tieuDe.trim().length).toBeGreaterThan(0);
      expect(NHAN_CANH_BAO[loai].mat.trim().length).toBeGreaterThan(0);
    }
  });

  it('câu cho script vận hành ghép đủ hai vế', () => {
    expect(cauCanhBao('spouse-not-found')).toBe(
      'không tìm thấy người vợ/chồng — hai người này sẽ không thành vợ chồng trong phả, không union nào được ghi',
    );
  });
});

describe('cảnh báo đang đúng của một dòng', () => {
  const goc: LoaiCanhBao[] = ['father-ambiguous'];

  it('chưa tính lại lần nào ⇒ dùng bản mù', () => {
    expect(canhBaoHienHanh(goc, null, 3)).toEqual(['father-ambiguous']);
  });

  /**
   * Cái bẫy chính: bỏ một dòng cha thừa thì dòng con HẾT cảnh báo, và `[]` ấy là tin cần bày.
   * Rơi về bản mù ở đây là bày lại đúng cái cảnh báo vừa được gỡ.
   */
  it('tính lại ra RỖNG ⇒ giữ rỗng, KHÔNG rơi về bản mù', () => {
    expect(canhBaoHienHanh(goc, { 3: [] }, 3)).toEqual([]);
  });

  it('tính lại ra loại khác ⇒ thay hẳn', () => {
    expect(canhBaoHienHanh(goc, { 3: ['father-not-found'] }, 3)).toEqual(['father-not-found']);
  });

  it('bản tính lại thiếu khoá của dòng này ⇒ rơi về bản mù, không thành rỗng giả', () => {
    expect(canhBaoHienHanh(goc, { 9: [] }, 3)).toEqual(['father-ambiguous']);
  });
});

describe('hướng mặc định của một dòng', () => {
  const hoi = (d: Partial<Parameters<typeof huongMacDinh>[0]>) =>
    huongMacDinh({ nghiTrung: false, khopNguoiCoSan: false, coUngVien: false, canhBao: [], ...d });

  it('nghi trùng ⇒ CHƯA QUYẾT — bot gợi ý, không tự quyết (FR-48)', () => {
    expect(hoi({ nghiTrung: true })).toBe('chua-quyet');
    // Thắng cả khớp lẫn cảnh báo: một dòng nghi trùng luôn phải có người nhìn.
    expect(hoi({ nghiTrung: true, khopNguoiCoSan: true, coUngVien: true })).toBe('chua-quyet');
    expect(hoi({ nghiTrung: true, canhBao: ['father-not-found'] })).toBe('chua-quyet');
  });

  it('mang cảnh báo ⇒ để lại, kể cả khi khớp người có sẵn', () => {
    expect(hoi({ canhBao: ['spouse-not-found'] })).toBe('de-lai');
    expect(hoi({ khopNguoiCoSan: true, coUngVien: true, canhBao: ['father-ambiguous'] })).toBe('de-lai');
  });

  it('khớp người có sẵn ⇒ nối vào ứng viên; khớp mà VẮNG ứng viên thì tạo mới', () => {
    expect(hoi({ khopNguoiCoSan: true, coUngVien: true })).toBe('noi-vao-ung-vien');
    // Không có ứng viên thì không có gì để nối — thà tạo mới còn hơn ném một `personId` rỗng.
    expect(hoi({ khopNguoiCoSan: true, coUngVien: false })).toBe('tao-moi');
  });

  it('dòng sạch ⇒ tạo mới', () => {
    expect(hoi({})).toBe('tao-moi');
  });
});
