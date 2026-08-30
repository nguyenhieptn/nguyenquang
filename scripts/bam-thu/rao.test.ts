import { describe, expect, it } from 'vitest';
import { raoClan, raoTaiKhoan, raoThanhTren, tenThanhVienTu } from './rao';

describe('ba rào của kịch bản ghi (story 7-1)', () => {
  it('rào clan: chỉ "Dòng họ thử …" mới qua; phả thật và không đọc được đều dừng', () => {
    expect(raoClan('Dòng họ thử T0b9b84').ok).toBe(true);
    expect(raoClan('Dòng họ Nguyễn Quang')).toMatchObject({ ok: false, rao: 'clan' });
    expect(raoClan(null)).toMatchObject({ ok: false, rao: 'clan' });
    expect(raoClan('')).toMatchObject({ ok: false, rao: 'clan' });
  });

  it('rào tài khoản: chỉ thu.quan.tri.* / thu.thanh.vien.*; chưa gắn và tài khoản thật đều dừng', () => {
    expect(raoTaiKhoan('thu.quan.tri.0b9b84').ok).toBe(true);
    // Tên thành viên KHÔNG qua: nó được suy từ tên quản trị, không được đưa vào (review 7-1).
    expect(raoTaiKhoan('thu.thanh.vien.0b9b84')).toMatchObject({ ok: false, rao: 'tai-khoan' });
    expect(raoTaiKhoan('thu.chua.gan.0b9b84')).toMatchObject({ ok: false, rao: 'tai-khoan' });
    expect(raoTaiKhoan('hiep')).toMatchObject({ ok: false, rao: 'tai-khoan' });
    expect(raoTaiKhoan(undefined)).toMatchObject({ ok: false, rao: 'tai-khoan' });
  });

  it('rào thanh trên: phải mang họ thử VÀ đúng mã clan của GIAPHA_CLAN_ID', () => {
    expect(raoThanhTren('T0b9b84 Nguyễn Thử Quản Trị · quản trị', 'T0b9b84').ok).toBe(true);
    expect(raoThanhTren('Nguyễn Quang Hiệp · quản trị', 'T0b9b84')).toMatchObject({ ok: false, rao: 'thanh-tren' });
    // Hai dòng họ thử cùng lúc: server ghim K74 mà GIAPHA_CLAN_ID là T0b9b84 ⇒ dừng.
    expect(raoThanhTren('K74 Nguyễn Thử Quản Trị · quản trị', 'T0b9b84')).toMatchObject({ ok: false, rao: 'thanh-tren' });
    expect(raoThanhTren('K74 Nguyễn Thử Quản Trị · quản trị', '').ok).toBe(true);
  });

  it('tên thành viên suy từ tên quản trị cùng mã', () => {
    expect(tenThanhVienTu('thu.quan.tri.0b9b84')).toBe('thu.thanh.vien.0b9b84');
  });
});
