/**
 * Bài kiểm cho toán bố cục cây — sinh ra từ một lỗi THẬT người dùng báo 23/08/2026:
 * "các thông tin card đè vào nhau".
 *
 * Nguyên nhân: hàng cách nhau một hằng số `CAO_HANG = 210`, trong khi thẻ có vợ/chồng + dòng ghi
 * công cao 230–300px. Thẻ cao hơn hằng số thì tràn xuống hàng dưới.
 *
 * Bài kiểm dưới đây là bài kiểm CHỐNG TÁI PHÁT, viết theo tính chất chứ không theo con số:
 * *không hai thẻ nào chồng lấn nhau*, với chiều cao lệch nhau thế nào cũng vậy. Một hằng số mới
 * lọt vào đây lần nữa là test đỏ ngay.
 */
import { describe, it, expect } from 'vitest';
import { xepCay, type NutCay } from './xep-cay';

type Nut = NutCay & { cao: number };

/** Cùng bộ tham số mà `cay-gia-pha.tsx` dùng thật. */
const RONG = 264;
const HO_NGANG = 24;
const HO_DOC = 56;

function xep(nut: Nut[]) {
  const cao = new Map(nut.map((n) => [n.id, n.cao]));
  return xepCay(nut, {
    rong: RONG,
    hoNgang: HO_NGANG,
    hoDoc: HO_DOC,
    cao: (id) => cao.get(id) ?? 0,
  });
}

/** Hai hình chữ nhật có phần trong giao nhau không (chạm mép không tính là đè). */
function deNhau(
  a: { x: number; y: number; rong: number; cao: number },
  b: { x: number; y: number; rong: number; cao: number },
): boolean {
  return a.x < b.x + b.rong && b.x < a.x + a.rong && a.y < b.y + b.cao && b.y < a.y + a.cao;
}

function timChoDe(nut: Nut[]) {
  const viTri = xep(nut);
  const hop = nut.map((n) => ({
    id: n.id,
    ...(viTri.get(n.id) ?? { x: 0, y: 0 }),
    rong: RONG,
    cao: n.cao,
  }));
  const de: string[] = [];
  for (let i = 0; i < hop.length; i += 1) {
    for (let j = i + 1; j < hop.length; j += 1) {
      if (deNhau(hop[i], hop[j])) de.push(`${hop[i].id} ✕ ${hop[j].id}`);
    }
  }
  return de;
}

describe('xepCay — không thẻ nào đè lên thẻ nào', () => {
  it('thẻ cao thấp lệch hẳn nhau vẫn không đè (ca gây lỗi gốc)', () => {
    // Cụ tổ có vợ + dòng ghi công (thẻ 300px) trên một hằng số cũ 210px ⇒ tràn xuống đời sau.
    const nut: Nut[] = [
      { id: 'to', chaId: null, cao: 300 },
      { id: 'con-1', chaId: 'to', cao: 132 },
      { id: 'con-2', chaId: 'to', cao: 288 },
      { id: 'chau-1', chaId: 'con-2', cao: 176 },
      { id: 'chau-2', chaId: 'con-2', cao: 132 },
    ];
    expect(timChoDe(nut)).toEqual([]);
  });

  it('một đời toàn thẻ cao vẫn đẩy được đời sau xuống đủ', () => {
    const nut: Nut[] = [
      { id: 'to', chaId: null, cao: 140 },
      ...Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, chaId: 'to', cao: 340 })),
      ...Array.from({ length: 6 }, (_, i) => ({ id: `x${i}`, chaId: `c${i}`, cao: 140 })),
    ];
    expect(timChoDe(nut)).toEqual([]);
  });

  it('nhiều mảnh rời cùng lúc: không mảnh nào chồng lên mảnh nào', () => {
    const nut: Nut[] = [
      { id: 'a', chaId: null, cao: 200 },
      { id: 'a1', chaId: 'a', cao: 260 },
      { id: 'b', chaId: null, cao: 320 },
      { id: 'b1', chaId: 'b', cao: 130 },
      { id: 'c', chaId: null, cao: 130 },
    ];
    expect(timChoDe(nut)).toEqual([]);
  });

  it('cây một đường thẳng năm đời — đời sau luôn nằm hẳn dưới đời trước', () => {
    const nut: Nut[] = Array.from({ length: 5 }, (_, i) => ({
      id: `d${i}`,
      chaId: i === 0 ? null : `d${i - 1}`,
      cao: 140 + i * 45,
    }));
    const viTri = xep(nut);
    expect(timChoDe(nut)).toEqual([]);
    for (let i = 1; i < nut.length; i += 1) {
      const tren = viTri.get(`d${i - 1}`)!;
      const duoi = viTri.get(`d${i}`)!;
      // Đỉnh đời sau phải nằm dưới ĐÁY đời trước, cách đúng khoảng hở đã khai.
      expect(duoi.y).toBe(tren.y + nut[i - 1].cao + HO_DOC);
    }
  });
});

describe('xepCay — trục ngang giữ nguyên luật cũ', () => {
  it('cha đứng giữa bề rộng của cả nhánh con, không phải giữa hai con đầu–cuối', () => {
    // Nhánh lệch: con trái có 3 cháu, con phải không có ai.
    const nut: Nut[] = [
      { id: 'to', chaId: null, cao: 150 },
      { id: 'trai', chaId: 'to', cao: 150 },
      { id: 'phai', chaId: 'to', cao: 150 },
      { id: 'c1', chaId: 'trai', cao: 150 },
      { id: 'c2', chaId: 'trai', cao: 150 },
      { id: 'c3', chaId: 'trai', cao: 150 },
    ];
    const v = xep(nut);
    const giua = (id: string) => v.get(id)!.x + RONG / 2;
    // Cụ tổ đứng giữa toàn bộ bề rộng (4 cột lá: c1 c2 c3 + phải).
    expect(giua('to')).toBeCloseTo((giua('c1') + giua('phai')) / 2, 5);
    // Con trái đứng giữa ba cháu của mình.
    expect(giua('trai')).toBeCloseTo(giua('c2'), 5);
  });

  it('anh em cách nhau đúng khoảng hở ngang, không dính vào nhau', () => {
    const nut: Nut[] = [
      { id: 'to', chaId: null, cao: 150 },
      { id: 'a', chaId: 'to', cao: 150 },
      { id: 'b', chaId: 'to', cao: 150 },
    ];
    const v = xep(nut);
    expect(v.get('b')!.x - v.get('a')!.x).toBe(RONG + HO_NGANG);
  });
});
