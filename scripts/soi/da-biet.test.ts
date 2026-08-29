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
});
