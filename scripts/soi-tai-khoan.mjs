/**
 * SOI MÀN TÀI KHOẢN — mở `/admin/tai-khoan` bằng trình duyệt thật và ĐO (story 6-2).
 *
 *   SOI_GOC=http://127.0.0.1:3100 SOI_TEN=<tên> SOI_MK=<mật khẩu> node scripts/soi-tai-khoan.mjs
 *   npm run soi:tai-khoan     # cùng lệnh ấy, có mặt trong package.json
 *
 * ── CHỈ ĐỌC ─────────────────────────────────────────────────────────────────────────────────
 * Script này KHÔNG bấm "Đổi vai", KHÔNG bấm "Gỡ gắn kết". Cả hai ghi vĩnh viễn vào nhật ký của
 * một phả có người thật, và đổi vai còn đổi cả cổng vào của người ấy.
 *
 * ── Là CỔNG, không phải bản báo cáo ─────────────────────────────────────────────────────────
 * Thoát khác 0 khi sàn bị hạ. Bài học story 6-3: script soi đầu tiên chỉ `console.log` mọi số đo
 * và luôn thoát 0, nên gọi nó là "cổng" là một lời khai quá tay — không có cách nào để nó đỏ.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import 'dotenv/config';

/**
 * KHÔNG có mặc định trỏ vào bản thật (sửa 27/08 sau code review).
 *
 * Bản đầu để `SOI_GOC ?? 'http://100.94.148.68:3000'` — tức gọi trần là đăng nhập vào bản đang
 * chạy trên VPN bằng tài khoản quản trị thật, trên một màn có nút GHI, trong khi header của
 * chính file này khai *"không đụng bản VPN"*. Nay bắt khai tường minh, và chặn mọi đích không
 * phải máy này trừ khi người chạy nói rõ `SOI_CHO_PHEP_XA=1`.
 *
 * `SOI_TEN` cũng thôi hardcode một cái tên của dòng họ này (AD-14).
 */
const GOC = process.env.SOI_GOC;
const TEN = process.env.SOI_TEN;
const MK = process.env.SOI_MK;
if (!GOC || !TEN || !MK) {
  console.error(
    'Cần SOI_GOC=<địa chỉ> SOI_TEN=<tên đăng nhập> SOI_MK=<mật khẩu> trong môi trường.\n' +
      'Ví dụ: SOI_GOC=http://127.0.0.1:3100 SOI_TEN=… SOI_MK=… node scripts/soi-tai-khoan.mjs',
  );
  process.exit(1);
}
const laMayNay = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(GOC);
if (!laMayNay && process.env.SOI_CHO_PHEP_XA !== '1') {
  console.error(
    `Từ chối soi \`${GOC}\` — màn này có nút GHI, và đây không phải máy này.\n` +
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
  console.error('Không qua được màn đăng nhập:\n' + (await p.locator('body').innerText()).slice(0, 400));
  process.exit(1);
});

await p.goto(`${GOC}/admin/tai-khoan`, { waitUntil: 'networkidle' });
await p.waitForTimeout(900);

const hang = await p.evaluate(() =>
  [...document.querySelectorAll('main li')].map((e) =>
    (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
  ),
);
console.log('số gắn kết  :', hang.length);
for (const h of hang) console.log('  ·', h);

// Mục "Tài khoản" có mặt trên thanh việc, và đang sáng.
console.log(
  'mục thanh việc:',
  await p.evaluate(() => {
    const a = [...document.querySelectorAll('nav a')].find((x) => x.textContent?.includes('Tài khoản'));
    return a ? `có ✓ ${a.getAttribute('aria-current') === 'page' ? '(đang mở)' : ''}` : '⚠ KHÔNG THẤY';
  }),
);

const nho = await p.evaluate(() => {
  const ra = [];
  for (const e of document.querySelectorAll('main *')) {
    if (!e.textContent?.trim() || e.children.length) continue;
    const px = parseFloat(getComputedStyle(e).fontSize);
    if (px < 15) ra.push({ px: +px.toFixed(2), chu: e.textContent.trim().slice(0, 40) });
  }
  return ra;
});
console.log('chữ < 15px  :', nho.length ? JSON.stringify(nho) : 'không có ✓');

// Vùng chạm THẬT — nhãn bọc radio và `after:` nới vùng bấm không nằm trong hộp thẻ.
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
    if (cao < 44) ra.push({ cao: +cao.toFixed(1), chu: (e.textContent ?? '').trim().slice(0, 28) });
  }
  return ra;
});
console.log('chạm < 44px :', cham.length ? JSON.stringify(cham) : 'không có ✓');

const tran = await p.evaluate(() => ({
  than: document.documentElement.scrollWidth,
  khung: document.documentElement.clientWidth,
}));
const tranNgang = tran.than > tran.khung + 1;
console.log('tràn ngang  :', JSON.stringify(tran), tranNgang ? '⚠ CÓ TRÀN' : '✓ không tràn');
console.log('lỗi console :', loi.length ? loi.slice(0, 5) : 'không có ✓');

await p.screenshot({ path: 'var/soi/tai-khoan.png', fullPage: true });
console.log('ảnh         : var/soi/tai-khoan.png');
await b.close();

const viPham = [
  nho.length ? `${nho.length} chỗ chữ dưới 15px` : null,
  cham.length ? `${cham.length} đích chạm dưới 44px` : null,
  tranNgang ? 'tràn ngang' : null,
  loi.length ? `${loi.length} lỗi console` : null,
  hang.length === 0 ? 'không có gắn kết nào hiện ra' : null,
].filter(Boolean);
if (viPham.length > 0) {
  console.error('\n✗ SÀN BỊ HẠ: ' + viPham.join(' · '));
  process.exit(1);
}
console.log('\n✓ sàn giữ nguyên');
