/**
 * SOI MÀN — mở bàn làm việc bằng trình duyệt thật, chụp và ĐO.
 *
 *   node scripts/soi-man.mjs                    # chụp cột phải của người đầu tiên trên cây
 *   node scripts/soi-man.mjs --rong 1280        # đổi bề ngang khung nhìn
 *
 * ── Vì sao script này phải tồn tại ─────────────────────────────────────────────────────────
 * Bốn cổng của repo (`tsc` · `eslint` · `vitest` · `build`) xanh với gần như mọi lỗi giao diện
 * mà hai lượt code review Epic 5 tìm ra. Lượt review thứ hai bắt được hai lỗi nặng nhất của cả
 * đợt CHỈ VÌ nó dựng trình duyệt lên và đo: nhãn sơn đè lên họ tên, và đệm đáy mất trắng 34px.
 *
 * Ảnh chụp ra `var/soi/`. Số đo in ra stdout.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import 'dotenv/config';

const RONG = Number(process.argv[find('--rong')] ?? 1280);
function find(c) {
  const i = process.argv.indexOf(c);
  return i === -1 ? -1 : i + 1;
}

const GOC = process.env.SOI_GOC ?? 'http://100.94.148.68:3000';
const TEN = process.env.SOI_TEN ?? 'nguyen.quang.hiep';
const MK = process.env.SOI_MK;
if (!MK) {
  console.error('Cần SOI_MK=<mật khẩu> trong môi trường. Không đặt mật khẩu vào mã.');
  process.exit(1);
}

mkdirSync('var/soi', { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: RONG, height: 900 } });
const p = await ctx.newPage();

const loi = [];
p.on('console', (m) => m.type() === 'error' && loi.push(m.text()));
p.on('pageerror', (e) => loi.push(String(e)));

await p.goto(`${GOC}/dang-nhap`, { waitUntil: 'networkidle' });
await p.fill('#ten-dang-nhap', TEN);
await p.fill('#mat-khau', MK);
/**
 * Nút gửi tên là **"Vào phả"**; *"Đăng nhập"* và *"Tạo tài khoản"* là hai TAB đổi chế độ
 * (`app/dang-nhap/form-dang-nhap.tsx:180-191`, `:286`). Bấm nhầm tab thì không có lượt gọi
 * `/api/auth` nào và màn đứng yên — đúng thứ chỉ mở trình duyệt mới thấy.
 */
await p.getByRole('button', { name: 'Vào phả', exact: true }).click();
await p.waitForURL((u) => !u.pathname.includes('dang-nhap'), { timeout: 20000 }).catch(async () => {
  const loi = await p.locator('body').innerText();
  console.error('Không qua được màn đăng nhập. Màn đang nói:\n' + loi.slice(0, 400));
  process.exit(1);
});

await p.goto(`${GOC}/admin/cay`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);

// Chọn người đầu tiên trên canvas để cột phải có nội dung.
const the = p.locator('.react-flow__node').first();
if (await the.count()) {
  await the.click();
  await p.waitForTimeout(1500);
}

await p.screenshot({ path: 'var/soi/toan-man.png' });

const cot = p.locator('aside').last();
if (await cot.count()) {
  await cot.screenshot({ path: 'var/soi/cot-phai.png' });
  const h = await cot.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { rong: +r.width.toFixed(1), cao: +r.height.toFixed(1), tranBoc: e.scrollHeight };
  });
  // `+1`: `scrollHeight` là số nguyên còn `getBoundingClientRect().height` thì không —
  // 709.5 vs 710 kêu "có cuộn" ở MỌI lượt chạy, và một cảnh báo luôn bật là một cảnh báo tắt.
  console.log('cột phải  :', JSON.stringify(h), h.tranBoc > h.cao + 1 ? '⚠ CÓ CUỘN' : '✓ không cuộn');
}

// Mọi chữ dưới sàn 15px — luật `EXPERIENCE.md § Accessibility Floor`.
const nho = await p.evaluate(() => {
  const ra = [];
  for (const e of document.querySelectorAll('aside *')) {
    if (!e.textContent?.trim() || e.children.length) continue;
    const px = parseFloat(getComputedStyle(e).fontSize);
    if (px < 15) ra.push({ px: +px.toFixed(2), chu: e.textContent.trim().slice(0, 40) });
  }
  return ra;
});
console.log('chữ < 15px:', nho.length ? JSON.stringify(nho) : 'không có ✓');

// Mọi vùng chạm dưới sàn 44px.
const cham = await p.evaluate(() => {
  const ra = [];
  for (const e of document.querySelectorAll('aside button, aside a, aside summary, aside input')) {
    const r = e.getBoundingClientRect();
    if (r.height > 0 && r.height < 44) ra.push({ cao: +r.height.toFixed(1), chu: (e.textContent ?? '').trim().slice(0, 30) });
  }
  return ra;
});
console.log('chạm < 44px:', cham.length ? JSON.stringify(cham) : 'không có ✓');

