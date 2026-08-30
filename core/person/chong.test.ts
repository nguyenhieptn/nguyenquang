/**
 * Phép xếp chồng khẳng định (story 5-3) — test THUẦN, không DB, chạy mili-giây.
 *
 * Đây là phần đáng test nhất của story: nó là một hàm thuần, nên mọi tổ hợp (bảy loại × số dòng ×
 * tầng × trạng thái) đều dựng được bằng tay. Bài học từ 5-2: một phép dẫn xuất viết cho phạm vi
 * hẹp đem sang phạm vi rộng có thể sai IM LẶNG — nên phủ cả bảy loại, không chỉ bốn loại hay gặp.
 */
import { describe, it, expect } from 'vitest';
import type { AssertionKind } from '@/db/schema';
import type { PersonAssertion } from './index';
import { xepChong } from './chong';

let dem = 0;
function kd(
  kind: AssertionKind,
  tuy: Partial<PersonAssertion> & { createdAt?: string } = {},
): PersonAssertion {
  dem += 1;
  return {
    assertionId: `kd-${dem}`,
    kind,
    valueText: `giá trị ${dem}`,
    confidence: 'ton-nghi',
    tier: 'tentative',
    status: 'live',
    sourceKind: 'self',
    sourceDescription: 'tự khai',
    createdByName: 'Người ghi',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...tuy,
  };
}

describe('xếp chồng khẳng định — mâu thuẫn vs nối tiếp', () => {
  it('bốn loại ĐƠN TRỊ chồng nhau là MÂU THUẪN — phải chọn một', () => {
    // `gio` (7-5) là loại đơn trị thứ năm: một người một ngày giỗ.
    for (const kind of ['name', 'gender', 'birth', 'death', 'gio'] as const) {
      const ra = xepChong([kd(kind), kd(kind)]);
      expect(ra, kind).toHaveLength(1);
      expect(ra[0].stackKind, kind).toBe('mau-thuan');
      expect(ra[0].rows, kind).toHaveLength(2);
    }
  });

  it('ba loại ĐA TRỊ chồng nhau là NỐI TIẾP — không phải chọn gì', () => {
    // Cha và mẹ là hai khẳng định cha-con; nhiều đời vợ là chuyện phả cổ chép thật; ghi chú thì
    // càng nhiều càng tốt. Bày ba thứ này thành "mâu thuẫn" là bắt người duyệt xoá bớt sự thật.
    for (const kind of ['parent-child', 'union-partner', 'note'] as const) {
      const ra = xepChong([kd(kind), kd(kind), kd(kind)]);
      expect(ra, kind).toHaveLength(1);
      expect(ra[0].stackKind, kind).toBe('noi-tiep');
      expect(ra[0].rows, kind).toHaveLength(3);
    }
  });

  it('đúng một dòng thì không phải chồng, dù thuộc loại nào', () => {
    for (const kind of [
      'name',
      'gender',
      'birth',
      'death',
      'parent-child',
      'union-partner',
      'note',
    ] as const) {
      const ra = xepChong([kd(kind)]);
      expect(ra[0].stackKind, kind).toBe('don');
    }
  });

  it('chồng mâu thuẫn: CHÍNH THỨC trước, rồi mới nhất trước', () => {
    const cu = kd('birth', { tier: 'tentative', createdAt: '2026-01-01T00:00:00.000Z' });
    const moi = kd('birth', { tier: 'tentative', createdAt: '2026-06-01T00:00:00.000Z' });
    const that = kd('birth', { tier: 'official', createdAt: '2020-01-01T00:00:00.000Z' });

    const ra = xepChong([cu, moi, that]);
    expect(ra[0].stackKind).toBe('mau-thuan');
    // Dòng chính thức đứng đầu DÙ nó cũ nhất: người duyệt cần thấy "cái gì đang là sự thật sống"
    // trước khi so với cái đang đòi thay nó.
    expect(ra[0].rows.map((r) => r.assertionId)).toEqual([
      that.assertionId,
      moi.assertionId,
      cu.assertionId,
    ]);
  });

  it('chồng nối tiếp: CŨ NHẤT trước — nó là một dòng chảy, không phải cuộc thi', () => {
    const sau = kd('note', { createdAt: '2026-06-01T00:00:00.000Z' });
    const truoc = kd('note', { createdAt: '2020-01-01T00:00:00.000Z' });
    const ra = xepChong([sau, truoc]);
    expect(ra[0].rows.map((r) => r.assertionId)).toEqual([truoc.assertionId, sau.assertionId]);
  });

  it('khẳng định ĐÃ ẨN không vào chồng (AD-17)', () => {
    // Một lượt báo cáo là ẩn ngay, chưa cần duyệt — nên nó đang chờ phân xử, không phải đang là
    // ứng viên cho sự thật. Chỗ của nó là khu "đã ẩn theo báo cáo" ở màn Hàng chờ.
    const ra = xepChong([kd('birth'), kd('birth', { status: 'hidden' })]);
    expect(ra).toHaveLength(1);
    expect(ra[0].rows).toHaveLength(1);
    // Và một dòng sống + một dòng ẩn KHÔNG được thành mâu thuẫn.
    expect(ra[0].stackKind).toBe('don');
  });

  it('ẩn hết thì loại ấy biến mất khỏi panel, không để lại chồng rỗng', () => {
    const ra = xepChong([kd('note', { status: 'hidden' })]);
    expect(ra).toEqual([]);
  });

  it('thứ tự các chồng cố định, không theo thứ tự dữ liệu trả về', () => {
    // Panel nhảy chỗ giữa hai lần đọc là cách nhanh nhất làm người vận hành mất lòng tin vào màn.
    const ra = xepChong([kd('note'), kd('birth'), kd('name'), kd('union-partner'), kd('gender')]);
    expect(ra.map((s) => s.kind)).toEqual(['name', 'gender', 'birth', 'union-partner', 'note']);
  });

  it('không có khẳng định nào thì không có chồng nào', () => {
    expect(xepChong([])).toEqual([]);
  });
});

