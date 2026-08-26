/**
 * Trạng thái lượt tìm người (story 6-1) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import { boNguoiNay, trangThaiTim, type UngVienNguoi } from './tim-nguoi';

const u = (personId: string, hoTen: string): UngVienNguoi => ({ personId, hoTen, nguCanh: 'đời 3' });
const tt = (...a: Parameters<typeof trangThaiTim>) => trangThaiTim(...a).trangThai;

describe('trạng thái của bộ chọn người', () => {
  it('chưa gõ gì ⇒ không bày gì, kể cả câu "không có ai"', () => {
    expect(tt('', { khoa: '', ds: [] })).toBe('trong');
    expect(tt('   ', { khoa: '', ds: [] })).toBe('trong');
  });

  it('kết quả của từ khoá CŨ ⇒ đang tìm, không bày kết quả cũ ra', () => {
    expect(tt('vinh', { khoa: 'hiep', ds: [u('p1', 'Nguyễn Quang Hiệp')] })).toBe('dang-tim');
  });

  it('đọc hỏng KHÔNG được đọc thành "không có ai"', () => {
    expect(tt('vinh', { khoa: 'vinh', ds: [], loi: true })).toBe('loi');
  });

  it('tìm xong mà rỗng là chuyện bình thường, không phải lỗi', () => {
    expect(tt('vinh', { khoa: 'vinh', ds: [] })).toBe('khong-co');
  });

  it('có kết quả thì bày, và bày đúng danh sách đã lọc', () => {
    const ra = trangThaiTim('vinh', { khoa: 'vinh', ds: [u('p1', 'Nguyễn Quang Vinh')] }, 'p9');
    expect(ra.trangThai).toBe('co');
    expect(ra.ungVien.map((x) => x.personId)).toEqual(['p1']);
  });

  it('lượt về SAI THỨ TỰ không ghi đè: kết quả mang khoá khác ⇒ vẫn "đang tìm"', () => {
    expect(tt('vinh', { khoa: 'vi', ds: [u('p9', 'Người Sai')] })).toBe('dang-tim');
  });

  /**
   * Ca này là lý do `trangThaiTim` trả CẢ HAI thứ trong một lượt. Bản đầu suy trạng thái từ `ds`
   * rồi lọc sau, nên màn nói "Chưa có ai tên ấy trong phả" về đúng người đang hiện tên trên đầu
   * cột — rồi mời đi tạo một bản trùng.
   */
  it('người duy nhất trùng tên là CHÍNH MÌNH ⇒ "chi-minh", KHÔNG phải "khong-co"', () => {
    const ra = trangThaiTim('hiep', { khoa: 'hiep', ds: [u('p1', 'Nguyễn Quang Hiệp')] }, 'p1');
    expect(ra.trangThai).toBe('chi-minh');
    expect(ra.ungVien).toEqual([]);
  });

  it('còn người khác ngoài mình ⇒ vẫn là "co", chỉ mình bị lọc khỏi danh sách', () => {
    const ra = trangThaiTim(
      'nguyen',
      { khoa: 'nguyen', ds: [u('p1', 'Tôi'), u('p2', 'Người Khác')] },
      'p1',
    );
    expect(ra.trangThai).toBe('co');
    expect(ra.ungVien.map((x) => x.personId)).toEqual(['p2']);
  });

  /**
   * Escape đóng danh sách. Bản đầu đặt khoá rỗng ⇒ suy ra "đang tìm" ⇒ ô kẹt VĨNH VIỄN vì effect
   * chỉ chạy lại khi từ khoá đổi.
   */
  it('Escape ⇒ "da-dong", không phải "dang-tim"', () => {
    expect(tt('vinh', { khoa: 'vinh', ds: [u('p1', 'V')], dong: true })).toBe('da-dong');
  });

  it('gõ thêm một chữ sau Escape ⇒ mở lại bằng một lượt tìm mới', () => {
    expect(tt('vinh2', { khoa: 'vinh', ds: [u('p1', 'V')], dong: true })).toBe('dang-tim');
  });
});

describe('loại người đang mở hồ sơ khỏi danh sách', () => {
  it('không ai là cha của chính mình — nên không bày ra để bấm nhầm', () => {
    expect(boNguoiNay([u('p1', 'A'), u('p2', 'B')], 'p1').map((x) => x.personId)).toEqual(['p2']);
  });

  it('chưa chọn ai thì giữ nguyên', () => {
    expect(boNguoiNay([u('p1', 'A')], null)).toHaveLength(1);
  });
});
