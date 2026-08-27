/**
 * Phím tắt nhập nhanh trên canvas (story 6-9) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import { dangGoTrongO, hanhDongEsc, hanhDongPhim } from './phim-canvas';

const goi = (p: Partial<Parameters<typeof hanhDongPhim>[0]>) =>
  hanhDongPhim({ phim: 'Enter', shift: false, o: null, chonId: 'p1', chaCuaChon: 'p0', ...p });

describe('Enter — thêm con', () => {
  it('có node đang chọn ⇒ mở biểu mẫu con, mốc là chính node ấy', () => {
    expect(goi({})).toEqual({ loai: 'them-con', mocId: 'p1' });
  });

  it('chưa chọn ai ⇒ bỏ qua', () => {
    expect(goi({ chonId: null })).toEqual({ loai: 'bo-qua' });
  });

  /** Node mờ là bản XEM TRƯỚC, chưa có trong phả — không thể làm mốc cho ai. */
  it('node mờ đang chọn ⇒ bỏ qua', () => {
    expect(goi({ chonId: '__sap-them__' })).toEqual({ loai: 'bo-qua' });
  });
});

describe('Shift+Enter — thêm anh em', () => {
  it('gắn vào CHA của node đang chọn, không gắn vào chính nó', () => {
    expect(goi({ shift: true })).toEqual({ loai: 'them-anh-em', mocId: 'p0' });
  });

  /**
   * Lặng lẽ tạo một người rời là đẻ thêm một mảnh chưa nối — đúng con số bàn Admin đang cố làm
   * giảm. Thà nói "chưa biết cha" còn hơn ghi một thứ người vận hành không định ghi.
   */
  it('chưa biết cha ⇒ KHÔNG ghi gì, trả về `thieu-cha`', () => {
    expect(goi({ shift: true, chaCuaChon: null })).toEqual({ loai: 'thieu-cha' });
  });
});

describe('không cướp phím của người khác', () => {
  it.each(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'SUMMARY'])(
    'con trỏ ở %s ⇒ bỏ qua, vì Enter ở đó đã có nghĩa riêng',
    (the) => {
      expect(goi({ o: { the, contentEditable: false } })).toEqual({ loai: 'bo-qua' });
      expect(goi({ shift: true, o: { the, contentEditable: false } })).toEqual({ loai: 'bo-qua' });
    },
  );

  it('contenteditable ⇒ bỏ qua', () => {
    expect(goi({ o: { the: 'DIV', contentEditable: true } })).toEqual({ loai: 'bo-qua' });
  });

  it('thẻ node và khoảng trống canvas KHÔNG chặn phím — đó là chỗ phím này sinh ra để dùng', () => {
    expect(goi({ o: { the: 'DIV', contentEditable: false } })).toEqual({
      loai: 'them-con',
      mocId: 'p1',
    });
    expect(goi({ o: { the: 'BODY', contentEditable: false } })).toEqual({
      loai: 'them-con',
      mocId: 'p1',
    });
  });

  /** `Tab` không bị đụng tới — nó là phím của trình duyệt, xem chú thích đầu module. */
  it.each(['Tab', 'Escape', 'a', ' ', 'ArrowDown'])('phím %s ⇒ bỏ qua', (phim) => {
    expect(goi({ phim })).toEqual({ loai: 'bo-qua' });
    expect(goi({ phim, shift: true })).toEqual({ loai: 'bo-qua' });
  });
});

describe('dangGoTrongO', () => {
  it('không xác định được phần tử ⇒ coi như không gõ', () => {
    expect(dangGoTrongO(null)).toBe(false);
  });
});

describe('Escape — huỷ thao tác đang dở', () => {
  const esc = (a: Partial<Parameters<typeof hanhDongEsc>[0]>) =>
    hanhDongEsc({ phim: 'Escape', dangMo: true, daGo: false, dangHoi: false, ...a });

  it('biểu mẫu trống ⇒ đóng ngay, không hỏi gì', () => {
    expect(esc({})).toEqual({ loai: 'dong' });
  });

  /**
   * "Mất trắng chữ, không một câu hỏi" đúng là tội lượt review 6-7 bắt được ở chỗ `<details>`
   * nuốt biểu mẫu. Đã gõ thì phải hỏi.
   */
  it('đã gõ ⇒ HỎI, không bỏ ngay', () => {
    expect(esc({ daGo: true })).toEqual({ loai: 'hoi' });
  });

  it('Esc lần hai sau khi đã hỏi ⇒ bỏ', () => {
    expect(esc({ daGo: true, dangHoi: true })).toEqual({ loai: 'dong' });
  });

  it('biểu mẫu chưa mở ⇒ bỏ qua, trả phím cho trình duyệt', () => {
    expect(esc({ dangMo: false })).toEqual({ loai: 'bo-qua' });
    expect(esc({ dangMo: false, daGo: true })).toEqual({ loai: 'bo-qua' });
  });

  it.each(['Enter', 'Tab', 'a'])('phím %s ⇒ bỏ qua', (phim) => {
    expect(esc({ phim })).toEqual({ loai: 'bo-qua' });
  });
});
