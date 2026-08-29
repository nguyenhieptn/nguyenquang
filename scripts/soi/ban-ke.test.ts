import { describe, expect, it } from 'vitest';
import { type BanKe, demCanMat, demDaBiet, demDo, demManBoQua, luatPhaKhongDoi, veMan, veTongKet } from './ban-ke';

const man = (phepDo: BanKe['man'][number]['phepDo'], boQua?: string) => ({
  khoa: 'x',
  duong: '/x',
  rong: 1280,
  boQua,
  phepDo,
});

describe('đếm', () => {
  it('mục canMatNguoi KHÔNG được tính vào số làm đỏ cổng', () => {
    const bk: BanKe = {
      man: [
        man([
          {
            phep: 'chu',
            soPhanTu: 5,
            viPham: [
              { loai: 'a', moTa: 'thật sự đỏ' },
              { loai: 'b', moTa: 'chỉ cần nhìn', canMatNguoi: true },
            ],
          },
        ]),
      ],
    };
    expect(demDo(bk)).toBe(1);
    expect(demCanMat(bk)).toBe(1);
  });

  it('màn bỏ qua được đếm riêng — bỏ qua im lặng là cách một cổng tự tắt', () => {
    expect(demManBoQua({ man: [man([], 'chưa có dữ liệu'), man([])] })).toBe(1);
  });
});

describe('phả không được đổi vì một lượt đo', () => {
  it('hai số bằng nhau thì ĐẠT', () => {
    expect(luatPhaKhongDoi({ man: [], revisionTruoc: 120, revisionSau: 120 })).toEqual([]);
  });

  it('hai số khác nhau thì ĐỎ — lượt đo đã ghi vào phả', () => {
    const ra = luatPhaKhongDoi({ man: [], revisionTruoc: 120, revisionSau: 121 });
    expect(ra).toHaveLength(1);
    expect(ra[0].loai).toBe('pha-bi-doi');
    expect(ra[0].canMatNguoi).toBeUndefined();
  });

  it('không đếm được thì NÊU RA — một hàng rào tắt lặng lẽ là hàng rào tệ nhất', () => {
    const ra = luatPhaKhongDoi({ man: [] });
    expect(ra).toHaveLength(1);
    expect(ra[0].canMatNguoi).toBe(true);
  });
});

describe('nền đã biết trong bản kê', () => {
  const bkNo: BanKe = {
    man: [
      man([
        {
          phep: 'tương phản',
          soPhanTu: 9,
          viPham: [
            { loai: 'tuong-phan-thap', moTa: '4.42:1 < 4.5:1 — p · "x"' },
            { loai: 'tuong-phan-thap', moTa: '4.42:1 < 4.5:1 — span · "y"' },
            { loai: 'tuong-phan-thap', moTa: '3.10:1 < 4.5:1 — p · "z"' },
          ],
        },
      ]),
    ],
  };

  it('chỉ vi phạm MỚI mới hạ cổng', () => {
    expect(demDo(bkNo)).toBe(1);
  });

  it('nợ đếm theo TỪNG mục, không gộp một tổng', () => {
    const co = demDaBiet(bkNo).filter((d) => d.so > 0);
    expect(co).toHaveLength(1);
    expect(co[0].so).toBe(2);
  });

  it('tổng kết in số nợ kèm chỗ ghi nợ, để đếm tăng lên là nhìn thấy', () => {
    const t = veTongKet(bkNo);
    expect(t).toContain('1 vi phạm MỚI');
    expect(t).toContain('2 ×');
    expect(t).toContain('deferred-work.md');
  });

  it('màn có nợ vẫn in rõ MỚI và đã-ghi-nợ tách nhau', () => {
    expect(veMan(bkNo.man[0])).toContain('1 MỚI');
    expect(veMan(bkNo.man[0])).toContain('2 đã ghi nợ');
  });
});

describe('vẽ bản kê', () => {
  it('màn bỏ qua thì nói rõ lý do, không im lặng', () => {
    expect(veMan(man([], 'phả chưa có bản thu nào'))).toContain('phả chưa có bản thu nào');
  });

  it('in số phần tử đã soi — soi 0 phần tử phải nhìn thấy được', () => {
    expect(veMan(man([{ phep: 'chu', soPhanTu: 0, viPham: [] }]))).toContain('0 phần tử');
  });

  it('tổng kết nói cả hai con số: đỏ và cần mắt', () => {
    const s = veTongKet({
      man: [man([{ phep: 'chu', soPhanTu: 3, viPham: [{ loai: 'a', moTa: 'x', canMatNguoi: true }] }])],
      revisionTruoc: 5,
      revisionSau: 5,
    });
    expect(s).toContain('0 vi phạm MỚI');
    expect(s).toContain('1 mục cần mắt người');
    expect(s).toContain('phả không đổi');
  });
});
