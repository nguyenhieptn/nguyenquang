/**
 * ÂM LỊCH VIỆT NAM — hàm THUẦN, không thư viện (story 7-5, FR-41).
 *
 * Thuật toán của Hồ Ngọc Đức (2004, *"Âm lịch Việt Nam"*), múi giờ +7. Không kéo `amlich.js`
 * vào bó: nó là ~120 dòng số học đã công bố, và một hàm thuần có test đối chiếu thì đáng tin hơn
 * một gói không ai bảo trì. Test ở `am-lich.test.ts` neo vào các mốc đã biết — sai một mốc là đỏ.
 *
 * Quy ước: tháng/ngày là số âm lịch 1-based; `nhuan` là "tháng nhuận" (tháng lặp thứ hai).
 */
const MUI_GIO = 7;
const INT = Math.floor;
const PI = Math.PI;

export type NgayAm = { ngay: number; thang: number; nam: number; nhuan: boolean };
export type NgayDuong = { ngay: number; thang: number; nam: number };

function jdTuDuong(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}

function duongTuJd(jd: number): NgayDuong {
  let a: number, b: number, c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  return { ngay: e - INT((153 * m + 2) / 5) + 1, thang: m + 3 - 12 * INT(m / 10), nam: b * 100 + d - 4800 + INT(m / 10) };
}

/** Ngày (JD, theo múi giờ) của điểm sóc thứ k tính từ 1/1/1900. */
function ngaySoc(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return INT(Jd1 + C1 - deltat + 0.5 + MUI_GIO / 24);
}

