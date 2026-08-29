/**
 * LUẬT ĐO — hàm THUẦN. Không `import` trình duyệt, không chạm mạng, không đọc tệp.
 *
 * ── Vì sao luật nằm ở đây chứ không trong `page.evaluate` ────────────────────────────────────
 * Bốn script `soi-*.mjs` của Epic 5–6 nhét cả phép đo lẫn phép xử vào thân `evaluate`. Hệ quả đo
 * được: KHÔNG bài test nào chạm tới chúng, nên bốn cài đặt của cùng một luật trôi xa nhau —
 * `soi-hang-cho` đo bề ngang đích chạm, ba script kia chỉ đo chiều cao; `soi-hang-cho` đếm chữ
 * trên phần tử có con, ba script kia bỏ qua. Mỗi chỗ lệch là một con bug đang ngủ.
 *
 * Nay: trình duyệt chỉ **thu số**, hàm ở đây **quyết XANH/ĐỎ**, và mọi ngưỡng khai đúng một lần.
 *
 * Nguồn của các con số: `EXPERIENCE.md § Accessibility Floor` (dòng 387-397) và
 * `DESIGN.md § Typography` (dòng 40-44, 188-193, 224).
 */

/** Sàn đã cam kết. Đổi ở đây là đổi cam kết — phải đổi cả `EXPERIENCE.md`. */
export const SAN = {
  /** Mọi chữ, không ngoại lệ. `EXPERIENCE.md:392` */
  chuTuyetDoi: 15,
  /** Chữ thân. `DESIGN.md:40`, `EXPERIENCE.md:391` */
  chuThan: 17,
  /** Vùng chạm, CẢ chiều cao lẫn bề ngang. `DESIGN.md:224` */
  cham: 44,
  /** Tương phản chữ, kể cả node tồn nghi. `EXPERIENCE.md:394` */
  tuongPhan: 4.5,
} as const;

/**
 * Sai số cho phép khi so bề rộng: `scrollWidth` là số NGUYÊN còn `getBoundingClientRect().width`
 * thì không. Không có nó thì 709.5 vs 710 kêu "có tràn" ở mọi lượt chạy — và một cảnh báo luôn
 * bật là một cảnh báo đã tắt. (Bài học ghi sẵn ở `soi-man.mjs:76`.)
 */
const SAI_SO = 1;

export type ViPham = {
  loai: string;
  moTa: string;
  /** `true` khi bộ đo chỉ nêu nghi vấn — người phải nhìn rồi quyết, cổng KHÔNG đỏ vì nó. */
  canMatNguoi?: boolean;
};

export type HinhChuNhat = { trai: number; tren: number; phai: number; duoi: number };

export type SoChu = { chon: string; the: string; px: number; chu: string };
export type SoCham = { chon: string; cao: number; rong: number; chu: string };
export type SoTran = { than: number; khung: number; boCuon: { ten: string; noiDung: number; hop: number }[] };
export type SoNhanDeTen = { chu: string; ten: HinhChuNhat; nhan: HinhChuNhat };
export type SoDemDay = { dayNoiDung: number; dayKhoi: number; demKhaiBao: number };
export type SoTuongPhan = { chon: string; ti: number; chu: string };
export type SoCotPhai = {
  /** Nhãn hoặc chip cao hơn một dòng — tức đã xuống dòng. */
  gayDong: { chu: string; cao: number }[];
  /** Mép trên của chồng khẳng định, `null` khi không tìm thấy chồng. */
  chongTren: number | null;
  khungCao: number;
};

/**
 * THANG CỠ CHỮ đã chốt — `DESIGN.md § typography` (dòng 37-56) có đúng ba nấc:
 * **15px** (caption · nhãn phụ · chip · tooltip) · **17px** (thân · tên người) · **23px**
 * (display · Hán-Nôm).
 *
 * ── Vì sao KHÔNG đoán "chữ thân" theo thẻ ────────────────────────────────────────────────────
 * Bản đầu của luật này coi mọi `<p>`/`<li>`/`<td>` là chữ thân, nên 15px trong `<p>` là vi phạm
 * sàn 17px. Lượt chạy THẬT đầu tiên trả về **11 vi phạm, cả 11 đều giả**: `<p>` "Nguyễn Quang
 * Hiệp ghi · 2 ngày trước", `<p>` "Gõ tên để xem người ấy đã có trong phả chưa" — caption và
 * chú thích, 15px đúng theo thiết kế, nằm trong `<p>` như mọi caption vẫn nằm.
 *
 * Một cổng đỏ oan mười một lần ở màn ĐẦU TIÊN thì không ai chạy nó lần thứ hai. Thẻ không nói
 * được vai trò của chữ; thang cỡ thì nói được, và nó là thứ tài liệu thật sự chốt.
 */
