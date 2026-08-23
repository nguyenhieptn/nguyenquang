/**
 * /ban-duyet — không có nội dung riêng: việc đầu tiên của người vận hành là nạp khung
 * (EXPERIENCE.md § Key Flows — Luồng 2, bước 1), nên gốc bàn duyệt đưa thẳng tới đó.
 */
import { redirect } from 'next/navigation';

export default function BanDuyetPage() {
  redirect('/ban-duyet/nap-khung');
}
