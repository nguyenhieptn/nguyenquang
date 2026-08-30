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
    const { moi, daBiet } = tachDaBiet([{ loai: 'tuong-phan-thap', moTa: '2.85:1 < 4.5:1 — a · "React Flow"' }]);
    expect(moi).toEqual([]);
    expect(daBiet).toHaveLength(1);
  });

  it('cùng `loai` mà số khác thì là vi phạm MỚI — nền không được nuốt nó', () => {
    const { moi } = tachDaBiet([{ loai: 'tuong-phan-thap', moTa: '3.10:1 < 4.5:1 — p · "x"' }]);
    expect(moi).toHaveLength(1);
  });

  it('cùng chuỗi mà khác `loai` thì cũng là MỚI', () => {
    const { moi } = tachDaBiet([{ loai: 'tran-bo-cuon', moTa: 'React Flow gì đó' }]);
    expect(moi).toHaveLength(1);
  });

  it('nợ khai `man` chỉ khớp trên ĐÚNG màn ấy — một mục theo màn ở màn khác là vi phạm MỚI', () => {
    // Bảng thật không còn mục theo màn (7-2 trả hết) — dựng một mục giả để giữ luật.
    const muc = { loai: 'cham-duoi-san', khop: '23×', man: 'hop-nhat', toiDa: 8, moTa: 'x', viSao: 'y'.repeat(31), theoDoi: 'z'.repeat(6) };
    const vp = { loai: 'cham-duoi-san', moTa: '23×120px < 44×44 — a · "Nguyễn"' };
    expect(tachDaBiet([vp], 'hop-nhat', [muc]).daBiet).toHaveLength(1);
    expect(tachDaBiet([vp], 'cay', [muc]).moi).toHaveLength(1);
    // Không biết đang ở màn nào thì nghiêng về ĐỎ, không nghiêng về miễn trừ.
    expect(tachDaBiet([vp], undefined, [muc]).moi).toHaveLength(1);
  });

  it('nợ ở tầng token (không `man`) khớp ở mọi màn', () => {
    const vp = { loai: 'tuong-phan-thap', moTa: '2.85:1 < 4.5:1 — a · "React Flow"' };
    expect(tachDaBiet([vp], 'bat-ky').daBiet).toHaveLength(1);
  });

  it('sau 7-2 nền chỉ còn mã của thư viện — không mục nào khớp token hay màn của dự án', () => {
    for (const m of DA_BIET) expect(m.khop, m.moTa).toBe('React Flow');
  });

  it('mỗi mục ghi số lúc ghi nợ — không có trần thì "đếm tăng lên" không có gì để so', () => {
    for (const m of DA_BIET) expect(m.toiDa, m.moTa).toBeGreaterThan(0);
  });

  it('nền không rỗng, và nợ của MỘT màn phải khai `man` (bảng hiện chỉ còn nợ tầng token của thư viện)', () => {
    expect(DA_BIET.length).toBeGreaterThan(0);
    // Sau 7-2 không còn mục theo màn — bất biến giữ bằng câu ngược: mục nào KHÔNG có `man` thì
    // `moTa` không được nhắc tên một màn.
    for (const m of DA_BIET) if (m.man === undefined) expect(m.moTa, m.moTa).not.toMatch(/hàng chờ|hợp nhất|nơi chốn|mâu thuẫn/);
  });
});
