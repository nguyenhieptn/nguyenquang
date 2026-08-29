import { describe, expect, it } from 'vitest';
import { diaChiCuaMay, docMoiTruong } from './moi-truong';

const DU = { SOI_GOC: 'http://127.0.0.1:3000', SOI_TEN: 'ai-do', SOI_MK: 'gi-do' };

describe('đọc môi trường', () => {
  it('đủ ba biến trên máy này thì qua', () => {
    const kq = docMoiTruong(DU);
    expect(kq.ok).toBe(true);
    if (!kq.ok) return;
    expect(kq.gt.danhTinh).toEqual({ ten: 'ai-do', mk: 'gi-do' });
  });

  it('lượt chỉ đụng màn công khai thì KHÔNG đòi tài khoản', () => {
    const kq = docMoiTruong({ SOI_GOC: 'http://127.0.0.1:3000' }, false);
    expect(kq.ok).toBe(true);
    if (!kq.ok) return;
    expect(kq.gt.danhTinh).toBeNull();
  });

  it('nhưng vẫn đòi SOI_GOC — không có địa chỉ thì không đo được gì', () => {
    expect(docMoiTruong({}, false).ok).toBe(false);
  });

  it('và hàng rào máy xa vẫn áp cho lượt công khai', () => {
    expect(docMoiTruong({ SOI_GOC: 'http://10.99.99.99:3000' }, false).ok).toBe(false);
  });

  it('IP Tailscale của CHÍNH máy này KHÔNG bị chặn — dự án chạy server ở đó, không ở loopback', () => {
    const cua = diaChiCuaMay().find((a) => a.startsWith('100.'));
    if (!cua) return; // máy chạy test không nối Tailscale — không có gì để khẳng định
    expect(docMoiTruong({ ...DU, SOI_GOC: `http://${cua}:3100` }).ok).toBe(true);
  });

  it('thiếu biến nào thì nói ra ĐÚNG biến ấy', () => {
    const kq = docMoiTruong({ SOI_GOC: 'http://127.0.0.1:3000' });
    expect(kq.ok).toBe(false);
    if (kq.ok) return;
    expect(kq.loi).toContain('SOI_TEN');
    expect(kq.loi).toContain('SOI_MK');
    expect(kq.loi).not.toContain('SOI_GOC=<');
  });

  it('KHÔNG có mặc định nào — thiếu hết thì thiếu hết, không tự điền', () => {
    const kq = docMoiTruong({});
    expect(kq.ok).toBe(false);
    if (kq.ok) return;
    expect(kq.loi).toContain('SOI_GOC');
    expect(kq.loi).toContain('SOI_TEN');
    expect(kq.loi).toContain('SOI_MK');
  });

  it('máy xa không cờ thì chặn, dù đủ ba biến', () => {
    const kq = docMoiTruong({ ...DU, SOI_GOC: 'http://10.99.99.99:3000' });
    expect(kq.ok).toBe(false);
    if (kq.ok) return;
    expect(kq.loi).toContain('SOI_CHO_PHEP_XA');
  });

  it('máy xa có cờ thì qua', () => {
    expect(docMoiTruong({ ...DU, SOI_GOC: 'http://10.99.99.99:3000', SOI_CHO_PHEP_XA: '1' }).ok).toBe(true);
  });

  it('có tài khoản thì vẫn nhận, dù lượt chạy không đòi', () => {
    const kq = docMoiTruong(DU, false);
    expect(kq.ok).toBe(true);
    if (!kq.ok) return;
    expect(kq.gt.danhTinh?.ten).toBe('ai-do');
  });

  it('gạch chéo thừa ở cuối địa chỉ bị cắt — nếu không thì mọi URL ghép ra `//admin`', () => {
    const kq = docMoiTruong({ ...DU, SOI_GOC: 'http://127.0.0.1:3000///' });
    expect(kq.ok).toBe(true);
    if (!kq.ok) return;
    expect(kq.gt.goc).toBe('http://127.0.0.1:3000');
  });

  it('mật khẩu KHÔNG bao giờ nằm trong thông báo lỗi', () => {
    const kq = docMoiTruong({ SOI_GOC: 'http://10.99.99.99:3000', SOI_TEN: 'ai-do', SOI_MK: 'mat-khau-that' });
    expect(kq.ok).toBe(false);
    if (kq.ok) return;
    expect(kq.loi).not.toContain('mat-khau-that');
  });
});
