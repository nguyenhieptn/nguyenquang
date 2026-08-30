/**
 * BA KỊCH BẢN GHI — mỗi cái là một LỚP mà `soi` (chỉ đọc) và test adapter (không có màn) đều không
 * chạm: bấm nút ghi thật, rồi đọc lại thứ màn nói. Story 7-1.
 *
 *   K1 · phiếu bề mặt B — ghi thêm năm sinh ⇒ chồng hoá mâu thuẫn, câu cảnh báo hiện.
 *   K2 · bảng nơi chốn — gộp rồi tách ⇒ câu xác nhận lên BẢNG (đúng lỗi code review 6-4 vá).
 *   K3 · bề mặt A, thành viên — thêm người quanh mình ⇒ thẻ mới hiện trên canvas.
 *
 * `revisionMongDoi` là con số ĐO ĐƯỢC ở lượt chạy đầu (29/08/2026), ghi lại làm bất biến: một
 * đường ghi mà số hàng nhật ký đổi là một đường ghi đã đổi hình — phải có người nhìn.
 */
import type { Page } from 'playwright';

export type KichBan = {
  khoa: string;
  ten: string;
  vai: 'quan-tri' | 'thanh-vien';
  /** Số hàng `revision` mà kịch bản này sinh ra trong clan thử. */
  revisionMongDoi: number;
  /** Chạy, trả về CÂU MÀN ĐÃ NÓI (để in ra bản kê). Ném lỗi khi màn không nói điều mong đợi. */
  chay: (p: Page, goc: string) => Promise<string>;
};

const NAM_THU = '1901';
export const TEN_NGUOI_THU = 'Nguyễn Thử Kịch Bản';

async function doiRoiDoc(p: Page, chon: string, ms = 1500): Promise<string> {
  await p.waitForTimeout(ms);
  return (await p.locator(chon).innerText()).replace(/\s+/g, ' ');
}

function phaiCo(chu: string, ...manh: string[]): void {
  for (const m of manh) {
    if (!chu.includes(m)) throw new Error(`màn không nói "${m}" — đang nói: "${chu.slice(0, 240)}…"`);
  }
}

