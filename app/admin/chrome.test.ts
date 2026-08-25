/**
 * TEST BẤT BIẾN TRÊN MÃ NGUỒN — không render gì cả.
 *
 * Repo không có thư viện test React (`vitest.config.ts` chạy `environment: 'node'`, không
 * jsdom, không `@testing-library`, không e2e). Story 5-1 CỐ Ý không dựng hạ tầng ấy: con bug
 * cần chặn ở đây không phải "màn này hiển thị sai", mà là **"một trang nào đó quên chrome"** —
 * và một test render một màn thì bắt đúng cái màn nó render, không bắt được cái màn người sau
 * quên. Test đọc mã nguồn thì bắt được cả những màn chưa ai viết.
 *
 * Rẻ (mili-giây), chạy trong node, và giữ được sau khi người viết nó đi khỏi.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const GOC = path.resolve(__dirname, '..', '..');

/**
 * HAI gốc, không phải một.
 *
 * Bản đầu chỉ quét `app/admin/`. Nhưng sau story 5-1 thì `<h1>` của màn, quyết định bề rộng duy
 * nhất, và mọi `href` của thanh việc đều nằm ở `components/admin/khung-admin.tsx` — tức đúng cái
 * file mà một lần sa sút chrome sẽ rơi vào lại là file DUY NHẤT không bị soi. Một `<h1>` thứ hai
 * hay một bề rộng cứng thêm vào đó thì cả mười hai bài test cũ vẫn xanh.
 */
const GOC_QUET = [path.join(GOC, 'app', 'admin'), path.join(GOC, 'components', 'admin')];

/** Mọi file mã dưới một thư mục, trừ chính file test này. */
function taiCaFile(thuMuc: string): string[] {
  const ra: string[] = [];
  for (const ten of readdirSync(thuMuc)) {
    const duong = path.join(thuMuc, ten);
    if (statSync(duong).isDirectory()) {
      ra.push(...taiCaFile(duong));
    } else if (/\.tsx?$/.test(ten) && !ten.endsWith('.test.ts')) {
      ra.push(duong);
    }
  }
  return ra;
}

const FILE = GOC_QUET.flatMap(taiCaFile);
const DOC = new Map(FILE.map((f) => [path.relative(GOC, f), readFileSync(f, 'utf8')]));

/**
 * Bỏ chú thích trước khi soi: doc header của repo NÓI VỀ luật, nên nó nhắc lại chính những
 * chuỗi bị cấm ("bản cũ dùng `<main className="mx-auto max-w-[1100px]">`"). Bắt lỗi trên chú
 * thích là dạy người sau viết ít chú thích lại — đúng thứ repo này không muốn.
 */
