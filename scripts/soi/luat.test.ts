/**
 * LUẬT ĐO — bài test THUẦN, không mở trình duyệt, không chạm database.
 *
 * Vì sao luật tách khỏi `page.evaluate`: mọi phép đo của bốn script cũ nằm gọn trong thân
 * `evaluate`, nên không bài test nào chạm tới được, và bốn cài đặt của cùng một luật lặng lẽ trôi
 * xa nhau (sàn chạm đo bề ngang ở một script, ba script kia thì không). Trình duyệt THU SỐ; quyết
 * XANH/ĐỎ là hàm thuần, và hàm thuần thì test được ở đây.
 */
import { describe, expect, it } from 'vitest';
import {
  CAO_MOT_DONG,
  SAN,
  THANG_CO_CHU,
  canHangRaoXa,
  giaoNhau,
  laMayNay,
  luatCotPhai,
  luatDemDay,
  luatLoiConsole,
  luatNhanDeTen,
  luatSanCham,
  luatSanChu,
  luatSoiRong,
  luatTranNgang,
  luatTuongPhan,
} from './luat';

describe('sàn chữ', () => {
  it('đúng 15px thì ĐẠT — 15px là nấc caption của thang, không phải ngoại lệ', () => {
    expect(luatSanChu([{ chon: 'span', the: 'span', px: 15, chu: 'chú thích' }])).toEqual([]);
  });

  it('15px trong <p> cũng ĐẠT — caption nằm trong <p> là chuyện thường', () => {
    expect(luatSanChu([{ chon: 'p', the: 'p', px: 15, chu: 'Hiệp ghi · 2 ngày trước' }])).toEqual([]);
  });

  it('`text-sm` = 14.875px thì ĐỎ — hụt sàn đúng 0.125px vì gốc rem là 17px', () => {
    const ra = luatSanChu([{ chon: 'span', the: 'span', px: 14.875, chu: 'chú thích' }]);
    expect(ra).toHaveLength(1);
    expect(ra[0].loai).toBe('chu-duoi-san');
    expect(ra[0].canMatNguoi).toBeUndefined();
  });

  it('12.75px (`text-xs`) thì ĐỎ', () => {
    expect(luatSanChu([{ chon: 'span', the: 'span', px: 12.75, chu: 'x' }])).toHaveLength(1);
  });

  it('16px — trên sàn tuyệt đối nhưng KHÔNG có trong thang — thì NÊU RA, không hạ cổng', () => {
    const ra = luatSanChu([{ chon: 'p', the: 'p', px: 16, chu: 'câu văn' }]);
    expect(ra).toHaveLength(1);
    expect(ra[0].loai).toBe('co-chu-ngoai-thang');
    expect(ra[0].canMatNguoi).toBe(true);
  });

  it('17px im lặng hoàn toàn', () => {
    expect(luatSanChu([{ chon: 'p', the: 'p', px: 17, chu: 'câu văn' }])).toEqual([]);
  });

  it('23px (display) im lặng — sàn chỉ chặn phía DƯỚI', () => {
    expect(luatSanChu([{ chon: 'h1', the: 'h1', px: 23, chu: 'Tiêu đề' }])).toEqual([]);
  });

  it('thang khai đúng DESIGN.md § typography', () => {
    expect(THANG_CO_CHU).toEqual([15, 17, 23]);
  });
});

describe('sàn chạm', () => {
  it('đúng 44×44 thì ĐẠT', () => {
    expect(luatSanCham([{ chon: 'button', cao: 44, rong: 44, chu: 'Duyệt' }])).toEqual([]);
  });

  it('cao 44 mà rộng 20 thì ĐỎ — mắt không thấy, chuột không bấm', () => {
    const ra = luatSanCham([{ chon: 'a', cao: 44, rong: 20, chu: '' }]);
    expect(ra).toHaveLength(1);
    expect(ra[0].loai).toBe('cham-duoi-san');
  });

  it('cao 43.9 thì ĐỎ', () => {
    expect(luatSanCham([{ chon: 'button', cao: 43.9, rong: 100, chu: 'x' }])).toHaveLength(1);
  });

  it('phần tử cao 0 bị bỏ qua — nó đang ẩn, không phải đích chạm hụt sàn', () => {
    expect(luatSanCham([{ chon: 'button', cao: 0, rong: 0, chu: 'ẩn' }])).toEqual([]);
  });
});

