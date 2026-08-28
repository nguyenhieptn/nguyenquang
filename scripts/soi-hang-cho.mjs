/**
 * SOI HÀNG CHỜ — mở `/admin/hang-cho` bằng trình duyệt thật và ĐO (story 6-8).
 *
 *   SOI_GOC=http://127.0.0.1:3100 SOI_TEN=<tên> SOI_MK=<mật khẩu> node scripts/soi-hang-cho.mjs
 *   npm run soi:hang-cho
 *
 * ── TUYỆT ĐỐI KHÔNG BẤM DUYỆT ───────────────────────────────────────────────────────────────
 * Duyệt là NÂNG MỨC một khẳng định lên Tầng chính thức — một lượt ghi vĩnh viễn vào một kho
 * không có phép xoá (AD-4). Script này chỉ đọc và đo. Đừng thêm một `.click()` nào vào nút
 * *Duyệt* hay *Trả lại*.
 *
 * ── Là CỔNG, không phải bản báo cáo ─────────────────────────────────────────────────────────
 * Thoát khác 0 khi sàn bị hạ, và KHÔNG mặc định trỏ vào bản đang chạy trên VPN — hai bài học
 * của lượt code review 6-3 và 6-2.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import 'dotenv/config';

const GOC = process.env.SOI_GOC;
const TEN = process.env.SOI_TEN;
const MK = process.env.SOI_MK;
if (!GOC || !TEN || !MK) {
  console.error('Cần SOI_GOC=<địa chỉ> SOI_TEN=<tên đăng nhập> SOI_MK=<mật khẩu> trong môi trường.');
  process.exit(1);
}
const laMayNay = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(GOC);
if (!laMayNay && process.env.SOI_CHO_PHEP_XA !== '1') {
  console.error(
    `Từ chối soi \`${GOC}\` — màn này có nút DUYỆT (ghi vĩnh viễn), và đây không phải máy này.\n` +
      'Dựng một bản cục bộ mà soi. Thật sự muốn thì đặt SOI_CHO_PHEP_XA=1.',
  );
  process.exit(1);
}

mkdirSync('var/soi', { recursive: true });
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const loi = [];
p.on('console', (m) => m.type() === 'error' && loi.push(m.text()));
p.on('pageerror', (e) => loi.push(String(e)));

await p.goto(`${GOC}/dang-nhap`, { waitUntil: 'networkidle' });
await p.fill('#ten-dang-nhap', TEN);
await p.fill('#mat-khau', MK);
await p.getByRole('button', { name: 'Vào phả', exact: true }).click();
await p.waitForURL((u) => !u.pathname.includes('dang-nhap'), { timeout: 30000 }).catch(async () => {
  console.error('Không qua được màn đăng nhập:\n' + (await p.locator('body').innerText()).slice(0, 300));
  process.exit(1);
});

await p.goto(`${GOC}/admin/hang-cho`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);

// `[data-nhom]`, KHÔNG phải `main section` (sửa 27/08 sau code review): khu "Đã ẩn theo báo cáo"
// cũng là một `<section>` trong cùng `<main>`, nên con số nhóm lệch 1 ngay khi phả có khẳng định
// bị báo cáo — và một cổng đếm sai thì con số của nó không nghiệm thu được gì.
const nhom = await p.evaluate(() =>
  [...document.querySelectorAll('main [data-nhom]')].map((s) => {
    const ten = s.querySelector('a')?.textContent?.trim() ?? '(không tên)';
    const phu = s.querySelector('p')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const nut = [...s.querySelectorAll('button')]
      .map((b) => b.textContent?.replace(/\s+/g, ' ').trim())
      .filter((t) => t?.startsWith('Duyệt'));
    const dungDo = [...s.querySelectorAll('strong')]
      .map((e) => e.textContent?.trim())
      .filter((t) => t?.includes('cùng khai về'));
    return { ten, phu, nut, dungDo, soDong: s.querySelectorAll('tbody tr').length };
  }),
);
console.log('số nhóm người:', nhom.length);
for (const n of nhom) {
  console.log(`  · ${n.ten} — ${n.soDong} dòng · ${n.phu}`);
  for (const d of n.dungDo) console.log(`      ⚠ đụng độ: ${d}`);
  for (const t of n.nut) console.log(`      nút: ${t}`);
}

/**
 * Cỡ chữ đo trên MỌI phần tử có chữ trực tiếp, không chỉ phần tử không có con (sửa 27/08).
 *
 * Bản đầu bỏ qua mọi node có con — nên khối cảnh báo cụm đụng độ (có `<strong>`, `<em>`) và hai
 * câu chống hiểu nhầm ở đầu màn CHƯA TỪNG được đo lần nào. Đúng khối mà story nói là "chỗ story
 * này thật sự làm việc".
 */
