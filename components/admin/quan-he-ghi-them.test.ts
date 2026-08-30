/**
 * Chiều của khẳng định quan hệ (story 6-1) — test THUẦN.
 *
 * Đây là bài test quan trọng nhất của story: ghi ngược chiều không sinh lỗi nào ở bất kỳ tầng nào
 * khác, cây vẫn vẽ ra đẹp, chỉ cha con đảo nhau — trong một hệ không có nút xoá.
 */
import { describe, it, expect } from 'vitest';
import {
  cauSeGhi,
  chieuChaCon,
  dungLoiGoiQuanHe,
  loaiDuocDuNoiTiep,
  HUONG_QUAN_HE,
  NHAN_HUONG,
  NHAN_QUAN_HE,
  QUAN_HE_MAU,
} from './quan-he-ghi-them';

const NAY = 'p-nay';
const KIA = 'p-kia';

describe('chiều của parent-child', () => {
  it('hướng "cha-me": người vừa chọn là CHA ⇒ subject là người đang mở hồ sơ', () => {
    expect(chieuChaCon(NAY, KIA, 'cha-me')).toEqual({ conId: NAY, chaId: KIA });
  });

  it('hướng "con": người vừa chọn là CON ⇒ subject là người vừa chọn', () => {
    expect(chieuChaCon(NAY, KIA, 'con')).toEqual({ conId: KIA, chaId: NAY });
  });

  it('hai hướng đảo nhau đúng nghĩa, không hướng nào trùng hướng kia', () => {
    const a = chieuChaCon(NAY, KIA, 'cha-me');
    const b = chieuChaCon(NAY, KIA, 'con');
    expect(a.conId).toBe(b.chaId);
    expect(a.chaId).toBe(b.conId);
  });

  it('mỗi hướng có nhãn riêng — không hướng nào rơi ra ngoài', () => {
    for (const h of HUONG_QUAN_HE) expect(NHAN_HUONG[h], h).toBeTruthy();
  });
});

describe('câu sẽ được ghi', () => {
  it('dựng đúng hình mà panel hiện lại — "X là con ruột của Y"', () => {
    // Chính ca của phả thật tối 25/08: Vinh là cha của Hiệp.
    expect(
      cauSeGhi({
        loai: 'parent-child',
        huong: 'cha-me',
        quanHe: 'blood',
        tenNguoiNay: 'Nguyễn Quang Hiệp',
        tenNguoiKia: 'Nguyễn Quang Vinh',
      }),
    ).toBe('Nguyễn Quang Hiệp là con ruột của Nguyễn Quang Vinh.');
  });

  it('đảo hướng thì đảo luôn câu', () => {
    expect(
      cauSeGhi({
        loai: 'parent-child',
        huong: 'con',
        quanHe: 'blood',
        tenNguoiNay: 'Nguyễn Quang Vinh',
        tenNguoiKia: 'Nguyễn Quang Hiệp',
      }),
    ).toBe('Nguyễn Quang Hiệp là con ruột của Nguyễn Quang Vinh.');
  });

  it('nuôi và thừa tự nói đúng chữ của phả, không quy về "con"', () => {
    const chung = { loai: 'parent-child', huong: 'cha-me', tenNguoiNay: 'A', tenNguoiKia: 'B' } as const;
    expect(cauSeGhi({ ...chung, quanHe: 'adopted' })).toBe('A là con nuôi của B.');
    expect(cauSeGhi({ ...chung, quanHe: 'heir' })).toBe('A là con thừa tự của B.');
  });

  it('vợ chồng đối xứng — không hỏi hướng, và câu không mang chiều', () => {
    expect(
      cauSeGhi({
        loai: 'union-partner',
        huong: 'cha-me',
        quanHe: 'blood',
        tenNguoiNay: 'A',
        tenNguoiKia: 'B',
      }),
    ).toBe('B và A là vợ chồng.');
  });
});