describe('tràn ngang', () => {
  it('thân trang vừa khít thì ĐẠT', () => {
    expect(luatTranNgang({ than: 1280, khung: 1280, boCuon: [] })).toEqual([]);
  });

  it('lệch 1px bỏ qua — `scrollWidth` là số nguyên còn bề rộng đo được thì không', () => {
    expect(luatTranNgang({ than: 1281, khung: 1280, boCuon: [] })).toEqual([]);
  });

  it('thân trang tràn thì ĐỎ', () => {
    expect(luatTranNgang({ than: 1400, khung: 1280, boCuon: [] })).toHaveLength(1);
  });

  it('BỘ CUỘN CON tràn thì ĐỎ dù thân trang sạch — đúng chỗ lỗi 1239/972 của 6-8 nấp', () => {
    const ra = luatTranNgang({
      than: 1280,
      khung: 1280,
      boCuon: [{ ten: 'table', noiDung: 1239, hop: 972 }],
    });
    expect(ra).toHaveLength(1);
    expect(ra[0].loai).toBe('tran-bo-cuon');
  });
});

describe('nhãn đè tên — hồi quy Epic 5', () => {
  const ten = { trai: 10, tren: 11.7, phai: 150, duoi: 32.9 };

  it('nhãn nằm hẳn bên dưới thì ĐẠT', () => {
    expect(
      luatNhanDeTen([{ chu: 'tâm', ten, nhan: { trai: 10, tren: 40, phai: 60, duoi: 60 } }]),
    ).toEqual([]);
  });

  it('hai hình chạm mép nhau thì KHÔNG tính là đè', () => {
    expect(
      luatNhanDeTen([{ chu: 'tâm', ten, nhan: { trai: 10, tren: 32.9, phai: 60, duoi: 52 } }]),
    ).toEqual([]);
  });

  it('nhãn xuống dòng hai và giao vào tên thì ĐỎ — đúng ca 27/08 của Epic 5', () => {
    const ra = luatNhanDeTen([
      { chu: 'có người xin nhận', ten, nhan: { trai: 10, tren: 14.4, phai: 160, duoi: 35.1 } },
    ]);
    expect(ra).toHaveLength(1);
    expect(ra[0].loai).toBe('nhan-de-ten');
  });
});

describe('giaoNhau', () => {
  it('chạm mép không phải giao', () => {
    expect(giaoNhau({ trai: 0, tren: 0, phai: 10, duoi: 10 }, { trai: 10, tren: 0, phai: 20, duoi: 10 })).toBe(false);
  });
  it('chồng 1px là giao', () => {
    expect(giaoNhau({ trai: 0, tren: 0, phai: 10, duoi: 10 }, { trai: 9, tren: 0, phai: 20, duoi: 10 })).toBe(true);
  });
  it('rời hẳn nhau thì không giao', () => {
    expect(giaoNhau({ trai: 0, tren: 0, phai: 10, duoi: 10 }, { trai: 50, tren: 50, phai: 60, duoi: 60 })).toBe(false);
  });
});

describe('đệm đáy — hồi quy Epic 5', () => {
  it('đệm đúng bằng khai báo thì ĐẠT', () => {
    expect(luatDemDay({ dayNoiDung: 966, dayKhoi: 1000, demKhaiBao: 34 })).toEqual([]);
  });

  it('đệm 0px thì ĐỎ — đó chính là con số đo được hôm lỗi bật', () => {
    const ra = luatDemDay({ dayNoiDung: 1000, dayKhoi: 1000, demKhaiBao: 34 });
    expect(ra).toHaveLength(1);
    expect(ra[0].loai).toBe('mat-dem-day');
  });

  it('đệm thừa ra thì vẫn ĐẠT', () => {
    expect(luatDemDay({ dayNoiDung: 900, dayKhoi: 1000, demKhaiBao: 34 })).toEqual([]);
  });
});

describe('tương phản', () => {
  it('đúng 4.5:1 thì ĐẠT', () => {
    expect(luatTuongPhan([{ chon: 'p', ti: 4.5, chu: 'x' }])).toEqual([]);
  });
  it('4.49 thì ĐỎ', () => {
    expect(luatTuongPhan([{ chon: 'p', ti: 4.49, chu: 'x' }])).toHaveLength(1);
  });
  it('node tồn nghi KHÔNG được miễn — tầng tồn nghi khác chất liệu, không được nhạt đi', () => {
    const ra = luatTuongPhan([{ chon: '.node-ton-nghi p', ti: 3.1, chu: 'Nguyễn Văn A' }]);
    expect(ra).toHaveLength(1);
  });
});