function boChuThich(ma: string): string {
  return ma.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const MA = new Map([...DOC].map(([f, s]) => [f, boChuThich(s)]));

function pham(kiemTra: (ma: string) => boolean): string[] {
  return [...MA].filter(([, ma]) => kiemTra(ma)).map(([f]) => f);
}

describe('vỏ /admin — layout sở hữu chrome', () => {
  it('có file để soi (test này vô nghĩa nếu quét trượt thư mục)', () => {
    expect(FILE.length).toBeGreaterThan(8);
  });

  it('không trang nào import lại thanh điều hướng cũ', () => {
    expect(pham((ma) => ma.includes('ThanhBanDuyet'))).toEqual([]);
  });

  /**
   * SỬA 25/08 sau code review Đợt 2. Bài cũ đòi `mx-auto` đứng NGAY TRƯỚC `max-w-[`, nên nó bỏ
   * lọt mọi bề rộng cứng viết cách khác — `w-full max-w-[560px]` ngồi ngay trong `loading.tsx`
   * suốt và không ai kêu. Bất biến thật không nói gì về `mx-auto`: nó nói **bề rộng bằng pixel
   * thuộc về chrome, đúng hai chỗ**, và mọi chỗ khác đo bằng độ dài dòng (`ch`).
   */
  const CHU_BE_RONG = ['app/admin/layout.tsx', 'components/admin/khung-admin.tsx'];

  /**
   * Bản 25/08 sáng chỉ soi `px`, nên bốn `loading.tsx` viết bằng `rem` (`max-w-[36rem]`,
   * `max-w-[40rem]`) đi qua — đúng loại file mà mục nặng #36 nêu đích danh. Sửa một nửa rồi khoá
   * lại là dạy người sau rằng `rem` được phép.
   *
   * Luật: khung chữ trong màn đo bằng ĐỘ DÀI DÒNG (`ch`). `px` và `rem` là bề rộng tuyệt đối,
   * và bề rộng tuyệt đối thuộc về chrome — đúng hai chỗ.
   */
  it('khung chữ trong màn đo bằng `ch`, không bằng px/rem — bề rộng tuyệt đối là của chrome', () => {
    const pham = [...MA]
      .filter(([f]) => !CHU_BE_RONG.includes(f))
      .filter(([, ma]) => /max-w-\[[\d.]+(px|rem)\]/.test(ma))
      .map(([f]) => f);
    expect(pham, 'bề rộng khung là việc của layout — chữ trong màn đo bằng `ch`').toEqual([]);
  });

  it('không trang nào tự căn giữa một khung của riêng nó', () => {
    expect(pham((ma) => /mx-auto\s+max-w-\[/.test(ma))).toEqual([]);
  });

  it('bốn bề rộng cũ (720 / 900 / 1100 / 1280) đã tuyệt tích', () => {
    expect(pham((ma) => /max-w-\[(720|900|1100|1280)px\]/.test(ma))).toEqual([]);
  });

  it('chữ vẫn tự giới hạn bằng ĐỘ DÀI DÒNG — bỏ khung mà quên đo là chữ chạy hết màn hình', () => {
    expect(pham((ma) => /max-w-\[\d+ch\]/.test(ma)).length).toBeGreaterThan(3);
  });

  /**
   * SỬA 24/08 sau code review. Danh sách cũ có `app/admin/error.tsx` — và chính chỗ miễn trừ ấy
   * khoá cứng một con bug: file đó nghĩ nó chạy ngoài khung, thật ra nó luôn chạy TRONG khung
   * (`error.js` không bọc `layout.js` cùng segment), nên trang lỗi bày hai `<h1>` mà bài test
   * giữ bất biến "đúng một `<h1>`" vẫn xanh. Nay nó dùng `<h2>` như hai file anh em.
   *
   * Còn đúng hai chỗ, và cả hai đều CHỦ Ý:
   *   · `khung-admin.tsx` — `<h1>` của màn, thứ layout sở hữu.
   *   · `layout.tsx` — màn "Khu vực Ban tu phả", cố ý đứng NGOÀI khung nên phải tự có `<h1>`.
   */
  it('đúng một chỗ dựng <h1> của màn, cộng màn chặn cổng vốn đứng ngoài khung', () => {
    expect(pham((ma) => ma.includes('<h1')).sort()).toEqual([
      'app/admin/layout.tsx',
      'components/admin/khung-admin.tsx',
    ]);
  });

  /** AC 8. Bỏ dòng này thì mọi con số trên thanh việc lặng lẽ thành số cũ, không test nào kêu. */
  it('layout khai force-dynamic — số trên thanh việc không được cache', () => {
    expect(DOC.get('app/admin/layout.tsx')).toContain("export const dynamic = 'force-dynamic'");
  });

  /**
   * AC 24: 15px là tối thiểu TUYỆT ĐỐI, chỉ cho nhãn phụ. Dưới nữa thì không có ngoại lệ nào.
   *
   * SỬA 25/08 sau code review Đợt 2. Bài cũ chỉ soi `text-[<số>px]`, tức là chỉ soi ĐÚNG cách
   * viết mà repo này đang dùng — nên nó bất lực trước cách viết mà người sau nhiều khả năng dùng
   * nhất: thang chữ của Tailwind. Gốc chữ ở đây là 17px (`app/globals.css`), nên `text-sm` là
   * 14.875px và `text-xs` là 12.75px: cả hai đều dưới sàn, cả hai đều lọt.
   */
  /**
   * Sàn phải nằm ở CHÍNH PRIMITIVE, không nằm ở kỷ luật của người dựng màn sau.
   *
   * `components/ui/` ngoài hai gốc quét, nhưng chính nó đặt cỡ chữ cho mọi `<Button>`,
   * `<Table>`, `<Card>` mà bàn làm việc dựng. Trước 25/08 chúng mang `text-sm` (14.875px ở gốc
   * 17px) và `text-[0.8rem]` (13.6px) — dưới sàn tuyệt đối. Không ô nào lọt sàn chỉ vì mọi chỗ
   * gọi đều tự tay thêm `text-[17px]`; một `<Button>` mới quên là lọt ngay, và không bài nào kêu.
   *
   * Gốc chữ 17px là điều làm chuyện này khác shadcn gốc: `text-sm` = 0.875rem, ở gốc 16px là
   * 14px, ở đây là 14.875px — vẫn dưới sàn, và vẫn không ai để ý.
   */
  it('primitive shadcn không đặt cỡ nào dưới sàn 15px', () => {
    const GOC_UI = path.join(GOC, 'components', 'ui');
    const pham: string[] = [];
    for (const f of taiCaFile(GOC_UI)) {
      const ma = boChuThich(readFileSync(f, 'utf8'));
      const xau = [
        ...[...ma.matchAll(/\btext-(sm|xs)\b/g)].map((m) => m[0]),
        ...[...ma.matchAll(/text-\[([\d.]+)rem\]/g)]
          .filter((m) => Number(m[1]) * 17 < 15)
          .map((m) => m[0]),
        ...[...ma.matchAll(/text-\[(?:[0-9]|1[0-4])px\]/g)].map((m) => m[0]),
      ];
      if (xau.length) pham.push(`${path.relative(GOC, f)}: ${[...new Set(xau)].join(', ')}`);
    }
    expect(pham, 'ở gốc 17px thì text-sm = 14.875px và text-xs = 12.75px — cả hai dưới sàn').toEqual([]);
  });

  it('không chỗ nào tụt xuống dưới sàn tuyệt đối 15px', () => {
    // px tường minh dưới 15
    expect(pham((ma) => /text-\[(?:[0-9]|1[0-4])px\]/.test(ma))).toEqual([]);
    // thang Tailwind: gốc 17px ⇒ text-sm = 14.875px, text-xs = 12.75px
    expect(pham((ma) => /\btext-(sm|xs)\b/.test(ma))).toEqual([]);
    // rem tường minh dưới 15/17 ≈ 0.882rem
    expect(
      pham((ma) =>
        [...ma.matchAll(/text-\[([\d.]+)rem\]/g)].some((m) => Number(m[1]) * 17 < 15),
      ),
    ).toEqual([]);
  });

  it('không file nào còn trỏ vào địa chỉ cũ', () => {
    expect(pham((ma) => ma.includes('/ban-duyet'))).toEqual([]);
  });

  it('thư mục app/ban-duyet không còn tồn tại', () => {
    expect(() => statSync(path.join(GOC, 'app', 'ban-duyet'))).toThrow();
  });

  /**
   * AC 2 vế hai. Test cũ chỉ hỏi "có file nào dưới `app/admin/` còn nhắc tên nó không" — im lặng
   * đúng cả khi file vẫn nằm nguyên chỗ cũ và vẫn có người ngoài `app/admin/` import.
   */
  it('thanh điều hướng cũ đã bị xoá khỏi cây mã, không chỉ thôi được gọi', () => {
    expect(() =>
      statSync(path.join(GOC, 'components', 'pha', 'thanh-ban-duyet.tsx')),
    ).toThrow();
  });

  /** AC 16 — chân trang nằm ngoài hai gốc quét, nên một lần lùi ở đó là lùi không ai thấy. */
  it('chân trang bề mặt A trỏ vào địa chỉ mới', () => {
    const chan = readFileSync(path.join(GOC, 'components', 'pha', 'chan-trang.tsx'), 'utf8');
    expect(chan).not.toContain('/ban-duyet');
  });
});

describe('tiêu đề thẻ trình duyệt', () => {
  /**
   * `<title>` KHÔNG có bài nào canh trước 25/08 — nên một màn mới quên `metadata` thì thẻ trình
   * duyệt đội tiêu đề của bề mặt A công khai ("Gia phả dòng họ…"), và người vận hành mở sáu thẻ
   * không phân biệt được thẻ nào là thẻ nào. Cùng lớp bug với `<h1>` sai, chỉ khác chỗ hiện.
   *
   * `tieuDeThe()` sống cạnh bản đồ màn nên tiêu đề thẻ và nhãn thanh việc không trôi khỏi nhau.
   */
  it('mọi màn dưới /admin lấy tiêu đề thẻ từ tieuDeThe(), không tự bịa chuỗi', () => {
    /**
     * `MA` (đã bỏ chú thích), KHÔNG phải `DOC`. Bản đầu đọc nguyên văn, nên một trang chỉ cần
     * NHẮC chữ `notFound()` trong doc header là rơi khỏi phép soi — và
     * `app/admin/[...khong-co-man]/page.tsx` làm đúng thế ở dòng đầu tiên của nó.
     */
    const thieu = [...MA]
      .filter(([f]) => f.startsWith('app/admin/') && f.endsWith('page.tsx'))
      // Catch-all là bẫy 404, không phải một màn: nó gọi `notFound()` và không vẽ gì.
      .filter(([, ma]) => !ma.includes('notFound()'))
      .filter(([, ma]) => !ma.includes('tieuDeThe('))
      .map(([f]) => f);
    expect(thieu, 'màn thiếu metadata — thẻ trình duyệt sẽ đội tiêu đề của bề mặt A').toEqual([]);

    /**
     * MỐC LÙI. Hai bề mặt vẽ thật mà không phải `page.tsx` — màn chặn cổng trong `layout.tsx` và
     * `not-found.tsx` — không tự khai `metadata`, nên chúng sống nhờ dòng `title` của layout.
     * Gỡ dòng ấy thì cả hai đội tiêu đề của bề mặt A công khai, và không phép soi nào ở trên kêu.
     */
    expect(MA.get('app/admin/layout.tsx'), 'layout phải giữ mốc lùi cho thẻ trình duyệt').toMatch(
      /export const metadata[^=]*=\s*\{[^}]*title/,
    );
  });
});

describe('đổi địa chỉ', () => {
  const config = readFileSync(path.join(GOC, 'next.config.ts'), 'utf8');
  const dong = [...config.matchAll(/source:\s*"(\/ban-duyet[^"]*)"/g)].map((m) => m[1]);
  // `.sort()` sửa TẠI CHỖ — sao chép trước khi so, kẻo phép so ở đây làm hỏng phép so thứ tự bên dưới.

  it('chuyển hướng đủ SÁU đường cũ', () => {
    expect([...dong].sort()).toEqual(
      [
        '/ban-duyet',
        '/ban-duyet/hang-cho',
        '/ban-duyet/hop-nhat',
        '/ban-duyet/nap-khung',
        '/ban-duyet/nap-khung/mau',
        '/ban-duyet/xem-truoc',
      ].sort(),
    );
  });

  it('mọi chuyển hướng là vĩnh viễn (308) — địa chỉ cũ không quay lại', () => {
    const tam = [...config.matchAll(/source:\s*"\/ban-duyet[^"]*"[^}]*?permanent:\s*(\w+)/g)]
      .map((m) => m[1])
      .filter((v) => v !== 'true');
    expect(tam).toEqual([]);
  });

  /**
   * SỬA 24/08 sau code review. Bài cũ khoá thứ tự `/mau` phải đứng trước `/nap-khung`, với lý do
   * route cha sẽ "nuốt" route con. Không đúng: `source` của `redirects()` so khớp NGUYÊN VẸN, nên
   * `/ban-duyet/nap-khung` không khớp `/ban-duyet/nap-khung/mau` ở bất kỳ vị trí nào. Thứ tự hiện
   * tại vô hại, nhưng khoá nó lại thành bất biến là dạy người thêm chuyển hướng thứ bảy một luật
   * không có thật.
   *
   * Mối nguy NUỐT là có thật — nhưng nó đến từ ký tự đại diện (`:path*`), không từ thứ tự. Đó mới
   * là thứ đáng khoá.
   */
  it('không chuyển hướng nào dùng ký tự đại diện — đó mới là thứ nuốt route con', () => {
    expect(dong.filter((d) => d.includes(':') || d.includes('*'))).toEqual([]);
  });
});

describe('thanh việc không dẫn vào đường cụt', () => {
  const banDo = readFileSync(path.join(GOC, 'components', 'admin', 'man-admin.ts'), 'utf8');
  const duong = [...banDo.matchAll(/duong:\s*'([^']+)'/g)].map((m) => m[1]);

  it('mỗi mục trên thanh việc có một page.tsx thật đứng sau', () => {
    expect(duong.length).toBeGreaterThan(0);
    for (const d of duong) {
      const trang = path.join(GOC, 'app', d.replace(/^\//, ''), 'page.tsx');
      expect(statSync(trang).isFile(), `${d} không có màn`).toBe(true);
    }
  });

  /**
   * CHIỀU NGƯỢC LẠI — và đây mới là chiều mà con bug của story này biết đường quay lại.
   *
   * Bản đồ màn tập trung được chọn để trang không thể "quên khai tiêu đề". Nhưng
   * `khung-admin.tsx` vẫn có nhánh lùi `man?.tieuDe ?? 'Bàn làm việc'`: một màn mọc dưới
   * `/admin/` mà quên đăng ký vào `MAN` thì không lỗi, không cảnh báo — chỉ lặng lẽ đội sai
   * `<h1>` và không mục nào trên thanh việc sáng lên. Đúng lớp bug cũ, dời sang chỗ khác.
   */
  it('mỗi màn có thật dưới /admin đều đã đăng ký trong bản đồ màn', () => {
    const chuaKhai = FILE.filter((f) => path.basename(f) === 'page.tsx')
      .map((f) => `/${path.relative(path.join(GOC, 'app'), path.dirname(f))}`)
      /**
       * Đoạn ĐỘNG không phải một màn. `app/admin/[...khong-co-man]` là bẫy 404 — nó chỉ gọi
       * `notFound()`, không có tiêu đề để đội và không có mục nào trên thanh việc để sáng.
       * Đăng ký nó vào `MAN` là đẻ ra một mục dẫn tới chính trang 404.
       */
      .filter((d) => !d.includes('['))
      .filter((d) => !duong.includes(d));
    expect(chuaKhai, 'màn chưa có trong MAN — thanh việc sẽ không sáng, <h1> sẽ sai').toEqual([]);
  });
});