const nho = await p.evaluate(() => {
  const ra = [];
  const coChuTrucTiep = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  for (const e of document.querySelectorAll('main *')) {
    if (!coChuTrucTiep(e)) continue;
    const px = parseFloat(getComputedStyle(e).fontSize);
    if (px < 15) ra.push({ px: +px.toFixed(2), chu: e.textContent.trim().slice(0, 40) });
  }
  return ra;
});
console.log('chữ < 15px  :', nho.length ? JSON.stringify(nho) : 'không có ✓');

const cham = await p.evaluate(() => {
  const ra = [];
  for (const e of document.querySelectorAll('main button, main a, main input, main summary')) {
    const r = e.getBoundingClientRect();
    if (r.height === 0) continue;
    let cao = r.height;
    const nhan = e.closest('label');
    if (nhan) cao = Math.max(cao, nhan.getBoundingClientRect().height);
    const sau = getComputedStyle(e, '::after');
    if (sau.content !== 'none') {
      const t = parseFloat(sau.top) || 0;
      const d = parseFloat(sau.bottom) || 0;
      if (t < 0 || d < 0) cao = Math.max(cao, r.height - t - d);
    }
    // Đo CẢ BỀ NGANG: một link `min-h-11` với nội dung rỗng cao 44 rộng 0 — mắt không thấy,
    // chuột không bấm, và bản đầu chỉ đo chiều cao nên nó qua cổng sạch sẽ.
    const rong = Math.max(r.width, nhan ? nhan.getBoundingClientRect().width : 0);
    if (cao < 44 || rong < 24)
      ra.push({ cao: +cao.toFixed(1), rong: +rong.toFixed(1), chu: (e.textContent ?? '').trim().slice(0, 28) });
  }
  return ra;
});
console.log('chạm < 44px :', cham.length ? JSON.stringify(cham) : 'không có ✓');

// Tràn đo trên CHÍNH bộ cuộn của từng bảng — bài học 6-3: thân trang không bao giờ thấy nó.
const tran = await p.evaluate(() => {
  const ra = [];
  for (const t of document.querySelectorAll('table')) {
    const hop = t.parentElement;
    if (hop && t.scrollWidth > hop.getBoundingClientRect().width + 1)
      ra.push({ bang: t.scrollWidth, hop: Math.round(hop.getBoundingClientRect().width) });
  }
  return {
    than: document.documentElement.scrollWidth,
    khung: document.documentElement.clientWidth,
    bang: ra,
  };
});
const tranNgang = tran.than > tran.khung + 1 || tran.bang.length > 0;
console.log('tràn ngang  :', JSON.stringify(tran), tranNgang ? '⚠ CÓ TRÀN' : '✓ không tràn');
console.log('lỗi console :', loi.length ? loi.slice(0, 5) : 'không có ✓');

// Mở hết `<details>` trước khi chụp và đo: ô lý do trả lại và nút của nó nằm sau một cú bấm,
// nên bản đầu chưa từng đo tới chúng.
await p.evaluate(() => {
  for (const d of document.querySelectorAll('main details')) d.open = true;
});
await p.waitForTimeout(300);
await p.screenshot({ path: 'var/soi/hang-cho.png', fullPage: true });
console.log('ảnh         : var/soi/hang-cho.png');
await b.close();

const viPham = [
  // SÀN DƯỚI: 0 nhóm nghĩa là màn không render gì — trang `forbidden`, trang chưa gắn node, hay
  // một hồi quy. Bản đầu in "0 nhóm" rồi thoát 0, tức cổng xanh trên một màn trắng.
  nhom.length === 0 ? 'không nhóm nào hiện ra (màn trắng, forbidden, hay hồi quy?)' : null,
  nho.length ? `${nho.length} chỗ chữ dưới 15px` : null,
  cham.length ? `${cham.length} đích chạm dưới 44px` : null,
  tranNgang ? 'tràn ngang' : null,
  loi.length ? `${loi.length} lỗi console` : null,
].filter(Boolean);
if (viPham.length > 0) {
  console.error('\n✗ SÀN BỊ HẠ: ' + viPham.join(' · '));
  process.exit(1);
}
console.log('\n✓ sàn giữ nguyên');