export const KICH_BAN: readonly KichBan[] = [
  {
    khoa: 'k1-nam-sinh',
    ten: 'K1 · phiếu B: ghi thêm năm sinh ⇒ chồng mâu thuẫn',
    vai: 'quan-tri',
    // Đo 29/08: một khẳng định + một nguồn = 2 hàng nhật ký (AD-10: nguồn là một thực thể có dấu vết).
    revisionMongDoi: 2,
    chay: async (p, goc) => {
      await p.goto(`${goc}/admin/cay`, { waitUntil: 'networkidle' });
      await p.locator('.react-flow__node').first().click();
      await p.waitForTimeout(1200);
      await p.locator('aside button[aria-label^="Ghi thêm năm sinh"]').first().click();
      // Biểu mẫu ghi thêm là một KHỐI trong phiếu, không phải `<form>` — neo vào ô giá trị.
      const oGiaTri = p.locator('aside input[id$="-gia-tri"]').first();
      await oGiaTri.waitFor({ timeout: 5000 });
      await oGiaTri.fill(NAM_THU);
      await p.locator('aside input[id$="-nguon"]').first().fill('kịch bản ghi 7-1');
      await p.locator('aside').getByRole('button', { name: 'Ghi vào phả' }).click();
      const chu = await doiRoiDoc(p, 'aside', 2000);
      // Thẻ đầu (Tổ) đã có năm sinh ⇒ hai giá trị đơn trị ⇒ câu mâu thuẫn phải hiện cùng năm mới.
      phaiCo(chu, NAM_THU, 'không thể cùng đúng');
      return `cột phải bày ${NAM_THU} và câu "không thể cùng đúng"`;
    },
  },
  {
    khoa: 'k2-gop-tach-noi',
    ten: 'K2 · nơi chốn: gộp rồi tách ⇒ câu xác nhận lên bảng',
    vai: 'quan-tri',
    // Đo 29/08: gộp = 1 (`merge`), tách = 1 (`unmerge`) — không repoint, không hàng nào khác.
    revisionMongDoi: 2,
    chay: async (p, goc) => {
      await p.goto(`${goc}/admin/noi-chon`, { waitUntil: 'networkidle' });
      // Hàng "Định Hoá" cũng mang chữ "Vũng Tàu" (dấu trùng tên nói rõ nơi nào) — neo vào đơn vị cha
      // của CHÍNH hàng, không vào chữ bất kỳ trong hàng.
      const hang = p.locator('main li').filter({ has: p.locator('p > span', { hasText: /^, Vũng Tàu$/ }) }).first();
      await hang.getByRole('button', { name: 'Gộp vào…' }).click();
      const chon = hang.locator('select');
      const giaTri = await chon.evaluate((el) => {
        const o = [...(el as HTMLSelectElement).options].find((x) => x.textContent?.includes('Định Hoá'));
        return o?.value ?? '';
      });
      if (!giaTri) throw new Error('không thấy "Định Hoá" trong danh sách nơi thắng');
      await chon.selectOption(giaTri);
      await hang.getByRole('checkbox').click();
      await hang.getByRole('button', { name: /^Gộp — / }).click();
      let chu = await doiRoiDoc(p, 'main', 2000);
      phaiCo(chu, 'Đã gộp', '1 khẳng định');
      // Câu phải ở NGOÀI hàng vừa gộp — hàng ấy đã rời danh sách sống.
      if ((await p.locator('main li').filter({ hasText: 'Đã gộp' }).count()) > 0) {
        throw new Error('câu xác nhận vẫn nằm trong một hàng — phải lên bảng');
      }
      await p.getByRole('button', { name: 'Tách lại' }).first().click();
      chu = await doiRoiDoc(p, 'main', 2000);
      phaiCo(chu, 'Đã tách lại');
      return 'bảng nói "Đã gộp … 1 khẳng định", rồi "Đã tách lại"';
    },
  },
  {
    khoa: 'k3-them-nguoi-quanh-minh',
    ten: 'K3 · bề mặt A, thành viên: thêm người quanh mình ⇒ thẻ mới trên canvas',
    vai: 'thanh-vien',
    // Đo 29/08: người + nguồn + khẳng định tên + khẳng định cha-con = 4.
    revisionMongDoi: 4,
    chay: async (p, goc) => {
      await p.goto(`${goc}/gia-pha`, { waitUntil: 'networkidle' });
      await p.locator('.react-flow__node').first().click();
      await p.waitForTimeout(1200);
      await p.locator('aside').getByRole('button', { name: 'Thêm người quanh đây' }).click();
      const form = p.locator('aside form').first();
      await form.waitFor({ timeout: 5000 });
      await form.locator('input[id$="-ten"]').fill(TEN_NGUOI_THU);
      await form.locator('input[id$="-nguon"]').fill('kịch bản ghi 7-1');
      await form.getByRole('button', { name: 'Ghi vào phả' }).click();
      await p.waitForTimeout(2500);
      const chu = (await p.locator('.react-flow').innerText()).replace(/\s+/g, ' ');
      phaiCo(chu, 'Kịch Bản');
      return `canvas có thẻ "${TEN_NGUOI_THU}"`;
    },
  },
  {
    khoa: 'k4-an-theo-bao-cao',
    ten: 'K4 · bề mặt A, thành viên: ẩn theo báo cáo ⇒ dòng rời phiếu ngay, không chờ duyệt',
    vai: 'thanh-vien',
    // Đo 29/08: ẩn = 1 hàng `hide`, lý do trong `note` (AD-17, story 7-3).
    revisionMongDoi: 1,
    chay: async (p, goc) => {
      await p.goto(`${goc}/gia-pha`, { waitUntil: 'networkidle' });
      // Người của chính mình — "Mình" có năm sinh 1980 trong dòng họ thử.
      await p.locator('.react-flow__node', { hasText: 'Thử Mình' }).first().click();
      await p.waitForTimeout(1200);
      // Chồng MỘT dòng bày giá trị ở hàng đầu, còn nút nằm trong `<details>` bên dưới — neo vào KHỐI
      // "Sinh" rồi mở tam giác, không tìm chữ "1980" trong `<li>` (nó không ở đó).
      const chuTruoc = await doiRoiDoc(p, 'aside', 300);
      if (!chuTruoc.includes('1980')) throw new Error('phiếu không bày năm sinh 1980 để ẩn');
      // `aside section` LỒNG NHAU (khối ngoài bọc mọi chồng) — lọc `has: h3` khớp cả khối ngoài, và
      // `.first()` chọn đúng khối ngoài ⇒ lượt chạy đầu ẨN NHẦM DÒNG TÊN. Đi từ chính `<h3>` lên cha.
      const khoi = p.locator('aside h3', { hasText: /^Sinh$/ }).first().locator('xpath=..');
      await khoi.locator('details').first().evaluate((d) => ((d as HTMLDetailsElement).open = true)).catch(() => {});
      const dong = khoi.locator('li').first();
      await dong.getByRole('button', { name: 'Ẩn theo báo cáo…' }).click();
      await dong.locator('textarea').fill('kịch bản ghi 7-3 — thử ẩn');
      await dong.getByRole('button', { name: 'Ẩn ngay' }).click();
      const chu = await doiRoiDoc(p, 'aside', 2000);
      if (chu.includes('1980')) throw new Error(`phiếu vẫn bày 1980 sau khi ẩn — đang nói: "${chu.slice(0, 200)}…"`);
      return 'phiếu không còn dòng 1980 — ẩn ngay, không chờ duyệt';
    },
  },
];
