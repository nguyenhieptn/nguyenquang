/**
 * Gom hàng chờ theo người (story 6-8) — test THUẦN.
 */
import { describe, it, expect } from 'vitest';
import { DON_TRI, HANG } from '@/core/person';
import { coTheDuyetCaNhom, gomTheoNguoi, type DongCho } from './gom-hang-cho';

/**
 * LUẬT THẬT từ core, không phải bản chép tay (sửa 27/08 sau code review).
 *
 * Bản đầu chép tay `DON_TRI`/`HANG` vào đây — đúng thứ story vừa xuất chúng ra khỏi core để khỏi
 * phải chép. Hậu quả đo được: bài test không bao giờ chạy trên luật thật, nên nó không bảo vệ
 * được gì khi luật đổi.
 */
const LUAT = { donTri: DON_TRI, thuTuLoai: HANG };

/**
 * Hình dạng THẬT mà `raDong` (`app/admin/hang-cho/page.tsx`) sinh ra: có CẢ `luc` (chuỗi đã định
 * dạng cho mắt) lẫn `lucISO`. Bản đầu chỉ truyền một trường ISO tên `luc` — dữ liệu mà production
 * không bao giờ đưa vào — nên nó che mất lỗi xếp theo chuỗi hiển thị suốt cả story.
 */
type DongNhuThat = DongCho & { luc: string };

const d = (a: Partial<DongNhuThat> & { assertionId: string }): DongNhuThat => {
  const iso = a.lucISO ?? '2026-08-20T00:00:00Z';
  return {
    personId: 'p1',
    personName: 'Nguyễn Quang A',
    kind: 'note',
    lucISO: iso,
    // Đúng phép định dạng của `page.tsx` — "HH:mm · DD/MM/YYYY".
    luc: `${iso.slice(11, 16)} · ${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`,
    ...a,
  };
};

describe('gom theo người', () => {
  it('mỗi người một nhóm, mang tên và số dòng của mình', () => {
    const n = gomTheoNguoi(
      [d({ assertionId: 'a1' }), d({ assertionId: 'a2' }), d({ assertionId: 'b1', personId: 'p2', personName: 'B' })],
      LUAT,
    );
    expect(n).toHaveLength(2);
    expect(n.find((x) => x.personId === 'p1')!.dong).toHaveLength(2);
    expect(n.find((x) => x.personId === 'p2')!.personName).toBe('B');
  });

  /**
   * CŨ NHẤT trước, không phải NHIỀU NHẤT trước: một người có mười dòng mới gửi không đáng chen
   * lên trước một người có đúng một dòng đã nằm đây ba tuần. Xếp theo số dòng còn làm danh sách
   * tự xáo dưới tay người đang đọc, mỗi lần duyệt xong một mục.
   */
  /**
   * HỒI QUY 27/08 — bài này phải xếp bằng `lucISO`, và ca dưới đây là ca mà chuỗi hiển thị xếp
   * NGƯỢC: "23:50 · 01/08" đứng sau "01:10 · 26/08" theo `localeCompare`, vì khoá đầu là GIỜ.
   */
  it('xếp bằng lucISO, KHÔNG bằng chuỗi hiển thị', () => {
    const n = gomTheoNguoi(
      [
        d({ assertionId: 'cu', personId: 'p-cu', lucISO: '2026-08-01T23:50:00Z' }),
        d({ assertionId: 'moi', personId: 'p-moi', lucISO: '2026-08-26T01:10:00Z' }),
      ],
      LUAT,
    );
    expect(n.map((x) => x.personId)).toEqual(['p-cu', 'p-moi']);
    // Và chứng minh chuỗi hiển thị THẬT SỰ xếp ngược — nếu không, bài trên vô nghĩa.
    expect('23:50 · 01/08/2026'.localeCompare('01:10 · 26/08/2026')).toBeGreaterThan(0);
  });

  it('nhóm xếp CŨ NHẤT trước, không theo số dòng', () => {
    const n = gomTheoNguoi(
      [
        d({ assertionId: 'moi1', personId: 'nhieu', lucISO: '2026-08-25T00:00:00Z' }),
        d({ assertionId: 'moi2', personId: 'nhieu', lucISO: '2026-08-26T00:00:00Z' }),
        d({ assertionId: 'moi3', personId: 'nhieu', lucISO: '2026-08-27T00:00:00Z' }),
        d({ assertionId: 'cu', personId: 'mot-dong', lucISO: '2026-08-01T00:00:00Z' }),
      ],
      LUAT,
    );
    expect(n.map((x) => x.personId)).toEqual(['mot-dong', 'nhieu']);
  });

  it('trong nhóm xếp theo thứ tự phiếu lý lịch, rồi cũ trước', () => {
    const n = gomTheoNguoi(
      [
        d({ assertionId: 'ghiChu', kind: 'note' }),
        d({ assertionId: 'ten', kind: 'name' }),
        d({ assertionId: 'sinh', kind: 'birth' }),
      ],
      LUAT,
    );
    expect(n[0]!.dong.map((x) => x.assertionId)).toEqual(['ten', 'sinh', 'ghiChu']);
  });

  /** Fail CLOSED: `kind` lạ coi như đơn trị, kẻo máy nâng hai giá trị chính thức của nó. */
  it('loại LẠ ⇒ coi như ĐƠN TRỊ, không lọt vào lượt duyệt nhóm', () => {
    const n = gomTheoNguoi(
      [
        d({ assertionId: 'la1', kind: 'loai-tuong-lai' }),
        d({ assertionId: 'la2', kind: 'loai-tuong-lai' }),
      ],
      LUAT,
    );
    expect(n[0]!.cumDungDo).toHaveLength(1);
    expect(n[0]!.duyetDuoc).toEqual([]);
  });

  it('loại LẠ xếp xuống cuối, không chen lên trước Tên', () => {
    const n = gomTheoNguoi(
      [d({ assertionId: 'la', kind: 'loai-tuong-lai' }), d({ assertionId: 'ten', kind: 'name' })],
      LUAT,
    );
    expect(n[0]!.dong.map((x) => x.assertionId)).toEqual(['ten', 'la']);
  });
});