export const THANG_CO_CHU = [15, 17, 23] as const;

function trim40(s: string): string {
  const g = s.replace(/\s+/g, ' ').trim();
  return g.length > 40 ? g.slice(0, 40) + '…' : g;
}

/**
 * Sàn chữ.
 *
 * `< 15px` là ĐỎ, không ngoại lệ — `DESIGN.md:190-192` nói thẳng: *"áp cho mọi chữ, kể cả caption,
 * nhãn phụ, chú thích ảnh, chữ trong chip, chữ trong tooltip"*. Đây là câu máy kiểm được.
 *
 * Cỡ nằm giữa 15 và 17 mà KHÔNG phải một nấc của thang thì NÊU RA chứ không hạ cổng: nó có thể là
 * một caption cố ý ở cỡ lạ, mà cũng có thể là `text-sm` lọt lưới. Máy không phân biệt được vai trò
 * của một câu chữ; người thì được.
 *
 * Cái bẫy cần bắt: gốc `rem` của dự án là **17px** (`app/globals.css:187`), nên `text-sm` ra
 * **14.875px** — hụt sàn tuyệt đối đúng 0.125px trong khi trông như đúng chuẩn. Nó rơi vào nhánh
 * ĐỎ ở trên, và rơi vì SỐ ĐO thật chứ không vì tên lớp.
 */
export function luatSanChu(ds: SoChu[]): ViPham[] {
  const ra: ViPham[] = [];
  for (const c of ds) {
    if (c.px < SAN.chuTuyetDoi) {
      ra.push({
        loai: 'chu-duoi-san',
        moTa: `${c.px}px < ${SAN.chuTuyetDoi}px tuyệt đối — ${c.chon} · "${trim40(c.chu)}"`,
      });
      continue;
    }
    if (c.px >= SAN.chuThan) continue;
    if ((THANG_CO_CHU as readonly number[]).includes(c.px)) continue;
    ra.push({
      loai: 'co-chu-ngoai-thang',
      moTa: `${c.px}px không có trong thang ${THANG_CO_CHU.join('/')}px — <${c.the}> · "${trim40(c.chu)}"`,
      canMatNguoi: true,
    });
  }
  return ra;
}

/** Sàn chạm — đo CẢ chiều cao lẫn bề ngang. Cao 44 rộng 20 thì mắt không thấy, chuột không bấm. */
export function luatSanCham(ds: SoCham[]): ViPham[] {
  const ra: ViPham[] = [];
  for (const c of ds) {
    // Cao 0 nghĩa là đang ẩn — không phải đích chạm hụt sàn.
    if (c.cao === 0) continue;
    if (c.cao < SAN.cham || c.rong < SAN.cham) {
      ra.push({
        loai: 'cham-duoi-san',
        moTa: `${c.cao}×${c.rong}px < ${SAN.cham}×${SAN.cham} — ${c.chon} · "${trim40(c.chu)}"`,
      });
    }
  }
  return ra;
}

/** Tràn ngang — thân trang VÀ mọi bộ cuộn con. Bỏ sót vế sau là bỏ sót đúng chỗ lỗi hay nấp. */
export function luatTranNgang(s: SoTran): ViPham[] {
  const ra: ViPham[] = [];
  if (s.than > s.khung + SAI_SO) {
    ra.push({ loai: 'tran-than-trang', moTa: `thân trang rộng ${s.than}px trong khung ${s.khung}px` });
  }
  for (const b of s.boCuon) {
    if (b.noiDung > b.hop + SAI_SO) {
      ra.push({ loai: 'tran-bo-cuon', moTa: `${b.ten}: nội dung ${b.noiDung}px trong hộp ${b.hop}px` });
    }
  }
  return ra;
}

/** Hai hình chữ nhật có phần chung thật sự. Chạm mép nhau KHÔNG tính. */
export function giaoNhau(a: HinhChuNhat, b: HinhChuNhat): boolean {
  return a.trai < b.phai && b.trai < a.phai && a.tren < b.duoi && b.tren < a.duoi;
}

