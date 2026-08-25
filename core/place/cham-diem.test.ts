/**
 * Chấm điểm nơi (story 5-7, FR-65) — test THUẦN.
 *
 * Bài đầu tiên là lý do CẢ FR-65 tồn tại. Nếu chỉ giữ được một bài trong file này thì giữ nó.
 */
import { describe, it, expect } from 'vitest';
import { chamDiemNoi, trungKhit, type NoiTho } from './cham-diem';

const QT_DINH_HOA: NoiTho = {
  id: 'dh',
  nameFolded: 'quang trung',
  parentUnitFolded: 'dinh hoa, thai nguyen',
};
const QT_VUNG_TAU: NoiTho = {
  id: 'vt',
  nameFolded: 'quang trung',
  parentUnitFolded: 'vung tau',
};
const QT_TRONG: NoiTho = { id: 'trong', nameFolded: 'quang trung', parentUnitFolded: '' };

describe('hai "Quang Trung" — lý do FR-65 tồn tại', () => {
  it('cùng tên KHÁC đơn vị cha: cả hai cùng hiện, nhưng đúng cái kia xếp trên', () => {
    const ra = chamDiemNoi('Quang Trung', 'Định Hoá, Thái Nguyên', [QT_VUNG_TAU, QT_DINH_HOA]);

    // Cả hai phải CÙNG HIỆN. Loại đi một cái là quay lại đúng chỗ hỏng mà FR-65 sinh ra để chặn:
    // người nhập không thấy cái mình đang cần rồi tạo thêm một bản thứ ba.
    expect(ra.map((u) => u.id)).toEqual(['dh', 'vt']);

    const dh = ra.find((u) => u.id === 'dh')!;
    const vt = ra.find((u) => u.id === 'vt')!;
    expect(dh.diem).toBeGreaterThan(vt.diem);
    expect(dh.muc).toBe('cao');
    // Và cái sai phải NÓI RÕ vì sao nó thấp, chứ không chỉ đứng dưới.
    expect(vt.vi).toContain('KHÁC đơn vị cha');
  });

  it('không khai đơn vị cha thì hai nơi ngang điểm — máy không đoán hộ', () => {
    const ra = chamDiemNoi('Quang Trung', '', [QT_DINH_HOA, QT_VUNG_TAU]);
    expect(ra).toHaveLength(2);
    expect(ra[0].diem).toBe(ra[1].diem);
    // Ngang điểm là câu trả lời ĐÚNG: không có tín hiệu nào để phân biệt, nên bày cả hai và để
    // người nhập nhìn đơn vị cha mà chọn.
    expect(ra.every((u) => u.muc === 'vua')).toBe(true);
  });

  it('nơi cũ CHƯA GHI đơn vị cha: không thưởng, cũng không phạt', () => {
    const ra = chamDiemNoi('Quang Trung', 'Vũng Tàu', [QT_TRONG, QT_VUNG_TAU, QT_DINH_HOA]);
    const trong = ra.find((u) => u.id === 'trong')!;
    const vt = ra.find((u) => u.id === 'vt')!;
    const dh = ra.find((u) => u.id === 'dh')!;
    // Chưa biết KHÁC với biết là khác.
    expect(vt.diem).toBeGreaterThan(trong.diem);
    expect(trong.diem).toBeGreaterThan(dh.diem);
    expect(trong.vi).toContain('nơi này chưa ghi đơn vị cha');
  });
});

describe('gấp dấu và những ca biên', () => {
  it('gõ không dấu vẫn khớp — AD-16', () => {
    const ra = chamDiemNoi('quang trung', 'dinh hoa, thai nguyen', [QT_DINH_HOA]);
    expect(ra[0].muc).toBe('cao');
  });

  it('tên không dính dáng gì thì KHÔNG phải ứng viên', () => {
    expect(chamDiemNoi('Hà Nội', '', [QT_DINH_HOA, QT_VUNG_TAU])).toEqual([]);
  });

  it('tên chứa nhau được điểm vừa phải, không bằng trùng khít', () => {
    const ra = chamDiemNoi('Quang', '', [QT_DINH_HOA]);
    expect(ra[0].vi).toContain('tên chứa nhau');
    expect(ra[0].muc).toBe('thap');
  });

  it('gõ rỗng thì không có ứng viên nào, và đó không phải lỗi', () => {
    expect(chamDiemNoi('', 'Thái Nguyên', [QT_DINH_HOA])).toEqual([]);
    expect(chamDiemNoi('   ', '', [QT_DINH_HOA])).toEqual([]);
  });

  it('thứ tự ổn định khi bằng điểm — panel không nhảy giữa hai lần đọc', () => {
    const mot = chamDiemNoi('Quang Trung', '', [QT_VUNG_TAU, QT_DINH_HOA]);
    const hai = chamDiemNoi('Quang Trung', '', [QT_DINH_HOA, QT_VUNG_TAU]);
    expect(mot.map((u) => u.id)).toEqual(hai.map((u) => u.id));
  });
});

describe('trùng khít — chặn danh mục tự sinh sôi từ lỗi gõ', () => {
  it('cùng tên cùng đơn vị cha là trùng khít, dù gõ có dấu hay không', () => {
    expect(trungKhit(QT_DINH_HOA, 'Quang Trung', 'Định Hoá, Thái Nguyên')).toBe(true);
    expect(trungKhit(QT_DINH_HOA, 'quang trung', 'dinh hoa, thai nguyen')).toBe(true);
  });

  it('cùng tên khác đơn vị cha thì KHÔNG trùng — phải tạo mới được', () => {
    // Đây là mặt kia của cùng một luật: chặn trùng khít mà chặn luôn cả cái này thì dòng họ ở
    // Vũng Tàu không bao giờ ghi được quê mình.
    expect(trungKhit(QT_DINH_HOA, 'Quang Trung', 'Vũng Tàu')).toBe(false);
  });
});