describe('nhãn quan hệ máu', () => {
  /**
   * GHIM ba chuỗi. Chúng chép từ `RELATION_VN` (`core/person/read-ops.ts:167`) — client không
   * import được `@/core/*`, nên chỗ duy nhất bắt được lệch là bài test này. Lệch một chữ là biểu
   * mẫu hứa một câu mà panel hiện câu khác, trên đúng dòng vừa ghi.
   */
  it('khớp từng chữ với RELATION_VN của core', () => {
    expect(NHAN_QUAN_HE).toEqual({ blood: 'con ruột', adopted: 'con nuôi', heir: 'con thừa tự' });
  });

  it('cả ba loại đều có nhãn — thêm loại thứ tư mà quên là lỗi tsc, không phải câu rỗng', () => {
    for (const q of QUAN_HE_MAU) expect(NHAN_QUAN_HE[q], q).toBeTruthy();
  });
});

describe('gỡ một cạnh ghi nhầm', () => {
  it('hai chồng quan hệ loại được dù KHÔNG mâu thuẫn — chúng luôn là chồng nối tiếp', () => {
    expect(loaiDuocDuNoiTiep('parent-child')).toBe(true);
    expect(loaiDuocDuNoiTiep('union-partner')).toBe(true);
  });

  it('bốn loại ĐƠN TRỊ giữ luật cũ (chỉ chồng mâu thuẫn mới có nút Loại); place/note mở từ story 7-3', () => {
    for (const k of ['name', 'gender', 'birth', 'death']) expect(loaiDuocDuNoiTiep(k), k).toBe(false);
    // Bốn loại nối tiếp, bốn đường ra — ghi nhầm một quê quán không còn là vĩnh viễn.
    for (const k of ['place', 'note']) expect(loaiDuocDuNoiTiep(k), k).toBe(true);
  });
});

describe('lời gọi addAssertion dựng từ ý người vận hành', () => {
  /**
   * Nửa còn lại — `{ personId, spec }` này rơi vào database đúng chỗ — do
   * `core/assertion/assertion.test.ts` ghim từ story 1-2 (*"parent-child builds the edge:
   * subject = child, object = parent"*). Hai bài nối đầu vào nhau, không bài nào phá tầng.
   */
  it('ca của phả thật: mở hồ sơ Hiệp, chọn Vinh, hướng "là cha/mẹ"', () => {
    expect(
      dungLoiGoiQuanHe({
        loai: 'parent-child',
        nguoiNayId: 'hiep',
        nguoiKiaId: 'vinh',
        huong: 'cha-me',
        quanHe: 'blood',
      }),
    ).toEqual({
      // subject = CON. Đây là dòng mà một lỗi ngược chiều sẽ hiện ra, và là dòng duy nhất.
      personId: 'hiep',
      spec: { kind: 'parent-child', parentId: 'vinh', relation: 'blood' },
    });
  });

  it('hướng "là con" đảo cả `personId` lẫn `parentId`, không đảo mỗi một cái', () => {
    expect(
      dungLoiGoiQuanHe({
        loai: 'parent-child',
        nguoiNayId: 'vinh',
        nguoiKiaId: 'hiep',
        huong: 'con',
        quanHe: 'blood',
      }),
    ).toEqual({
      personId: 'hiep',
      spec: { kind: 'parent-child', parentId: 'vinh', relation: 'blood' },
    });
  });

  it('`relation` đi thẳng vào spec, không rơi rụng', () => {
    const ra = dungLoiGoiQuanHe({
      loai: 'parent-child',
      nguoiNayId: 'a',
      nguoiKiaId: 'b',
      huong: 'cha-me',
      quanHe: 'heir',
    });
    expect(ra.spec).toEqual({ kind: 'parent-child', parentId: 'b', relation: 'heir' });
  });

  it('vợ chồng: KHÔNG mang chiều, và hướng không được lọt vào spec', () => {
    for (const huong of ['cha-me', 'con'] as const) {
      expect(
        dungLoiGoiQuanHe({
          loai: 'union-partner',
          nguoiNayId: 'a',
          nguoiKiaId: 'b',
          huong,
          quanHe: 'blood',
        }),
        huong,
      ).toEqual({ personId: 'a', spec: { kind: 'union-partner', partnerId: 'b' } });
    }
  });
});
