/**
 * Vai của một gắn kết (story 6-2) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import {
  CAU_KHOA,
  MOI_VAI,
  NHAN_TRANG_THAI,
  NHAN_VAI,
  lyDoKhoaDoiVai,
  nhanTrangThaiAnToan,
  nhanVaiAnToan,
  vaiTraoDuoc,
} from './vai-gan-ket';

describe('từ vựng vai', () => {
  it('vai nào cũng nói ra LÀM ĐƯỢC GÌ, không chỉ tên gọi', () => {
    for (const v of MOI_VAI) {
      expect(NHAN_VAI[v].ten.trim().length).toBeGreaterThan(0);
      expect(NHAN_VAI[v].lamDuocGi.trim().length).toBeGreaterThan(0);
    }
  });

  it('bốn trạng thái đều có lời người — kể cả `detached` mới thêm', () => {
    expect(NHAN_TRANG_THAI.detached).toBe('đã gỡ');
    // "đã gỡ" KHÁC "đã từ chối": một bên từng được nhận rồi bị gỡ, bên kia chưa bao giờ được nhận.
    expect(NHAN_TRANG_THAI.detached).not.toBe(NHAN_TRANG_THAI.rejected);
  });
});

describe('vai trao được ở lượt duyệt', () => {
  /** Chép đúng luật đã có ở `approveAttachmentOp` — bày lựa chọn core sẽ từ chối là đường cụt. */
  it('quản trị trao được cả ba', () => {
    expect(vaiTraoDuoc('admin')).toEqual(['member', 'branch-head', 'admin']);
  });

  it('đầu mối chi CHỈ trao được thành viên — không tự nhân bản quyền của mình', () => {
    expect(vaiTraoDuoc('branch-head')).toEqual(['member']);
  });

  it('thành viên và khách không trao được gì', () => {
    expect(vaiTraoDuoc('member')).toEqual([]);
    expect(vaiTraoDuoc('guest')).toEqual([]);
  });
});

describe('vì sao nút đổi vai bị khoá', () => {
  const hoi = (d: Partial<Parameters<typeof lyDoKhoaDoiVai>[0]>) =>
    lyDoKhoaDoiVai({
      vaiCuaMinh: 'admin',
      laChinhMinh: false,
      trangThai: 'active',
      vaiHangNay: 'member',
      soAdminDangHoatDong: 3,
      ...d,
    });

  it('hàng thường, mình là quản trị ⇒ không khoá', () => {
    expect(hoi({})).toBeNull();
  });

  it('không phải quản trị ⇒ khoá, và đó là lý do ĐẦU TIÊN', () => {
    expect(hoi({ vaiCuaMinh: 'branch-head' })).toBe('khong-phai-quan-tri');
    expect(hoi({ vaiCuaMinh: 'guest', laChinhMinh: true })).toBe('khong-phai-quan-tri');
  });

  it.each(['pending', 'rejected', 'detached'] as const)('trạng thái %s ⇒ khoá', (t) => {
    expect(hoi({ trangThai: t })).toBe('khong-hoat-dong');
  });

  it('chính mình ⇒ khoá, kể cả khi còn nhiều quản trị khác', () => {
    expect(hoi({ laChinhMinh: true, soAdminDangHoatDong: 9 })).toBe('chinh-minh');
  });

  /**
   * Ca một-gắn-kết là ca THẬT của phả hôm nay: hàng duy nhất vừa là chính mình vừa là quản trị
   * cuối cùng. Trả `chinh-minh` thì màn khuyên *"nhờ một quản trị khác"* — không có ai khác, và
   * lời khuyên ấy che mất lý do đúng.
   */
  it('vừa là chính mình VỪA là quản trị cuối cùng ⇒ nói lý do ĐÚNG', () => {
    expect(hoi({ laChinhMinh: true, vaiHangNay: 'admin', soAdminDangHoatDong: 1 })).toBe(
      'admin-cuoi-cung',
    );
  });

  /**
   * Hạ vai quản trị cuối cùng là khoá cả dòng họ ra khỏi bàn quản trị, và không đường nào trong
   * sản phẩm mở lại được — chỉ còn `scripts/`.
   */
  it('quản trị cuối cùng ⇒ khoá', () => {
    expect(hoi({ vaiHangNay: 'admin', soAdminDangHoatDong: 1 })).toBe('admin-cuoi-cung');
  });

  it('còn quản trị khác ⇒ hạ được', () => {
    expect(hoi({ vaiHangNay: 'admin', soAdminDangHoatDong: 2 })).toBeNull();
  });

  it('mọi lý do khoá đều có câu nói ra, không nấp trong `title`', () => {
    for (const ly of ['khong-phai-quan-tri', 'khong-hoat-dong', 'chinh-minh', 'admin-cuoi-cung'] as const) {
      expect(CAU_KHOA[ly].trim().length).toBeGreaterThan(0);
    }
  });
});

describe('tra nhãn an toàn', () => {
  it('khoá hợp lệ ⇒ đúng nhãn', () => {
    expect(nhanVaiAnToan('admin').ten).toBe('Quản trị');
    expect(nhanTrangThaiAnToan('detached')).toBe('đã gỡ');
  });

  /**
   * Cột `role`/`status` là `text` KHÔNG có CHECK, nên một giá trị ngoài union tới được. Tra thẳng
   * Record cho `undefined.ten` ⇒ TypeError ⇒ sập cả client component, không phải suy giảm mềm.
   */
  it('khoá lạ ⇒ bày chính chuỗi ấy, KHÔNG ném', () => {
    expect(() => nhanVaiAnToan('super-admin')).not.toThrow();
    expect(nhanVaiAnToan('super-admin').ten).toBe('super-admin');
    expect(nhanTrangThaiAnToan('zombie')).toBe('zombie');
  });
});

describe('lời người của vai phải khớp quyền THẬT', () => {
  /**
   * `gateApprover` (`core/assertion/ops.ts`) cho admin và branch-head quyền duyệt Y HỆT NHAU —
   * không có mảnh phạm vi chi nào. Bản đầu ghi branch-head là *"duyệt được khẳng định"* trơn,
   * cạnh admin *"của cả dòng họ"*, nên đọc ra là hẹp hơn. Khai sai về quyền, trên đúng màn dùng
   * để trao quyền.
   */
  it('đầu mối chi nói rõ cũng duyệt cả dòng họ, và nói rõ hai thứ KHÔNG làm được', () => {
    const chu = NHAN_VAI['branch-head'].lamDuocGi;
    expect(chu).toMatch(/cả dòng họ/);
    expect(chu).toMatch(/KHÔNG trao được vai/);
    expect(chu).toMatch(/KHÔNG gỡ được/);
  });
});