/**
 * NHÃN ĐÈ TÊN — hồi quy Epic 5.
 *
 * Ca gốc: `"có người xin nhận"` (152.4px) + `"tâm"` (46.2px) không lọt hàng 190.75px ⇒ xuống dòng
 * hai ⇒ nền đục ⇒ sơn đè lên họ tên. Bốn cổng xanh, `tràn ngang` cũng xanh — không có gì tràn ra
 * ngoài hộp cả, hai thứ chỉ chồng lên nhau BÊN TRONG hộp.
 * [Source: review-epic-5-2026-08-25.md:256-259]
 */
export function luatNhanDeTen(ds: SoNhanDeTen[]): ViPham[] {
  return ds
    .filter((d) => giaoNhau(d.ten, d.nhan))
    .map((d) => ({
      loai: 'nhan-de-ten',
      moTa: `nhãn "${trim40(d.chu)}" đè lên họ tên (tên ${d.ten.tren}–${d.ten.duoi}, nhãn ${d.nhan.tren}–${d.nhan.duoi})`,
    }));
}

/**
 * ĐỆM ĐÁY — hồi quy Epic 5.
 *
 * Ca gốc: `min-h-full` là `min-height` tường minh, nên nó THAY `min-height:auto` của flex item;
 * khối co về đúng chiều cao khung nhìn, nội dung tràn ra ngoài, và `py-8` (34px) dính ở đáy KHỐI
 * tức là nằm trên phần tràn. Đo được: đệm đáy thật **0px** ở cả ba độ dài nội dung.
 * [Source: review-epic-5-2026-08-25.md:259-260]
 */
export function luatDemDay(s: SoDemDay): ViPham[] {
  const con = s.dayKhoi - s.dayNoiDung;
  if (con + SAI_SO < s.demKhaiBao) {
    return [
      {
        loai: 'mat-dem-day',
        moTa: `đệm đáy còn ${con.toFixed(1)}px, khai báo ${s.demKhaiBao}px`,
      },
    ];
  }
  return [];
}

/** Tương phản ≥ 4.5:1 — **kể cả node tồn nghi**, chỗ dễ sai nhất. */
export function luatTuongPhan(ds: SoTuongPhan[]): ViPham[] {
  return ds
    .filter((d) => d.ti < SAN.tuongPhan)
    .map((d) => ({
      loai: 'tuong-phan-thap',
      moTa: `${d.ti.toFixed(2)}:1 < ${SAN.tuongPhan}:1 — ${d.chon} · "${trim40(d.chu)}"`,
    }));
}

/**
 * Một cổng soi 0 phần tử là một cổng đang TẮT.
 *
 * `core/gates/rls.gate.test.ts` ghi sẵn bài học này bằng máu: chú thích cũ khẳng định gate bắt
 * được một chuyện mà nó không bắt được, vì nó chỉ đếm `policies >= 1`. Bộ đo dễ mắc đúng lỗi ấy —
 * XANH vì không tìm thấy phần tử nào, chứ không vì màn đúng. `soi-hang-cho.mjs:151` đã dựng hàng
 * rào này cho riêng nó; nay là luật chung.
 */
export function luatSoiRong(ten: string, soPhanTu: number): ViPham[] {
  if (soPhanTu > 0) return [];
  return [
    {
      loai: 'soi-rong',
      moTa: `soi 0 ${ten} — màn trắng, chặn quyền, hay một hồi quy? Cổng không được XANH vì không tìm thấy gì.`,
    },
  ];
}

export function luatLoiConsole(ds: string[]): ViPham[] {
  return ds.slice(0, 5).map((l) => ({ loai: 'loi-console', moTa: trim40(l) }));
}

/**
 * Máy này, không phải máy nào khác.
 *
 * `startsWith('http://localhost')` là cái bẫy: `http://localhost.ke-gian.vn` cũng khớp. Neo vào
 * đúng `hostname` sau khi phân giải URL.
 *
 * ── "Máy này" KHÔNG chỉ là loopback (sửa 28/08/2026) ────────────────────────────────────────
 * Bản đầu chỉ nhận `127.0.0.1`/`localhost`, và nó sai với chính cách dự án này chạy: chủ dự án
 * làm việc **từ một máy khác qua Tailscale**, nên mọi server phải bind vào IP Tailscale
 * (`npm run dev:vpn`, `npm run start:vpn`). Bind vào loopback thì không ai ngoài máy chạy vào
 * được — và hàng rào cũ từ chối luôn IP Tailscale của **chính máy đang chạy bộ đo**.
 *
 * Ý định của hàng rào là "đừng lái một máy KHÁC", không phải "chỉ loopback". Nên `diaChiMay` nhận
 * mọi địa chỉ đang gắn trên máy; nơi gọi lấy danh sách ấy từ `os.networkInterfaces()`, và hàm này
 * vẫn thuần.
 */
