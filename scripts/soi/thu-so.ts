/**
 * THU SỐ — những hàm này chạy TRONG trình duyệt qua `page.evaluate`.
 *
 * ⚠ Chúng bị Playwright tuần tự hoá rồi thả vào trang, nên KHÔNG được tham chiếu bất cứ thứ gì
 * ngoài thân hàm: không import, không hằng của module, không hàm anh em. Mọi thứ cần dùng phải
 * nằm gọn bên trong, hoặc đi vào qua tham số. Đây là lý do có vài đoạn lặp lại giữa các hàm —
 * lặp có chủ ý, không phải sót.
 *
 * Chúng chỉ ĐO. Không hàm nào ở đây quyết XANH/ĐỎ — việc ấy của `luat.ts`.
 */
import type { SoCham, SoChu, SoCotPhai, SoDemDay, SoNhanDeTen, SoTran, SoTuongPhan } from './luat';

/** Mọi phần tử có chữ TRỰC TIẾP trong phạm vi. Bản của `soi-hang-cho` — ba script kia bỏ sót. */
export function thuChu(pham: string): SoChu[] {
  const ra: SoChu[] = [];
  const goc = document.querySelector(pham);
  if (!goc) return ra;
  for (const e of goc.querySelectorAll('*')) {
    const coChuTrucTiep = [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
    if (!coChuTrucTiep) continue;
    const px = parseFloat(getComputedStyle(e).fontSize);
    ra.push({
      chon: e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(/\s+/)[0] : ''),
      the: e.tagName.toLowerCase(),
      px: +px.toFixed(2),
      chu: (e.textContent ?? '').trim().slice(0, 60),
    });
  }
  return ra;
}

/**
 * Mọi đích chạm. Tính cả nhãn `<label>` bọc ngoài và `::after` nới vùng chạm ra — hai thứ làm một
 * nút cao 32px thật sự chạm được ở 44px, và bỏ qua chúng thì cổng đỏ oan.
 */
export function thuCham(pham: string): SoCham[] {
  const ra: SoCham[] = [];
  const goc = document.querySelector(pham);
  if (!goc) return ra;
  for (const e of goc.querySelectorAll('button, a, input, summary, [role="button"], [role="radio"], [role="checkbox"]')) {
    const r = e.getBoundingClientRect();
    let cao = r.height;
    let rong = r.width;
    const nhan = e.closest('label');
    if (nhan) {
      const rn = nhan.getBoundingClientRect();
      cao = Math.max(cao, rn.height);
      rong = Math.max(rong, rn.width);
    }
    const sau = getComputedStyle(e, '::after');
    if (sau.content !== 'none') {
      const tren = parseFloat(sau.top) || 0;
      const duoi = parseFloat(sau.bottom) || 0;
      const trai = parseFloat(sau.left) || 0;
      const phai = parseFloat(sau.right) || 0;
      if (tren < 0 || duoi < 0) cao = Math.max(cao, r.height - tren - duoi);
      if (trai < 0 || phai < 0) rong = Math.max(rong, r.width - trai - phai);
    }
    ra.push({
      chon: e.tagName.toLowerCase() + (e.getAttribute('aria-label') ? `[${e.getAttribute('aria-label')}]` : ''),
      cao: +cao.toFixed(1),
      rong: +rong.toFixed(1),
      chu: (e.textContent ?? '').trim().slice(0, 40),
    });
  }
  return ra;
}

/** Thân trang VÀ mọi bộ cuộn con. Vế sau là chỗ lỗi hay nấp — thân trang không bao giờ thấy nó. */
export function thuTran(pham: string): SoTran {
  const boCuon: { ten: string; noiDung: number; hop: number }[] = [];
  const goc = document.querySelector(pham);
  if (goc) {
    for (const e of goc.querySelectorAll('*')) {
      const kt = getComputedStyle(e).overflowX;
      if (kt !== 'auto' && kt !== 'scroll') continue;
      const rong = e.getBoundingClientRect().width;
      if (rong === 0) continue;
      boCuon.push({
        ten: e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(/\s+/)[0] : ''),
        noiDung: e.scrollWidth,
        hop: Math.round(rong),
      });
    }
  }
  return {
    than: document.documentElement.scrollWidth,
    khung: document.documentElement.clientWidth,
    boCuon,
  };
}

/**
 * KHÔNG GÌ ĐƯỢC SƠN ĐÈ LÊN HỌ TÊN — hồi quy Epic 5, dựng lại rộng hơn tên gọi của nó.
 *
 * Ca gốc: `"có người xin nhận"` (152.4px) + `"tâm"` (46.2px) không lọt hàng 190.75px ⇒ xuống dòng
 * hai ⇒ nền đục ⇒ sơn đè lên họ tên. Bốn cổng xanh, `tràn ngang` cũng xanh — không có gì tràn ra
 * NGOÀI hộp cả, hai thứ chỉ chồng lên nhau BÊN TRONG hộp.
 * [Source: review-epic-5-2026-08-25.md:256-259]
 *
 * ⚠ Hàng nhãn nổi ấy đã bị BỎ 26/08 (`components/admin/the-nguoi.tsx:229-236`) — nên nếu phép đo
 * này chỉ tìm đúng ba nhãn cũ thì nó soi ra 0 phần tử và không gác gì hết. Vì thế nó hỏi một câu
 * rộng hơn và sống lâu hơn: **có phần tử NÀO trong thẻ giao vào hình của họ tên không** — kể cả
 * một nhãn mà người sau đặt tên khác.
 *
 * Bỏ qua `sr-only`: chúng bị cắt còn 1px và chồng lên nhau là chuyện đương nhiên, không phải lỗi.
 */