describe('cụm đụng độ đơn trị', () => {
  it('hai khẳng định cùng loại ĐƠN TRỊ ⇒ một cụm, và cả hai bị loại khỏi lượt duyệt nhóm', () => {
    const n = gomTheoNguoi(
      [
        d({ assertionId: 'sinh-a', kind: 'birth' }),
        d({ assertionId: 'sinh-b', kind: 'birth' }),
        d({ assertionId: 'ghiChu', kind: 'note' }),
      ],
      LUAT,
    );
    expect(n[0]!.cumDungDo).toEqual([{ kind: 'birth', assertionIds: ['sinh-a', 'sinh-b'] }]);
    expect(n[0]!.duyetDuoc).toEqual(['ghiChu']);
  });

  it('nhiều dòng cùng loại KHÔNG đơn trị ⇒ không phải đụng độ', () => {
    const n = gomTheoNguoi(
      [
        d({ assertionId: 'cha', kind: 'parent-child' }),
        d({ assertionId: 'me', kind: 'parent-child' }),
      ],
      LUAT,
    );
    expect(n[0]!.cumDungDo).toEqual([]);
    expect(n[0]!.duyetDuoc).toEqual(['cha', 'me']);
  });

  it('đụng độ chỉ tính TRONG một người, không xuyên người', () => {
    const n = gomTheoNguoi(
      [
        d({ assertionId: 'a', kind: 'birth', personId: 'p1' }),
        d({ assertionId: 'b', kind: 'birth', personId: 'p2' }),
      ],
      LUAT,
    );
    expect(n.every((x) => x.cumDungDo.length === 0)).toBe(true);
  });

  it('cả nhóm toàn đụng độ ⇒ không duyệt trọn gói được', () => {
    const n = gomTheoNguoi(
      [d({ assertionId: 'a', kind: 'name' }), d({ assertionId: 'b', kind: 'name' })],
      LUAT,
    );
    expect(n[0]!.duyetDuoc).toEqual([]);
    expect(coTheDuyetCaNhom(n[0]!)).toBe(false);
  });

  it('ba dòng cùng một loại đơn trị ⇒ cả ba vào cụm', () => {
    const n = gomTheoNguoi(
      ['a', 'b', 'c'].map((id) => d({ assertionId: id, kind: 'gender' })),
      LUAT,
    );
    expect(n[0]!.cumDungDo[0]!.assertionIds).toHaveLength(3);
    expect(n[0]!.duyetDuoc).toEqual([]);
  });
});

/**
 * BẤT BIẾN của story (AC 11): người vận hành không bao giờ thấy máy tự chọn giữa hai giá trị.
 * Phép gom phải đảm bảo `duyetHangLoat` KHÔNG BAO GIỜ nhận hai dòng cùng loại đơn trị của cùng
 * một người trong một lượt — vì `promoteAssertionOp` nâng cái đầu rồi từ chối cái sau, tức chọn
 * hộ bằng thứ tự lặp.
 */
describe('bất biến: không lượt duyệt nhóm nào chứa hai giá trị cùng chọi nhau', () => {
  const LOAI = ['name', 'gender', 'birth', 'death', 'parent-child', 'note'];
  it('đúng với 200 tổ hợp ngẫu nhiên dựng bằng số giả ổn định', () => {
    let hat = 7;
    const rnd = (n: number) => ((hat = (hat * 1103515245 + 12345) % 2147483648) >>> 8) % n;
    for (let lan = 0; lan < 200; lan += 1) {
      const dong: DongCho[] = [];
      for (let i = 0; i < 1 + rnd(9); i += 1) {
        dong.push(
          d({
            assertionId: `a${lan}-${i}`,
            personId: `p${rnd(3)}`,
            kind: LOAI[rnd(LOAI.length)]!,
            lucISO: `2026-08-${String(1 + rnd(27)).padStart(2, '0')}T00:00:00Z`,
          }),
        );
      }
      for (const n of gomTheoNguoi(dong, LUAT)) {
        const daThay = new Set<string>();
        for (const id of n.duyetDuoc) {
          const kind = n.dong.find((x) => x.assertionId === id)!.kind;
          if (!LUAT.donTri[kind as keyof typeof LUAT.donTri]) continue;
          expect(daThay.has(kind), `lượt ${lan}: hai dòng ${kind} cùng vào một lượt duyệt`).toBe(false);
          daThay.add(kind);
        }
      }
    }
  });
});
