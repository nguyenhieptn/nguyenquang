/**
 * SOI MÀN NẠP KHUNG — mở `/admin/nap-khung` bằng trình duyệt thật, nạp một tệp năm ca, và ĐO.
 *
 *   SOI_MK=<mật khẩu> node scripts/soi-nap-khung.mjs
 *   SOI_GOC=http://127.0.0.1:3100 SOI_MK=… node scripts/soi-nap-khung.mjs
 *
 * ── KHÔNG BAO GIỜ BẤM "GHI" ────────────────────────────────────────────────────────────────
 * Script này chỉ đi tới bước XEM TRƯỚC. `previewSeed` không ghi một dòng nào, nên chạy nó trên
 * phả thật là an toàn tuyệt đối; `commitSeed` thì ghi vĩnh viễn vào một kho không có phép xoá
 * (AD-4). Không thêm một cú bấm nào vào nút *Ghi … dòng vào phả*.
 *
 * ── Vì sao có script riêng, không dùng `soi-man.mjs` ────────────────────────────────────────
 * `soi-man.mjs` đo cột phải (`aside`) của màn Cây gia phả. Màn Nạp khung không có `aside`; thứ
 * phải đo ở đây là BẢNG xem trước và các khối cảnh báo chèn trong dòng. Cùng một luật đo, khác
 * chỗ đo — nên tách file thay vì nhồi hai màn vào một script.
 *
 * Ảnh chụp ra `var/soi/`. Số đo in ra stdout.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import 'dotenv/config';

const GOC = process.env.SOI_GOC ?? 'http://100.94.148.68:3000';
const TEN = process.env.SOI_TEN ?? 'nguyen.quang.hiep';
const MK = process.env.SOI_MK;
if (!MK) {
  console.error('Cần SOI_MK=<mật khẩu> trong môi trường. Không đặt mật khẩu vào mã.');
  process.exit(1);
}

/**
 * Năm ca của story 6-3, trong một tệp tự đủ — không mượn tên nào của phả thật, nên cảnh báo
 * đọc được không phụ thuộc vào dữ liệu đang có.
 *   dòng 2,3  hai người trùng tên  ⇒ nghi trùng (duplicate-in-file)
 *   dòng 4    con của họ            ⇒ father-ambiguous, và HẾT khi bỏ một trong hai
 *   dòng 5    cha duy nhất
 *   dòng 6    con của cha ấy        ⇒ father-not-found khi bỏ dòng 5
 *   dòng 7,8  vợ mơ hồ + chồng     ⇒ spouse-ambiguous
 *   dòng 9    chồng có vợ vắng      ⇒ spouse-not-found
 */
const GHI_CHU_DAI =
  'Cụ có công mở ấp, dựng đình làng năm Bính Tuất, con cháu bốn đời sau vẫn giỗ vào rằm tháng bảy — chép theo lời cụ Bảng kể lại năm 1998';

const CSV = [
  'ho_ten,gioi_tinh,nam_sinh,nam_mat,ten_cha,ten_vo_chong,chi,ghi_chu',
  `Soi Cha Hai Bản,nam,1940,,,,Chi Nhất,"${GHI_CHU_DAI}"`,
  'Soi Cha Hai Bản,nam,1958,,,,Chi Ba,',
  'Soi Con Của Hai Bản,nam,1980,,Soi Cha Hai Bản,,,',
  'Soi Cha Duy Nhất,nam,1900,,,,,',
  'Soi Con Của Cha Duy Nhất,nam,1935,,Soi Cha Duy Nhất,,,',
  'Soi Vợ Mơ Hồ,nu,1940,,,,,',
  'Soi Vợ Mơ Hồ,nu,1958,,,,,',
  'Soi Chồng Của Vợ Mơ Hồ,nam,1938,,,Soi Vợ Mơ Hồ,,',
  'Soi Chồng Có Vợ Vắng,nam,1930,,,Soi Vợ Không Ai Biết,,',
  '',
].join('\n');