describe('story 6-5 — hai lớp mâu thuẫn mà 5-3 để lọt', () => {
  it('hai cha cùng giới cùng relation ⇒ chồng parent-child thành MÂU THUẪN, kèm đúng một cụm hai dòng', () => {
    const cha1 = kd('parent-child', { nhomPhu: 'male|blood', doiTuongId: 'p-cha1' });
    const me = kd('parent-child', { nhomPhu: 'female|blood', doiTuongId: 'p-me' });
    const cha2 = kd('parent-child', { nhomPhu: 'male|blood', doiTuongId: 'p-cha2' });
    const ra = xepChong([cha1, me, cha2]);
    expect(ra[0].stackKind).toBe('mau-thuan');
    expect(ra[0].cumMauThuan).toHaveLength(1);
    expect(ra[0].cumMauThuan![0].sort()).toEqual([cha1.assertionId, cha2.assertionId].sort());
    // Mẹ vẫn trong chồng, không phải chọn — và thứ tự vẫn là dòng chảy cũ nhất trước.
    expect(ra[0].rows).toHaveLength(3);
  });

  it('CÙNG MỘT người cha ghi hai lần ⇒ KHÔNG mâu thuẫn — hai lời khai về cùng một điều (code review 29/08)', () => {
    // `core/merge` gộp hai hồ sơ cha trùng thì repoint cả hai cạnh về một người: đúng hình này.
    const ra = xepChong([
      kd('parent-child', { nhomPhu: 'male|blood', doiTuongId: 'p-cha' }),
      kd('parent-child', { nhomPhu: 'male|blood', doiTuongId: 'p-cha' }),
    ]);
    expect(ra[0].stackKind).toBe('noi-tiep');
    expect(ra[0].cumMauThuan).toBeUndefined();
  });

  it('hai cha VÀ hai mẹ ⇒ HAI cụm riêng — một cha chính thức không khoá hai người mẹ', () => {
    const ra = xepChong([
      kd('parent-child', { nhomPhu: 'male|blood', doiTuongId: 'c1' }),
      kd('parent-child', { nhomPhu: 'male|blood', doiTuongId: 'c2' }),
      kd('parent-child', { nhomPhu: 'female|blood', doiTuongId: 'm1' }),
      kd('parent-child', { nhomPhu: 'female|blood', doiTuongId: 'm2' }),
    ]);
    expect(ra[0].stackKind).toBe('mau-thuan');
    expect(ra[0].cumMauThuan).toHaveLength(2);
    expect(ra[0].cumMauThuan!.map((c) => c.length)).toEqual([2, 2]);
  });

  it('cha + mẹ (khác giới) ⇒ vẫn NỐI TIẾP; cha ruột + cha nuôi (khác relation) ⇒ nối tiếp', () => {
    expect(xepChong([kd('parent-child', { nhomPhu: 'male|blood' }), kd('parent-child', { nhomPhu: 'female|blood' })])[0].stackKind).toBe('noi-tiep');
    expect(xepChong([kd('parent-child', { nhomPhu: 'male|blood' }), kd('parent-child', { nhomPhu: 'male|adopted' })])[0].stackKind).toBe('noi-tiep');
  });

  it('hai cha CHƯA RÕ GIỚI thì KHÔNG đụng nhau — có thể là cha + mẹ chưa khai giới, nghiêng về không báo nhầm', () => {
    const ra = xepChong([kd('parent-child', { nhomPhu: '?|blood' }), kd('parent-child', { nhomPhu: '?|blood' })]);
    expect(ra[0].stackKind).toBe('noi-tiep');
    expect(ra[0].cumMauThuan).toBeUndefined();
  });

  it('hai quê quán KHÁC nơi ⇒ mâu thuẫn; quê quán + trú quán ⇒ nối tiếp', () => {
    const q1 = kd('place', { nhomPhu: 'que-quan', noiId: 'noi-a' });
    const q2 = kd('place', { nhomPhu: 'que-quan', noiId: 'noi-b' });
    const tru = kd('place', { nhomPhu: 'tru-quan', noiId: 'noi-c' });
    const ra = xepChong([q1, tru, q2]);
    expect(ra[0].stackKind).toBe('mau-thuan');
    expect(ra[0].cumMauThuan![0].sort()).toEqual([q1.assertionId, q2.assertionId].sort());
    expect(xepChong([q1, tru])[0].stackKind).toBe('noi-tiep');
  });

  it('quê quán KHÔNG giải được nơi (`noiId` vắng) đứng ngoài — không tự sinh mâu thuẫn với mọi quê khác', () => {
    const ra = xepChong([kd('place', { nhomPhu: 'que-quan', noiId: 'noi-a' }), kd('place', { nhomPhu: 'que-quan' })]);
    expect(ra[0].stackKind).toBe('noi-tiep');
  });

  it('hai quê quán CÙNG một nơi (sau khi giải chuỗi gộp) ⇒ không phải mâu thuẫn — hai lời khai về cùng một điều', () => {
    const ra = xepChong([kd('place', { nhomPhu: 'que-quan', noiId: 'noi-a' }), kd('place', { nhomPhu: 'que-quan', noiId: 'noi-a' })]);
    expect(ra[0].stackKind).toBe('noi-tiep');
  });

  it('dòng ẩn không tham gia đụng độ (AD-17)', () => {
    const ra = xepChong([kd('parent-child', { nhomPhu: 'male|blood' }), kd('parent-child', { nhomPhu: 'male|blood', status: 'hidden' })]);
    expect(ra[0].stackKind).toBe('don');
  });
});
