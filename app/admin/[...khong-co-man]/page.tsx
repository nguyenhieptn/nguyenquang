/**
 * Bắt mọi địa chỉ `/admin/*` không khớp màn nào, để `app/admin/not-found.tsx` CHẠY ĐƯỢC.
 *
 * ── Vì sao cần file này ────────────────────────────────────────────────────────────────────
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md`:
 *
 *   > the root `app/not-found.js` … handle any unmatched URLs for your whole application
 *
 * Tức `not-found.js` cấp segment chỉ chạy khi có ai đó gọi `notFound()` TRONG segment ấy. Địa chỉ
 * không khớp thì đi thẳng về 404 gốc, không qua `app/admin/layout.tsx`. Nên trước file này,
 * `app/admin/not-found.tsx` là mã chết: người vận hành gõ nhầm một chữ vẫn bị đẩy ra mặt giấy dó
 * của bề mặt A, đúng thứ nó viết ra để chặn.
 *
 * Đoạn tĩnh luôn thắng đoạn động, nên catch-all này không che màn nào đang có.
 */
import { notFound } from 'next/navigation';

export default function KhongCoMan(): never {
  notFound();
}