// Chữ tràn ra ngoài hộp chứa — nguồn của "nhãn đè lên tên" ở Epic 5.
const tran = await p.evaluate(() => {
  const a = document.querySelector('aside');
  if (!a) return [];
  const ngoai = a.getBoundingClientRect();
  const ra = [];
  for (const e of a.querySelectorAll('*')) {
    const r = e.getBoundingClientRect();
    if (r.width && (r.right > ngoai.right + 1 || r.left < ngoai.left - 1))
      ra.push({ chu: (e.textContent ?? '').trim().slice(0, 30), phai: +(r.right - ngoai.right).toFixed(1) });
  }
  return ra;
});
console.log('tràn ngang:', tran.length ? JSON.stringify(tran) : 'không có ✓');

/**
 * ── ĐO TỪNG TRƯỜNG của phiếu lý lịch ──────────────────────────────────────────────────────
 * Số duy nhất nói được "cột này có gọn không": một trường ăn bao nhiêu pixel chiều dọc, và cả
 * phiếu có nằm lọt một màn 900px không. Bốn cổng của repo không đo được thứ nào trong hai thứ ấy.
 *
 * Bắt theo `h3` — nhãn trái của một hàng — nên đo được cả bản CŨ (hàng là `<section>`) lẫn bản
 * MỚI, không phải sửa script theo từng lượt refactor.
 */
const truong = await p.evaluate(() => {
  const ra = [];
  for (const h of document.querySelectorAll('aside h3')) {
    const hang = h.parentElement;
    if (!hang) continue;
    ra.push({ nhan: h.textContent.trim().slice(0, 14), cao: Math.round(hang.getBoundingClientRect().height) });
  }
  return ra;
});
console.log('mỗi trường:', truong.length ? truong.map((t) => `${t.nhan}=${t.cao}px`).join(' · ') : 'không có hàng nào');
if (truong.length) {
  const tong = truong.reduce((a, t) => a + t.cao, 0);
  console.log('  Σ trường :', tong + 'px', '· trung bình', Math.round(tong / truong.length) + 'px/trường');
}

/**
 * Nhãn hoặc chip GÃY LÀM HAI DÒNG. Không phải lỗi hiển thị — không có gì tràn, không có gì đè —
 * nên bốn cổng im, `tràn ngang` im, và chỉ số chiều cao hàng mới tố: một hàng chip gãy dòng cao
 * 63px thay vì 52px, và cả phiếu phình lên theo số người trong hàng.
 */
const gay = await p.evaluate(() => {
  const ra = [];
  for (const e of document.querySelectorAll('aside h3, aside section button')) {
    const r = e.getBoundingClientRect();
    if (r.height > 50) ra.push({ chu: (e.textContent ?? '').trim().slice(0, 24), cao: Math.round(r.height) });
  }
  return ra;
});
console.log('gãy dòng  :', gay.length ? JSON.stringify(gay) : 'không có ✓');

// Phiếu có lọt một màn 900px không — câu hỏi của chính người dùng.
const phieu = await p.evaluate(() => {
  const s = document.querySelector('aside section[aria-label]');
  if (!s) return null;
  const r = s.getBoundingClientRect();
  return { cao: Math.round(r.height), day: Math.round(r.bottom) };
});
console.log('phiếu     :', JSON.stringify(phieu), phieu && phieu.day > 900 ? '⚠ TRÀN KHỎI MÀN 900px' : '✓ lọt màn 900px');

// Nhãn lặp — "Ghi thêm" ×5 và "chi tiết" ×5 là thứ ồn nhất của bản cũ.
const lap = await p.evaluate(() => {
  const d = {};
  for (const e of document.querySelectorAll('aside button, aside summary, aside a')) {
    const t = (e.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
    if (t) d[t] = (d[t] ?? 0) + 1;
  }
  return Object.entries(d).filter(([, n]) => n > 1);
});
console.log('nhãn lặp  :', lap.length ? JSON.stringify(lap) : 'không có ✓');

/**
 * Mở HẾT `<details>` rồi chụp lần hai: đường tới nguồn, tới "Nâng lên chính thức" và tới
 * "Loại …" nằm sau một cú bấm — ảnh đóng không chứng minh được chúng còn tới được.
 */
await p.evaluate(() => {
  for (const d of document.querySelectorAll('aside details')) d.open = true;
});
await p.waitForTimeout(400);
const cot2 = p.locator('aside').last();
if (await cot2.count()) await cot2.screenshot({ path: 'var/soi/cot-phai-mo.png' });
const nut = await p.evaluate(() =>
  [...document.querySelectorAll('aside button')].map((b) => (b.textContent ?? '').trim().slice(0, 28)).filter(Boolean),
);
console.log('nút khi mở:', JSON.stringify(nut));

console.log('lỗi console:', loi.length ? loi : 'không có ✓');
console.log('ảnh       : var/soi/toan-man.png · var/soi/cot-phai.png · var/soi/cot-phai-mo.png');
await b.close();
