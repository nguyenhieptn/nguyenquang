/**
 * TRÌNH DUYỆT — bốn việc mà bốn script cũ mỗi script tự chép một bản.
 *
 * Mở · đăng nhập · bắt lỗi console · chụp. Gom vào đây không phải để đỡ gõ, mà vì bốn bản chép
 * tay đã trôi xa nhau: hai bản chờ 20 giây rồi bỏ, hai bản chờ 30; hai bản chụp `fullPage`, hai
 * bản không; và bản của `soi-man` không kiểm nổi mình có qua được màn đăng nhập hay không.
 */
import { mkdirSync } from 'node:fs';
import { chromium, type Browser, type Page } from 'playwright';

export const THU_MUC_ANH = 'var/soi';

export type Phien = {
  b: Browser;
  p: Page;
  /** Lỗi console và `pageerror` gom lại theo thứ tự xuất hiện. */
  loi: string[];
  dongLai: () => Promise<void>;
};

/**
 * Mở một trình duyệt, CHƯA đăng nhập.
 *
 * `rong` là tham số BẮT BUỘC, không có mặc định: cả bốn script đời trước cứng 1280px và đó chính
 * là lý do mười bảy màn của bề mặt A — vốn thiết kế cho màn 390px — chưa từng được đo lần nào.
 */
export async function moTrinhDuyet(goc: string, rong: number, cao = 900): Promise<Phien> {
  mkdirSync(THU_MUC_ANH, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: rong, height: cao } });

  /**
   * ── `__name` shim — KHÔNG phải mẹo, là điều kiện để `page.evaluate` chạy được ────────────────
   *
   * Bộ đo chạy bằng `tsx`, tức esbuild, và esbuild bật `keepNames`: mọi hàm có tên bị bọc thành
   * `__name(fn, "fn")` để giữ `fn.name` sau khi minify. Playwright thì tuần tự hoá hàm bằng
   * `fn.toString()` rồi `eval` trong TRANG — nơi `__name` không tồn tại. Kết quả: mọi phép thu số
   * chết bằng `ReferenceError: __name is not defined`, ngay ở phép đo đầu tiên.
   *
   * `tsc` xanh, `eslint` xanh, `npm test` xanh — vì không cổng nào trong ba cổng ấy chạy một hàm
   * bên trong một trình duyệt. Đúng lớp lỗi story này tồn tại để bắt, và nó bắt được chính mình ở
   * lượt chạy thật ĐẦU TIÊN.
   *
   * Truyền bằng CHUỖI, không bằng hàm: một hàm truyền vào đây cũng đi qua đúng đường tuần tự hoá
   * ấy, nên nó sẽ cần chính cái shim mà nó đang định cài.
   */
  await ctx.addInitScript({ content: 'globalThis.__name = globalThis.__name || ((f) => f);' });

  /**
   * ── Một cookie giả, đặt CÓ CHỦ Ý trước khi đăng nhập ────────────────────────────────────────
   *
   * Better Auth chỉ kiểm origin khi request **có cookie**
   * (`better-auth/dist/api/middlewares/origin-check.mjs`: `if (!(forceValidate || useCookies))
   * return;`). Một phiên trình duyệt sạch vì thế đi vòng qua phép kiểm ấy — và bộ đo, vốn luôn mở
   * phiên sạch, **cấu trúc không thấy được** cả một lớp lỗi.
   *
   * Nó đã cắn thật, 28/08/2026: bộ đo đăng nhập trơn tru ở `:3100` và báo 27 màn xanh, trong khi
   * chủ dự án mở đúng địa chỉ ấy thì nhận `403 INVALID_ORIGIN` liên tiếp — vì trình duyệt của anh
   * mang sẵn cookie của `:3000`, và cookie KHÔNG phân biệt cổng.
   *
   * Nên từ đây lượt đăng nhập của bộ đo mang theo một cookie vô hại, để nó đi đúng con đường
   * người thật đi. Một cổng chỉ thử được đường dễ nhất thì nó đang gác nửa cánh cửa.
   */
  await ctx.addCookies([
    { name: 'soi-co-cookie', value: '1', url: goc },
  ]);

  const p = await ctx.newPage();

  const loi: string[] = [];
  p.on('console', (m) => m.type() === 'error' && loi.push(m.text()));
  p.on('pageerror', (e) => loi.push(String(e)));

  return { b, p, loi, dongLai: () => b.close() };
}

/**
 * Đăng nhập. Trả `null` khi qua được, hoặc câu nói vì sao không qua — KHÔNG ném lỗi.
 *
 * Không ném vì một lượt chạy hỏng đăng nhập vẫn còn giá trị: bốn màn công khai đo xong rồi, và
 * ném ở đây thì mất luôn cả chúng. Nơi gọi ghi lý do vào từng màn bị bỏ, để bản kê nói ra thay vì
 * im lặng thiếu.
 */
export async function dangNhap(phien: Phien, goc: string, ten: string, mk: string): Promise<string | null> {
  const { p } = phien;
  await p.goto(`${goc}/dang-nhap`, { waitUntil: 'networkidle' });
  await p.fill('#ten-dang-nhap', ten);
  await p.fill('#mat-khau', mk);

  /**
   * Nút GỬI tên là **"Vào phả"**. *"Đăng nhập"* và *"Tạo tài khoản"* là hai TAB đổi chế độ
   * (`app/dang-nhap/form-dang-nhap.tsx:180-195`, nút gửi ở `:286-287`). Bấm nhầm tab thì không có
   * lượt gọi `/api/auth` nào và màn đứng yên — không lỗi, không báo gì. Đúng thứ chỉ mở trình
   * duyệt mới thấy, và đúng thứ một chọn tử lỏng lẻo sẽ bấm nhầm.
   */
  await p.getByRole('button', { name: 'Vào phả', exact: true }).click();
  try {
    await p.waitForURL((u) => !u.pathname.includes('dang-nhap'), { timeout: 30000 });
    return null;
  } catch {
    const noiDung = (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 200);
    return `không qua được màn đăng nhập — màn đang nói: "${noiDung}"`;
  }
}

/** Mở một màn và đợi nó yên. */
export async function moMan(p: Page, goc: string, duong: string, choThem = 900): Promise<void> {
  await p.goto(`${goc}${duong}`, { waitUntil: 'networkidle' });
  if (choThem > 0) await p.waitForTimeout(choThem);
}

/**
 * Màn `/admin/*` khi thiếu quyền KHÔNG trả 403 — nó trả một trang "Khu vực Ban tu phả" đứng
 * ngoài khung (`app/admin/layout.tsx:44-60`). Bộ đo phải phân biệt nó với màn thật, nếu không nó
 * sẽ báo XANH cho một màn chưa bao giờ mở được.
 */
export async function bikChanQuyen(p: Page): Promise<boolean> {
  return p.evaluate(() => Boolean(document.querySelector('h1')?.textContent?.includes('Khu vực Ban tu phả')));
}

export async function chup(p: Page, ten: string, toanTrang = true): Promise<string> {
  const duong = `${THU_MUC_ANH}/${ten}.png`;
  await p.screenshot({ path: duong, fullPage: toanTrang });
  return duong;
}
