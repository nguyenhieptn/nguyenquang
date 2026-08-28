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
  'father-skipped',
  'spouse-not-found',
  'spouse-ambiguous',
  'spouse-skipped',
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

  /**
   * HỒI QUY 27/08 — bài này TRƯỚC ĐÂY ghim chặt luật cũ *"mọi cảnh báo đều bỏ tích"*, và chính
   * nó làm cho hồi quy nặng nhất của story 6-3 vẫn xanh qua mọi cổng: thêm `spouse-not-found`
   * (hình dạng mà chính tệp mẫu dạy người ta viết) là bỏ tích gần như mọi dòng đàn ông của một
   * bảng tính chép tay. Đo được trên `getTemplate()`: 1/2 dòng được ghi, không cạnh nào.
   *
   * Chốt của chủ dự án: thiếu CHA thì vẫn bỏ tích — nó đổi cấu trúc cây, người ấy thành gốc tạm
   * của một mảnh mới, đáng bắt dừng lại nhìn. Thiếu VỢ/CHỒNG thì không — chỉ mất một union.
   */
  it('thiếu CHA ⇒ để lại, kể cả khi khớp người có sẵn', () => {
    expect(hoi({ canhBao: ['father-not-found'] })).toBe('de-lai');
    expect(hoi({ khopNguoiCoSan: true, coUngVien: true, canhBao: ['father-ambiguous'] })).toBe('de-lai');
  });

  it('thiếu VỢ/CHỒNG ⇒ VẪN tích — chỉ mất một union, không đổi hình cây', () => {
    expect(hoi({ canhBao: ['spouse-not-found'] })).toBe('tao-moi');
    expect(hoi({ canhBao: ['spouse-ambiguous'] })).toBe('tao-moi');
    expect(hoi({ khopNguoiCoSan: true, coUngVien: true, canhBao: ['spouse-not-found'] })).toBe(
      'noi-vao-ung-vien',
    );
  });

  /** Ba loại này đòi một dòng đang bị `skip`, nên chúng không thể có mặt ở lượt MÙ. */
  it('loại chỉ sinh ra khi đã có quyết định ⇒ không lái mặc định', () => {
    expect(hoi({ canhBao: ['skip-drops-edges'] })).toBe('tao-moi');
    expect(hoi({ canhBao: ['father-skipped'] })).toBe('tao-moi');
    expect(hoi({ canhBao: ['spouse-skipped'] })).toBe('tao-moi');
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
