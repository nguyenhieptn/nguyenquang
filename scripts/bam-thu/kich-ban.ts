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
  chay: (p: Page, goc: string, dauLuot: string) => Promise<string>;
};

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
    chay: async (p, goc, dauLuot) => {
      await p.goto(`${goc}/admin/cay`, { waitUntil: 'networkidle' });
      // Thẻ CỐ ĐỊNH của dòng họ thử (người quản trị, sinh 1975) — `.first()` trôi sau khi K3 thêm
      // người không năm sinh vào cùng vùng (lượt chạy lại 29/08).
      await p.locator('.react-flow__node', { hasText: 'Thử Quản Trị' }).first().click();
      await p.waitForTimeout(1200);
      // Tiền kiểm: thẻ đã chọn phải CÓ năm sinh — không thì không dựng được mâu thuẫn, và ✗ sẽ nói
      // sai lý do (review 7-1).
      const nutSinh = p.locator('aside button[aria-label^="Ghi thêm năm sinh"]').first();
      if (!(await nutSinh.count())) throw new Error('thẻ đã chọn chưa có năm sinh — K1 không dựng được mâu thuẫn từ đây');
      await nutSinh.click();
      // Biểu mẫu ghi thêm là một KHỐI trong phiếu, không phải `<form>` — neo vào ô giá trị.
      const oGiaTri = p.locator('aside input[id$="-gia-tri"]').first();
      await oGiaTri.waitFor({ timeout: 5000 });
      // Năm mang dấu lượt (như K4) — chạy lại trên cùng dòng họ thử thì vẫn là một giá trị MỚI.
      const nam = `1${dauLuot.slice(-3)}`;
      await oGiaTri.fill(nam);
      await p.locator('aside input[id$="-nguon"]').first().fill('kịch bản ghi 7-1');
      await p.locator('aside').getByRole('button', { name: 'Ghi vào phả' }).click();
      const chu = await doiRoiDoc(p, 'aside', 2000);
      // Chồng đơn trị hoá mâu thuẫn ⇒ câu của CHỒNG (`cauMauThuan`): "Hai giá trị không thể cùng
      // đúng" ở lượt đầu, "N lời khai, không thể cùng đúng" từ lượt thứ hai trên cùng dòng họ thử.
      // Không neo cụm "không thể cùng đúng" trần — chú thích biểu mẫu cũng có nó (review 7-1).
      phaiCo(chu, nam);
      if (!/(Hai giá trị|\d+ lời khai)[^.]*không thể cùng đúng/.test(chu)) {
        throw new Error(`cột phải không bày câu mâu thuẫn của chồng — đang nói: "${chu.slice(0, 240)}…"`);
      }
      return `cột phải bày ${nam} và câu mâu thuẫn của chồng Sinh`;
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
      try {
        const chu = await doiRoiDoc(p, 'main', 2000);
        phaiCo(chu, 'Đã gộp');
        // Đếm CHÍNH XÁC, không `includes` — "11 khẳng định" cũng chứa "1 khẳng định" (review 7-1).
        const so = chu.match(/— (\d+) khẳng định/)?.[1];
        if (so !== '1') throw new Error(`bảng nói ${so ?? '?'} khẳng định — mong đợi đúng 1 (quê quán của Em)`);
        // Câu phải ở NGOÀI hàng vừa gộp — hàng ấy đã rời danh sách sống.
        if ((await p.locator('main li').filter({ hasText: 'Đã gộp' }).count()) > 0) {
          throw new Error('câu xác nhận vẫn nằm trong một hàng — phải lên bảng');
        }
      } finally {
        // Dù ✓ hay ✗, TÁCH LẠI để dòng họ thử về nguyên trạng — lượt sau còn có "Vũng Tàu" sống để gộp.
        const tach = p.getByRole('button', { name: 'Tách lại' }).first();
        if (await tach.count()) await tach.click();
      }
      const chu2 = await doiRoiDoc(p, 'main', 2000);
      phaiCo(chu2, 'Đã tách lại');
      return 'bảng nói "Đã gộp — 1 khẳng định", rồi "Đã tách lại"';
    },
  },
  {
    khoa: 'k3-them-nguoi-quanh-minh',
    ten: 'K3 · bề mặt A, thành viên: thêm người quanh mình ⇒ thẻ mới trên canvas',
    vai: 'thanh-vien',
    // Đo 29/08: người + nguồn + khẳng định tên + khẳng định cha-con = 4.
    revisionMongDoi: 4,
    chay: async (p, goc, dauLuot) => {
      await p.goto(`${goc}/gia-pha`, { waitUntil: 'networkidle' });
      await p.locator('.react-flow__node').first().click();
      await p.waitForTimeout(1200);
      await p.locator('aside').getByRole('button', { name: 'Thêm người quanh đây' }).click();
      const form = p.locator('aside form').first();
      await form.waitFor({ timeout: 5000 });
      // Tên mang DẤU LƯỢT: thẻ "Kịch Bản" của lượt trước còn trên canvas không được làm ✓ giả (review 7-1).
      const ten = `${TEN_NGUOI_THU} ${dauLuot}`;
      await form.locator('input[id$="-ten"]').fill(ten);
      await form.locator('input[id$="-nguon"]').fill('kịch bản ghi 7-1');
      await form.getByRole('button', { name: 'Ghi vào phả' }).click();
      await p.waitForTimeout(2500);
      const chu = (await p.locator('.react-flow').innerText()).replace(/\s+/g, ' ');
      phaiCo(chu, dauLuot);
      return `canvas có thẻ "${ten}"`;
    },
  },
  {
    khoa: 'k4-an-theo-bao-cao',
    ten: 'K4 · bề mặt A, thành viên: ghi một năm sinh rồi ẩn chính dòng ấy ⇒ dòng rời phiếu, không chờ duyệt',
    vai: 'thanh-vien',
    // Đo 29/08: ghi thêm = 2 (khẳng định + nguồn), ẩn = 1. TỰ ĐỦ: kịch bản ghi rồi ẩn đúng dòng
    // vừa ghi, nên chạy lại bao nhiêu lần cũng được — lượt đầu ẩn năm sinh gốc và làm hỏng dòng họ
    // thử cho lượt sau (code review 7-3).
    revisionMongDoi: 3,
    chay: async (p, goc, dauLuot) => {
      await p.goto(`${goc}/gia-pha`, { waitUntil: 'networkidle' });
      await p.locator('.react-flow__node', { hasText: 'Thử Mình' }).first().click();
      await p.waitForTimeout(1200);
      // Năm sinh THỬ mang dấu lượt (19xx từ ba số cuối của dấu), để dòng cần ẩn là dòng của lượt này.
      const nam = `1${dauLuot.slice(-3)}`;
      // Có năm sinh thì bấm thẳng giá trị; không có (một lượt cũ đã ẩn) thì "Ghi thêm thông tin" rồi chọn loại.
      const nutSinh = p.locator('aside button[aria-label^="Ghi thêm năm sinh"]').first();
      if (await nutSinh.count()) {
        await nutSinh.click();
      } else {
        await p.locator('aside').getByRole('button', { name: 'Ghi thêm thông tin' }).first().click();
        const chonLoai = p.locator('aside select[id$="-loai"]').first();
        await chonLoai.waitFor({ timeout: 5000 });
        await chonLoai.selectOption('birth');
      }
      const oGiaTri = p.locator('aside input[id$="-gia-tri"]').first();
      await oGiaTri.waitFor({ timeout: 5000 });
      await oGiaTri.fill(nam);
      await p.locator('aside input[id$="-nguon"]').first().fill('kịch bản ghi 7-3');
      await p.locator('aside').getByRole('button', { name: 'Ghi vào phả' }).click();
      const chuTruoc = await doiRoiDoc(p, 'aside', 2000);
      phaiCo(chuTruoc, nam);
      // Chồng Sinh nay là mâu thuẫn (hai năm) nên các dòng bày mở — tìm đúng dòng mang năm thử.
      const dong = p.locator('aside li').filter({ hasText: nam }).first();
      if (!(await dong.count())) throw new Error(`phiếu không bày dòng năm sinh ${nam} vừa ghi`);
      await dong.getByRole('button', { name: 'Ẩn theo báo cáo…' }).click();
      await dong.locator('textarea').fill('kịch bản ghi 7-3 — thử ẩn dòng vừa ghi');
      await dong.getByRole('button', { name: 'Ẩn ngay' }).click();
      const chu = await doiRoiDoc(p, 'aside', 2000);
      if (chu.includes(nam)) throw new Error(`phiếu vẫn bày ${nam} sau khi ẩn — đang nói: "${chu.slice(0, 200)}…"`);
      phaiCo(chu, '1980'); // năm sinh gốc còn nguyên — kịch bản không đụng dữ liệu của lượt sau
      return `ghi ${nam} rồi ẩn — phiếu về lại 1980, không chờ duyệt`;
    },
  },
  {
    khoa: 'k5-ngay-gio',
    ten: 'K5 · bề mặt A, thành viên: ghi ngày giỗ cho Tổ từ phiếu ⇒ phiếu bày cả hai lịch',
    vai: 'thanh-vien',
    // Đo 29/08: một khẳng định + một nguồn = 2.
    revisionMongDoi: 2,
    chay: async (p, goc) => {
      await p.goto(`${goc}/gia-pha`, { waitUntil: 'networkidle' });
      // Tổ (đã khuất, cách Mình hai bậc nên có trên canvas) — đã có giỗ 15/8 của dòng họ thử; ghi thêm
      // một ngày khác là chồng Giỗ hoá mâu thuẫn, ban tu phả chọn. Ghi bằng "Ghi thêm thông tin".
      // (Lượt đầu chọn Chú: cách Mình BA bậc, ngoài canvas mặc định — thẻ không có để bấm.)
      await p.locator('.react-flow__node', { hasText: 'Thử Tổ' }).first().click();
      await p.waitForTimeout(1200);
      await p.locator('aside').getByRole('button', { name: 'Ghi thêm thông tin' }).first().click();
      const chonLoai = p.locator('aside select[id$="-loai"]').first();
      await chonLoai.waitFor({ timeout: 5000 });
      await chonLoai.selectOption('gio');
      await p.locator('aside input[id$="-gia-tri"]').first().fill('12/9');
      await p.locator('aside input[id$="-nguon"]').first().fill('kịch bản ghi 7-5');
      await p.locator('aside').getByRole('button', { name: 'Ghi vào phả' }).click();
      const chu = await doiRoiDoc(p, 'aside', 2000);
      phaiCo(chu, 'ngày 12 tháng 9 âm lịch', 'sắp tới');
      return 'phiếu bày "giỗ ngày 12 tháng 9 âm lịch — sắp tới: dd/mm/yyyy"';
    },
  },
];