/** Kinh độ mặt trời tại 0h ngày jdn (múi giờ), chia thành 12 cung (0..11). */
function cungMatTroi(jdn: number): number {
  const T = (jdn - 2451545.5 - MUI_GIO / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - PI * 2 * INT(L / (PI * 2));
  return INT((L / PI) * 6);
}

/** Điểm sóc của tháng 11 âm lịch năm `yy` (tháng chứa Đông chí). */
function thang11(yy: number): number {
  const off = jdTuDuong(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = ngaySoc(k);
  if (cungMatTroi(nm) >= 9) nm = ngaySoc(k - 1);
  return nm;
}

function doLechThangNhuan(a11: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = cungMatTroi(ngaySoc(k + i));
  do {
    last = arc;
    i++;
    arc = cungMatTroi(ngaySoc(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

/** Dương → âm. */
export function duongSangAm(d: NgayDuong): NgayAm {
  const dayNumber = jdTuDuong(d.ngay, d.thang, d.nam);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = ngaySoc(k + 1);
  if (monthStart > dayNumber) monthStart = ngaySoc(k);
  let a11 = thang11(d.nam);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = d.nam;
    a11 = thang11(d.nam - 1);
  } else {
    lunarYear = d.nam + 1;
    b11 = thang11(d.nam + 1);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = doLechThangNhuan(a11);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { ngay: lunarDay, thang: lunarMonth, nam: lunarYear, nhuan: lunarLeap };
}

/** Âm → dương. Trả `null` khi năm ấy không có tháng nhuận được hỏi. */
export function amSangDuong(a: NgayAm): NgayDuong | null {
  let a11: number, b11: number;
  if (a.thang < 11) {
    a11 = thang11(a.nam - 1);
    b11 = thang11(a.nam);
  } else {
    a11 = thang11(a.nam);
    b11 = thang11(a.nam + 1);
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = a.thang - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = doLechThangNhuan(a11);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (a.nhuan && a.thang !== leapMonth) return null;
    if (a.nhuan || off >= leapOff) off += 1;
  } else if (a.nhuan) {
    return null;
  }
  const monthStart = ngaySoc(k + off);
  return duongTuJd(monthStart + a.ngay - 1);
}

/** Số ngày của một tháng âm (29 hay 30). */
export function soNgayThangAm(thang: number, nam: number, nhuan: boolean): number | null {
  const dau = amSangDuong({ ngay: 1, thang, nam, nhuan });
  if (!dau) return null;
  const jd = jdTuDuong(dau.ngay, dau.thang, dau.nam);
  const sau = duongTuJd(jd + 29);
  return duongSangAm(sau).ngay === 30 ? 30 : 29;
}

export type Gio = { ngay: number; thang: number; nhuan: boolean };

/**
 * Ngày dương KẾ TIẾP của một ngày giỗ, tính từ `homNay` (kể cả hôm nay). Năm âm hiện tại, rồi
 * năm sau. Tháng nhuận không có năm ấy ⇒ lấy tháng thường cùng số; ngày 30 của tháng thiếu ⇒ 29.
 * Đây là phép quy đổi để BÀY — ngày giỗ nhà ghi là gì thì giữ nguyên là thế.
 */
export type GioKeTiep = {
  duong: NgayDuong;
  namAm: number;
  /** Tháng nhuận CÓ năm ấy không — `false` khi nhà ghi "nhuận" mà năm nay không có, lấy tháng thường. */
  nhuan: boolean;
  /** Nhà ghi ngày 30 mà tháng ấy năm nay chỉ 29 — cúng 29. Phải NÓI RA, không lặng lẽ lùi (review 7-5). */
  lui29: boolean;
};

export function gioKeTiep(gio: Gio, homNay: NgayDuong): GioKeTiep {
  const jdNay = jdTuDuong(homNay.ngay, homNay.thang, homNay.nam);
  const amNay = duongSangAm(homNay);
  for (const nam of [amNay.nam, amNay.nam + 1, amNay.nam + 2]) {
    let nhuan = gio.nhuan;
    let d = amSangDuong({ ngay: Math.min(gio.ngay, 30), thang: gio.thang, nam, nhuan });
    if (!d && nhuan) {
      nhuan = false;
      d = amSangDuong({ ngay: Math.min(gio.ngay, 30), thang: gio.thang, nam, nhuan });
    }
    if (!d) continue;
    let lui29 = false;
    if (gio.ngay === 30 && soNgayThangAm(gio.thang, nam, nhuan) === 29) {
      d = amSangDuong({ ngay: 29, thang: gio.thang, nam, nhuan })!;
      lui29 = true;
    }
    if (jdTuDuong(d.ngay, d.thang, d.nam) >= jdNay) return { duong: d, namAm: nam, nhuan, lui29 };
  }
  // Không tới được: ba năm liền không có tháng ấy là dữ liệu hỏng (tháng > 12) — nơi gọi đã kiểm.
  throw new Error(`gioKeTiep: không quy được ngày ${gio.ngay}/${gio.thang}`);
}

/** Số ngày từ a tới b (b − a), theo lịch dương. */
export function soNgayGiua(a: NgayDuong, b: NgayDuong): number {
  return jdTuDuong(b.ngay, b.thang, b.nam) - jdTuDuong(a.ngay, a.thang, a.nam);
}

export function chuoiDuong(d: NgayDuong): string {
  return `${String(d.ngay).padStart(2, '0')}/${String(d.thang).padStart(2, '0')}/${d.nam}`;
}

export function chuoiAm(g: Gio): string {
  return `ngày ${g.ngay} tháng ${g.thang}${g.nhuan ? ' nhuận' : ''} âm lịch`;
}

/**
 * Câu bày MỘT lần giỗ: ngày âm nhà ghi + ngày dương kế tiếp, và nói rõ khi năm nay phải lệch
 * (không có tháng nhuận · tháng thiếu cúng 29). Không bao giờ để cặp âm–dương lệch nhau mà im.
 */
export function cauGio(g: Gio, ke: GioKeTiep): string {
  const ghiChu = [
    g.nhuan && !ke.nhuan ? 'năm nay không có tháng nhuận, lấy tháng thường' : null,
    ke.lui29 ? 'tháng thiếu, cúng ngày 29' : null,
  ].filter((x): x is string => x !== null);
  return `giỗ ${chuoiAm(g)} — sắp tới: ${chuoiDuong(ke.duong)}${ghiChu.length ? ` (${ghiChu.join('; ')})` : ''}`;
}

/** Hôm nay theo giờ Việt Nam — múi cố định, không phụ thuộc máy chủ. */
export function homNayVN(luc: Date = new Date()): NgayDuong {
  const t = new Date(luc.getTime() + MUI_GIO * 3600 * 1000);
  return { ngay: t.getUTCDate(), thang: t.getUTCMonth() + 1, nam: t.getUTCFullYear() };
}

/** Phân tích chuỗi người gõ: "15/8", "15/8 nhuận", "30-12". `null` khi không hiểu. */
export function docGio(chuoi: string): Gio | null {
  // NFC: bàn phím macOS/iOS gõ "nhuận" ở dạng tổ hợp (NFD) — cùng chữ, khác byte (review 7-5).
  const m = chuoi.normalize('NFC').trim().toLowerCase().match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})(\s*(nhuận|nhuan))?$/);
  if (!m) return null;
  const ngay = Number(m[1]);
  const thang = Number(m[2]);
  if (ngay < 1 || ngay > 30 || thang < 1 || thang > 12) return null;
  return { ngay, thang, nhuan: m[3] !== undefined };
}
