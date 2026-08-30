import { describe, expect, it } from 'vitest';
import { DA_BIET, tachDaBiet } from './da-biet';

describe('nền đã biết', () => {
  it('mỗi mục nói được vì sao chưa vá và ghi nợ ở đâu', () => {
    for (const m of DA_BIET) {
      expect(m.viSao.length, m.moTa).toBeGreaterThan(30);
      expect(m.theoDoi.length, m.moTa).toBeGreaterThan(5);
    }
  });

  it('không mục nào miễn trừ cả một `loai` — `khop` rỗng là tắt luôn phép đo', () => {
    for (const m of DA_BIET) expect(m.khop.length, m.moTa).toBeGreaterThan(2);
  });

  it('vi phạm khớp thì vào nhóm đã biết', () => {
    const { moi, daBiet } = tachDaBiet([{ loai: 'tuong-phan-thap', moTa: '4.42:1 < 4.5:1 — p · "x"' }]);
    expect(moi).toEqual([]);
    expect(daBiet).toHaveLength(1);
  });

  it('cùng `loai` mà số khác thì là vi phạm MỚI — nền không được nuốt nó', () => {
    const { moi } = tachDaBiet([{ loai: 'tuong-phan-thap', moTa: '3.10:1 < 4.5:1 — p · "x"' }]);
    expect(moi).toHaveLength(1);
  });

  it('cùng chuỗi mà khác `loai` thì cũng là MỚI', () => {
    const { moi } = tachDaBiet([{ loai: 'cham-duoi-san', moTa: '4.42:1 gì đó' }]);
    expect(moi).toHaveLength(1);
  });

  it('nợ khai `man` chỉ khớp trên ĐÚNG màn ấy — `23×` ở màn khác là vi phạm MỚI', () => {
    const vp = { loai: 'cham-duoi-san', moTa: '23×120px < 44×44 — a · "Nguyễn"' };
    expect(tachDaBiet([vp], 'hop-nhat').daBiet).toHaveLength(1);
    expect(tachDaBiet([vp], 'cay').moi).toHaveLength(1);
    // Không biết đang ở màn nào thì nghiêng về ĐỎ, không nghiêng về miễn trừ.
    expect(tachDaBiet([vp]).moi).toHaveLength(1);
  });

  it('nợ ở tầng token (không `man`) khớp ở mọi màn', () => {
    const vp = { loai: 'tuong-phan-thap', moTa: '4.42:1 < 4.5:1 — p · "x"' };
    expect(tachDaBiet([vp], 'bat-ky').daBiet).toHaveLength(1);
  });

  it('mỗi mục ghi số lúc ghi nợ — không có trần thì "đếm tăng lên" không có gì để so', () => {
    for (const m of DA_BIET) expect(m.toiDa, m.moTa).toBeGreaterThan(0);
  });

  it('nợ của MỘT màn phải khai `man` — nợ theo màn mà không khai là nuốt vi phạm của màn khác', () => {
    const theoMan = DA_BIET.filter((m) => /hàng chờ|hợp nhất/.test(m.moTa));
    for (const m of theoMan) expect(m.man, m.moTa).toBeDefined();
  });
});