export function laMayNay(goc: string, diaChiMay: readonly string[] = []): boolean {
  try {
    const h = new URL(goc).hostname.replace(/^\[|\]$/g, '');
    if (h === '127.0.0.1' || h === 'localhost' || h === '::1') return true;
    return diaChiMay.includes(h);
  } catch {
    return false;
  }
}

/**
 * Hàng rào máy xa. Bộ đo mở màn có nút GHI trên một kho không có phép xoá (AD-4), và một agent
 * đã từng nâng nhầm 40 khẳng định. Muốn soi một máy KHÁC thì phải nói ra chủ đích.
 */
export function canHangRaoXa(
  goc: string,
  choPhep: string | undefined,
  diaChiMay: readonly string[] = [],
): ViPham | null {
  if (laMayNay(goc, diaChiMay) || choPhep === '1') return null;
  return {
    loai: 'may-xa',
    moTa:
      `Từ chối soi \`${goc}\` — các màn này có nút GHI (vĩnh viễn, AD-4) và đây không phải máy này.\n` +
      'Dựng một bản trên chính máy này mà soi. Thật sự muốn thì đặt SOI_CHO_PHEP_XA=1.',
  };
}

/** Vi phạm nào làm cổng ĐỎ — mục `canMatNguoi` chỉ để người đọc, không hạ cổng. */
export function chiCaiLamDo(ds: ViPham[]): ViPham[] {
  return ds.filter((v) => !v.canMatNguoi);
}

/**
 * CỘT PHẢI của bàn làm việc — hai phép đo giữ lại từ `soi-man.mjs`, mỗi phép trả một mục nợ.
 *
 * 1. **Chồng khẳng định bị đẩy khỏi tầm nhìn** — AC 18 của story 6-7, mục "CHƯA kiểm được" số 1
 *    và là *"thứ đáng nhìn đầu tiên"*. Khối tóm tắt cộng ba hàng chip nằm TRÊN chồng; nếu chúng
 *    đẩy mép trên của chồng xuống dưới đáy khung nhìn thì người mở cột phải ra không thấy gì
 *    ngoài tiểu sử. Đây là ĐỎ thật, không phải chuyện thẩm mỹ.
 *
 * 2. **Nhãn gãy dòng** — mục nợ số 2 của 6-7 (*"dòng tóm tắt có xuống dòng xấu khi tên chi dài
 *    không"*). Không có gì tràn, không có gì đè, nên `tràn ngang` im và bốn cổng cũng im; chỉ
 *    chiều cao hàng mới tố. Nhưng hai dòng KHÔNG phải lúc nào cũng sai — một tên chi dài thì
 *    xuống dòng là đúng. Nên nó NÊU RA cho người nhìn, không tự hạ cổng.
 *
 * Ngưỡng 46.75px = `min-h-11` ở gốc chữ 17px. Ngưỡng cũ 50px để lọt hai dòng chữ 15px (~40px),
 * nên cổng in "không có ✓" trong khi nhãn đã gãy — đúng ca `Giới tính` cạnh dấu ⚠.
 */
export const CAO_MOT_DONG = 46.75;

export function luatCotPhai(s: SoCotPhai): ViPham[] {
  const ra: ViPham[] = [];
  if (s.chongTren !== null && s.chongTren >= s.khungCao) {
    ra.push({
      loai: 'chong-bi-day-khoi-tam-nhin',
      moTa: `chồng khẳng định bắt đầu ở ${s.chongTren.toFixed(0)}px, dưới đáy khung nhìn ${s.khungCao}px — mở cột phải ra không thấy khẳng định nào (6-7 AC 18)`,
    });
  }
  for (const g of s.gayDong) {
    ra.push({
      loai: 'nhan-gay-dong',
      moTa: `"${trim40(g.chu)}" cao ${g.cao.toFixed(0)}px > ${CAO_MOT_DONG}px — đã xuống dòng. Tên chi dài thì đúng, nhãn cố định thì sai.`,
      canMatNguoi: true,
    });
  }
  return ra;
}