export function thuNhanDeTen(chon: { the: string; ten: string }): SoNhanDeTen[] {
  const hinh = (e: Element) => {
    const r = e.getBoundingClientRect();
    return { trai: +r.left.toFixed(1), tren: +r.top.toFixed(1), phai: +r.right.toFixed(1), duoi: +r.bottom.toFixed(1) };
  };
  const ra: SoNhanDeTen[] = [];
  for (const the of document.querySelectorAll(chon.the)) {
    const ten = the.querySelector(chon.ten);
    if (!ten) continue;
    const hTen = hinh(ten);
    for (const e of the.querySelectorAll('*')) {
      if (e === ten || e.contains(ten) || ten.contains(e)) continue;
      if (e.classList.contains('sr-only')) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      ra.push({ chu: (e.textContent ?? '').trim().slice(0, 40) || `<${e.tagName.toLowerCase()}>`, ten: hTen, nhan: hinh(e) });
    }
  }
  return ra;
}

/**
 * ĐỆM ĐÁY. Đo khoảng còn lại giữa đáy phần tử con CUỐI CÙNG và đáy khối cuộn, rồi so với
 * `padding-bottom` mà CSS khai. Ca gốc Epic 5: khai 34px, đo được 0px.
 */
export function thuDemDay(chonKhoi: string): SoDemDay | null {
  const khoi = document.querySelector(chonKhoi);
  if (!khoi) return null;
  const kt = getComputedStyle(khoi);
  const demKhaiBao = parseFloat(kt.paddingBottom) || 0;
  let dayNoiDung = 0;
  for (const con of khoi.children) {
    const r = con.getBoundingClientRect();
    if (r.height > 0) dayNoiDung = Math.max(dayNoiDung, r.bottom);
  }
  const rKhoi = khoi.getBoundingClientRect();
  // Khối cuộn được: đáy THẬT là `scrollHeight`, không phải đáy nhìn thấy.
  const dayKhoi = rKhoi.top + khoi.scrollHeight;
  return { dayNoiDung: +dayNoiDung.toFixed(1), dayKhoi: +dayKhoi.toFixed(1), demKhaiBao };
}

/**
 * TƯƠNG PHẢN chữ trên nền. Nền lấy bằng cách đi ngược lên tổ tiên tới màu đục đầu tiên — nền
 * trong suốt là chuyện thường và lấy nguyên `rgba(0,0,0,0)` thì mọi tỉ số đều sai.
 */
export function thuTuongPhan(pham: string): SoTuongPhan[] {
  const doc = (s: string): [number, number, number, number] | null => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const sang = (c: [number, number, number, number]) => {
    const f = (v: number) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ra: SoTuongPhan[] = [];
  const goc = document.querySelector(pham);
  if (!goc) return ra;
  for (const e of goc.querySelectorAll('*')) {
    const coChuTrucTiep = [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
    if (!coChuTrucTiep) continue;
    const chu = doc(getComputedStyle(e).color);
    if (!chu) continue;
    let nen: [number, number, number, number] | null = null;
    let t: Element | null = e;
    while (t && !nen) {
      const c = doc(getComputedStyle(t).backgroundColor);
      if (c && c[3] > 0) nen = c;
      t = t.parentElement;
    }
    if (!nen) nen = [255, 255, 255, 1];
    const a = sang(chu);
    const b = sang(nen);
    const ti = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    ra.push({
      chon: e.tagName.toLowerCase(),
      ti: +ti.toFixed(2),
      chu: (e.textContent ?? '').trim().slice(0, 40),
    });
  }
  return ra;
}

/**
 * Mở hết `<details>` bằng thuộc tính, KHÔNG bằng `.click()`.
 *
 * Khác biệt không phải chuyện phong cách: `.click()` trên một `<summary>` nằm trong biểu mẫu có
 * thể kích hoạt handler khác, và bộ đo chạy trên phả thật. Đặt `open = true` chỉ mở khối.
 */
export function moHetDetails(pham: string): number {
  const goc = document.querySelector(pham);
  if (!goc) return 0;
  const ds = goc.querySelectorAll('details');
  for (const d of ds) (d as HTMLDetailsElement).open = true;
  return ds.length;
}

/** Đếm phần tử khớp một chọn tử — dùng cho luật "soi 0 phần tử là cổng đang tắt". */
export function dem(chon: string): number {
  return document.querySelectorAll(chon).length;
}

/**
 * CỘT PHẢI — chiều cao từng nhãn, và mép trên của chồng khẳng định.
 *
 * Bắt nhãn theo `h3` (nhãn trái của một hàng) và chip trong `section button`, nên đo được cả bản
 * cũ lẫn bản mới mà không phải sửa theo từng lượt refactor — giữ nguyên cách của `soi-man.mjs`.
 */
export function thuCotPhai(chonChong: string): SoCotPhai {
  const gayDong: { chu: string; cao: number }[] = [];
  for (const e of document.querySelectorAll('aside h3, aside section button')) {
    const r = e.getBoundingClientRect();
    if (r.height > 46.75) gayDong.push({ chu: (e.textContent ?? '').trim().slice(0, 40), cao: +r.height.toFixed(1) });
  }
  const chong = document.querySelector(chonChong);
  return {
    gayDong,
    chongTren: chong ? +chong.getBoundingClientRect().top.toFixed(1) : null,
    khungCao: window.innerHeight,
  };
}
