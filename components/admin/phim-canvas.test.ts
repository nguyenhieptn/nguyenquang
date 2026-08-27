/**
 * Phím tắt nhập nhanh trên canvas (story 6-9) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import { ID_TAM } from './dat-nut-tam';
import { dangGoTrongO, hanhDongEsc, hanhDongPhim } from './phim-canvas';

const goi = (p: Partial<Parameters<typeof hanhDongPhim>[0]>) =>
  hanhDongPhim({
    phim: 'Enter',
    shift: false,
    boTro: false,
    lap: false,
    o: null,
    chonId: 'p1',
    chaCuaChon: 'p0',
    laGocManh: false,
    mocDangMo: null,
    daGo: false,
    dangHoi: false,
    ...p,
  });

describe('Enter — thêm con', () => {
  it('có node đang chọn ⇒ mở biểu mẫu con, mốc là chính node ấy', () => {
    expect(goi({})).toEqual({ loai: 'them-con', mocId: 'p1' });
  });

  it('chưa chọn ai ⇒ bỏ qua', () => {
    expect(goi({ chonId: null })).toEqual({ loai: 'bo-qua' });
  });

  /**
   * Node mờ là bản XEM TRƯỚC, chưa có trong phả — không thể làm mốc cho ai.
   *
   * Dùng `ID_TAM` IMPORT, không chép chuỗi (sửa 26/08 sau code review): bản chép tay làm bài test
   * này xanh vĩnh viễn kể cả khi hằng ở `dat-nut-tam.ts` đã đổi, tức AC 5 hỏng mà không ai biết.
   */
  it('node mờ đang chọn ⇒ bỏ qua', () => {
    expect(goi({ chonId: ID_TAM })).toEqual({ loai: 'bo-qua' });
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
  it('gốc mảnh THẬT, chưa biết cha ⇒ KHÔNG ghi gì, trả về `thieu-cha`', () => {
    expect(goi({ shift: true, chaCuaChon: null, laGocManh: true })).toEqual({ loai: 'thieu-cha' });
  });

  /**
   * HAI ca khác hẳn nhau, và gộp chúng là nói SAI về phả (code review 26/08). `parentNodeId` của
   * core trả `null` cho cả "gốc mảnh thật" lẫn "cha nằm ngoài bán kính đang xem" — mà ở bán kính
   * mặc định thì MỌI node ở rìa vùng rơi vào vế thứ hai. `isFragmentRoot` là thứ phân biệt, và
   * `page.tsx` đã map sẵn nó thành `the.laGocManh`.
   */
  it('cha CÓ trong phả nhưng ngoài bán kính ⇒ `cha-ngoai-vung`, KHÔNG phải `thieu-cha`', () => {
    expect(goi({ shift: true, chaCuaChon: null, laGocManh: false })).toEqual({
      loai: 'cha-ngoai-vung',
    });
  });
});

describe('không nuốt biểu mẫu đang gõ dở', () => {
  it('biểu mẫu mở cho mốc KHÁC mà đã có chữ ⇒ HỎI trước, không thay ngay', () => {
    expect(goi({ mocDangMo: 'p9', daGo: true })).toEqual({ loai: 'hoi-thay' });
  });

  it('lần hai sau khi đã hỏi ⇒ thay', () => {
    expect(goi({ mocDangMo: 'p9', daGo: true, dangHoi: true })).toEqual({
      loai: 'them-con',
      mocId: 'p1',
    });
  });

  it('biểu mẫu mở nhưng CHƯA gõ gì ⇒ thay thẳng, không có gì để mất', () => {
    expect(goi({ mocDangMo: 'p9', daGo: false })).toEqual({ loai: 'them-con', mocId: 'p1' });
  });

  /** Mở lại đúng mốc đang mở là đặt `hoTen` về rỗng — nhãn node mờ quay về "người sắp thêm". */
  it('biểu mẫu đã mở cho ĐÚNG mốc ấy ⇒ không đụng vào', () => {
    expect(goi({ mocDangMo: 'p1', daGo: true })).toEqual({ loai: 'bo-qua' });
    expect(goi({ mocDangMo: 'p1', daGo: false })).toEqual({ loai: 'bo-qua' });
  });

  it('Shift+Enter cũng hỏi, và mốc là CHA', () => {
    expect(goi({ shift: true, mocDangMo: 'p9', daGo: true })).toEqual({ loai: 'hoi-thay' });
    expect(goi({ shift: true, mocDangMo: 'p9', daGo: true, dangHoi: true })).toEqual({
      loai: 'them-anh-em',
      mocId: 'p0',
    });
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

  /**
   * `Ctrl+Enter` / `Cmd+Enter` là thành ngữ *gửi* phổ biến nhất trên web. Nuốt nó là mở một biểu
   * mẫu GHI mà người vận hành không định mở — trên một phả không có phép xoá.
   */
  it('có phím bổ trợ (ctrl · cmd · alt) ⇒ bỏ qua, KHÔNG preventDefault', () => {
    expect(goi({ boTro: true })).toEqual({ loai: 'bo-qua' });
    expect(goi({ boTro: true, shift: true })).toEqual({ loai: 'bo-qua' });
  });

  /** Giữ phím không được trả lời hộ người dùng trong 33 mili-giây. */
  it('phím đang tự lặp vì bị giữ ⇒ bỏ qua', () => {
    expect(goi({ lap: true })).toEqual({ loai: 'bo-qua' });
    expect(goi({ lap: true, mocDangMo: 'p9', daGo: true })).toEqual({ loai: 'bo-qua' });
  });
});

describe('dangGoTrongO', () => {
  it('không xác định được phần tử ⇒ coi như không gõ', () => {
    expect(dangGoTrongO(null)).toBe(false);
  });
});

describe('Escape — huỷ thao tác đang dở', () => {
  const esc = (a: Partial<Parameters<typeof hanhDongEsc>[0]>) =>
    hanhDongEsc({ phim: 'Escape', lap: false, dangMo: true, daGo: false, dangHoi: false, ...a });

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

  /**
   * GIỮ `Esc` một giây: nhịp một đặt câu hỏi, nhịp lặp ~33ms sau trả `dong`. Cửa sổ để người đọc
   * được câu hỏi rộng đúng 33 mili-giây — tức là không có. Bốn nhánh đo được ở lượt nghiệm thu
   * đầu đều đo bằng hai lần gõ RỜI TAY, không lần nào giữ phím.
   */
  it('phím đang tự lặp ⇒ bỏ qua, câu hỏi không bị chính nó trả lời', () => {
    expect(esc({ daGo: true, lap: true })).toEqual({ loai: 'bo-qua' });
    expect(esc({ daGo: true, dangHoi: true, lap: true })).toEqual({ loai: 'bo-qua' });
  });
});