describe('soi rỗng — một cổng soi 0 phần tử là cổng đang tắt', () => {
  it('soi được phần tử thì ĐẠT', () => {
    expect(luatSoiRong('nhóm người', 3)).toEqual([]);
  });
  it('soi 0 phần tử thì ĐỎ, không phải XANH', () => {
    const ra = luatSoiRong('nhóm người', 0);
    expect(ra).toHaveLength(1);
    expect(ra[0].loai).toBe('soi-rong');
  });
});

describe('lỗi console', () => {
  it('không lỗi thì ĐẠT', () => {
    expect(luatLoiConsole([])).toEqual([]);
  });
  it('có lỗi thì ĐỎ', () => {
    expect(luatLoiConsole(['TypeError: x'])).toHaveLength(1);
  });
});

describe('hàng rào máy xa', () => {
  const MAY = ['127.0.0.1', '192.168.31.168', '100.94.148.68'];

  it('127.0.0.1 và localhost là máy này', () => {
    expect(laMayNay('http://127.0.0.1:3100')).toBe(true);
    expect(laMayNay('http://localhost:3000/')).toBe(true);
  });

  it('IP Tailscale của CHÍNH máy này là máy này — dự án chạy server ở đó', () => {
    expect(laMayNay('http://100.94.148.68:3100', MAY)).toBe(true);
  });

  it('IP LAN của chính máy này cũng vậy', () => {
    expect(laMayNay('http://192.168.31.168:3100', MAY)).toBe(true);
  });

  it('một địa chỉ KHÔNG gắn trên máy này thì không phải máy này', () => {
    expect(laMayNay('http://100.94.148.99:3000', MAY)).toBe(false);
  });

  it('không truyền danh sách thì chỉ loopback — mặc định chặt, không lỏng', () => {
    expect(laMayNay('http://100.94.148.68:3100')).toBe(false);
  });

  it('"localhost.kẻ-gian.vn" KHÔNG được tính là máy này', () => {
    expect(laMayNay('http://localhost.ke-gian.vn', MAY)).toBe(false);
  });

  it('máy KHÁC mà không có cờ thì CHẶN', () => {
    expect(canHangRaoXa('http://10.0.0.5:3000', undefined, MAY)).not.toBeNull();
  });

  it('máy khác có cờ SOI_CHO_PHEP_XA=1 thì cho qua', () => {
    expect(canHangRaoXa('http://10.0.0.5:3000', '1', MAY)).toBeNull();
  });

  it('máy này thì không cần cờ', () => {
    expect(canHangRaoXa('http://100.94.148.68:3100', undefined, MAY)).toBeNull();
  });
});

describe('ngưỡng khai ra đúng tài liệu', () => {
  it('sàn khớp EXPERIENCE.md § Accessibility Floor', () => {
    expect(SAN).toEqual({ chuTuyetDoi: 15, chuThan: 17, cham: 44, tuongPhan: 4.5 });
  });
});

describe('cột phải — trả nợ 6-7', () => {
  it('chồng khẳng định còn trong tầm nhìn thì ĐẠT', () => {
    expect(luatCotPhai({ gayDong: [], chongTren: 420, khungCao: 900 })).toEqual([]);
  });

  it('chồng bị đẩy xuống dưới đáy khung nhìn thì ĐỎ — đúng AC 18 của 6-7', () => {
    const ra = luatCotPhai({ gayDong: [], chongTren: 940, khungCao: 900 });
    expect(ra).toHaveLength(1);
    expect(ra[0].loai).toBe('chong-bi-day-khoi-tam-nhin');
    expect(ra[0].canMatNguoi).toBeUndefined();
  });

  it('chồng bắt đầu đúng ở mép đáy cũng ĐỎ — không nhìn thấy gì thì bằng không', () => {
    expect(luatCotPhai({ gayDong: [], chongTren: 900, khungCao: 900 })).toHaveLength(1);
  });

  it('không tìm thấy chồng thì không phán — phép đo khác lo chuyện màn trắng', () => {
    expect(luatCotPhai({ gayDong: [], chongTren: null, khungCao: 900 })).toEqual([]);
  });

  it('nhãn gãy dòng thì NÊU RA chứ không hạ cổng — tên chi dài xuống dòng là đúng', () => {
    const ra = luatCotPhai({ gayDong: [{ chu: 'chi Nguyễn Quang Trung Hạ', cao: 63 }], chongTren: 300, khungCao: 900 });
    expect(ra).toHaveLength(1);
    expect(ra[0].canMatNguoi).toBe(true);
  });

  it('ngưỡng một dòng là 46.75px = `min-h-11` ở gốc chữ 17px, không phải 50px', () => {
    expect(CAO_MOT_DONG).toBe(46.75);
  });
});