mkdirSync('var/soi', { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();

const loi = [];
p.on('console', (m) => m.type() === 'error' && loi.push(m.text()));
p.on('pageerror', (e) => loi.push(String(e)));

await p.goto(`${GOC}/dang-nhap`, { waitUntil: 'networkidle' });
await p.fill('#ten-dang-nhap', TEN);
await p.fill('#mat-khau', MK);
// "Vào phả" là nút gửi; "Đăng nhập" chỉ là một TAB đổi chế độ.
await p.getByRole('button', { name: 'Vào phả', exact: true }).click();
await p.waitForURL((u) => !u.pathname.includes('dang-nhap'), { timeout: 30000 }).catch(async () => {
  console.error('Không qua được màn đăng nhập:\n' + (await p.locator('body').innerText()).slice(0, 400));
  process.exit(1);
});

await p.goto(`${GOC}/admin/nap-khung`, { waitUntil: 'networkidle' });
await p.setInputFiles('input[name="tep"]', {
  name: 'soi-nam-ca.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from('\uFEFF' + CSV, 'utf8'),
});
await p.getByRole('button', { name: 'Xem trước so khớp' }).click();
await p.getByRole('button', { name: /^Ghi \d+ dòng vào phả$/ }).waitFor({ timeout: 30000 });
await p.waitForTimeout(600);

/** Đọc mọi tiêu đề cảnh báo đang bày, kèm số dòng của hàng nó thuộc về. */
const doCanhBao = () =>
  p.evaluate(() =>
    [...document.querySelectorAll('p.font-semibold.text-destructive')]
      .map((e) => (e.textContent ?? '').trim())
      .filter(Boolean),
  );

const chip = () =>
  p.evaluate(() => {
    const n = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').startsWith('Cần xem lại'),
    );
    return n ? n.textContent.trim().replace(/\s+/g, ' ') : null;
  });

console.log('── lượt đầu — cảnh báo theo bộ MẶC ĐỊNH của màn ─────────────────────');
console.log('cảnh báo  :', JSON.stringify(await doCanhBao()));
console.log('chip      :', await chip());
await p.screenshot({ path: 'var/soi/nap-khung-mu.png', fullPage: true });

// ── Đo sàn, trên chính lượt bày cảnh báo ─────────────────────────────────────
const nho = await p.evaluate(() => {
  const ra = [];
  for (const e of document.querySelectorAll('main *')) {
    if (!e.textContent?.trim() || e.children.length) continue;
    const px = parseFloat(getComputedStyle(e).fontSize);
    if (px < 15) ra.push({ px: +px.toFixed(2), chu: e.textContent.trim().slice(0, 40) });
  }
  return ra;
});
console.log('chữ < 15px:', nho.length ? JSON.stringify(nho) : 'không có ✓');

/**
 * Vùng chạm THẬT, không phải hộp của thẻ.
 *
 * Đo trần `getBoundingClientRect()` cho ra 13 báo động giả ở màn này: ô tích 20px nới vùng chạm
 * bằng `after:-inset-y-3` (giả lập, không nằm trong hộp thẻ), còn nút radio 20px thì nằm trong
 * một `<label class="min-h-11">` — cả hai đều đủ 44px với ngón tay thật. Một cảnh báo luôn bật
 * là một cảnh báo đã tắt, nên phép đo phải tính cả hai lối nới ấy.
 */
const cham = await p.evaluate(() => {
  const ra = [];
  for (const e of document.querySelectorAll('main button, main a, main summary, main input')) {
    const r = e.getBoundingClientRect();
    if (r.height === 0) continue;
    let cao = r.height;
    const nhan = e.closest('label');
    if (nhan) cao = Math.max(cao, nhan.getBoundingClientRect().height);
    const sau = getComputedStyle(e, '::after');
    if (sau.content !== 'none') {
      const tren = parseFloat(sau.top) || 0;
      const duoi = parseFloat(sau.bottom) || 0;
      if (tren < 0 || duoi < 0) cao = Math.max(cao, r.height - tren - duoi);
    }
    if (cao < 44)
      ra.push({ cao: +cao.toFixed(1), the: e.tagName, chu: (e.textContent ?? '').trim().slice(0, 30) });
  }
  return ra;
});
console.log('chạm < 44px:', cham.length ? JSON.stringify(cham) : 'không có ✓');

/**
 * Đo tràn ở ĐÚNG chỗ nó xảy ra (sửa 27/08 sau code review).
 *
 * Bản đầu đọc `documentElement.scrollWidth`, trong khi `components/ui/table.tsx` bọc bảng trong
 * một `div.overflow-x-auto` riêng — tràn nằm trong bộ cuộn nội bộ và KHÔNG BAO GIỜ chạm tới thân
 * trang. Nên chính phép đo đã tìm ra lỗi `whitespace-nowrap` (bảng rộng 1886 trong hộp 972) lại
 * không có mặt trong cổng được chốt: gỡ bản vá ra thì cả năm cổng vẫn xanh.
 */
const tran = await p.evaluate(() => {
  const bang = document.querySelector('table');
  const hop = bang?.parentElement;
  return {
    than: document.documentElement.scrollWidth,
    khung: document.documentElement.clientWidth,
    bang: bang ? bang.scrollWidth : 0,
    hopBang: hop ? Math.round(hop.getBoundingClientRect().width) : 0,
  };
});
const tranThan = tran.than > tran.khung + 1;
const tranBang = tran.bang > tran.hopBang + 1;
console.log('tràn ngang:', JSON.stringify(tran), tranThan || tranBang ? '⚠ CÓ TRÀN' : '✓ không tràn');

// ── Đổi quyết định: bỏ một trong hai dòng trùng tên, và bỏ dòng cha duy nhất ──
console.log('\n── sau khi ĐỂ LẠI hai dòng (cha thừa + cha duy nhất) ────────────────');
// Dòng 3 (bản thứ hai của "Soi Cha Hai Bản") là dòng nghi trùng ⇒ chọn bằng radio.
await p.getByRole('radio', { name: /Để lại dòng này/ }).nth(1).click();
await p.waitForTimeout(900);
// "Soi Cha Duy Nhất" không nghi trùng ⇒ bỏ tích ở đầu dòng.
await p.getByRole('checkbox', { name: 'Chọn dòng 5' }).click();
await p.waitForTimeout(1200);

console.log('cảnh báo  :', JSON.stringify(await doCanhBao()));
console.log('chip      :', await chip());
await p.screenshot({ path: 'var/soi/nap-khung-sau-quyet-dinh.png', fullPage: true });

console.log('\nlỗi console:', loi.length ? loi : 'không có ✓');
console.log('ảnh       : var/soi/nap-khung-mu.png · var/soi/nap-khung-sau-quyet-dinh.png');
await b.close();

/**
 * CỔNG, không phải bản báo cáo (sửa 27/08 sau code review).
 *
 * Bản đầu chỉ `console.log` mọi số đo và luôn thoát 0 — nên gọi nó là *"cổng thứ năm"* là một
 * lời khai quá tay: không có cách nào để nó ĐỎ. Nay vi phạm sàn thì thoát khác 0.
 */
const viPham = [
  nho.length ? `${nho.length} chỗ chữ dưới 15px` : null,
  cham.length ? `${cham.length} đích chạm dưới 44px` : null,
  tranThan || tranBang ? 'tràn ngang' : null,
  loi.length ? `${loi.length} lỗi console` : null,
].filter(Boolean);
if (viPham.length > 0) {
  console.error('\n✗ SÀN BỊ HẠ: ' + viPham.join(' · '));
  process.exit(1);
}
console.log('\n✓ sàn giữ nguyên');
