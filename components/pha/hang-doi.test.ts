import { describe, expect, it } from 'vitest';
import { xepHangDoi } from './hang-doi';

const n = (id: string, doi: number | null) => ({ id, doi });

describe('xếp hàng theo đời', () => {
  it('đời trên ở trên, đời dưới ở dưới — xuống là đi về phía sau', () => {
    const ra = xepHangDoi([n('con', 4), n('to', 2), n('cha', 3)], 'cha');
    expect(ra.map((h) => h.doi)).toEqual([2, 3, 4]);
    expect(ra.map((h) => h.nhan)).toEqual(['Đời 2', 'Đời 3', 'Đời 4']);
  });

  it('hàng có mình mang cờ `coMinh`, các hàng khác thì không', () => {
    const ra = xepHangDoi([n('to', 2), n('minh', 3), n('em', 3)], 'minh');
    expect(ra.map((h) => h.coMinh)).toEqual([false, true]);
  });

  it('người chưa rõ đời xếp thành hàng CUỐI, có nhãn nói thẳng — không đoán mò, không giấu', () => {
    const ra = xepHangDoi([n('roi', null), n('to', 1)], null);
    expect(ra.map((h) => h.doi)).toEqual([1, null]);
    expect(ra[1].nhan).toBe('Chưa rõ đời');
  });

  it('giữ nguyên thứ tự trong hàng như core trả về (core đã xếp theo mã chi)', () => {
    const ra = xepHangDoi([n('b', 3), n('a', 3), n('c', 3)], null);
    expect(ra[0].nut.map((x) => x.id)).toEqual(['b', 'a', 'c']);
  });

  it('rỗng ⇒ rỗng, không hàng giả', () => {
    expect(xepHangDoi([], 'x')).toEqual([]);
  });
});
