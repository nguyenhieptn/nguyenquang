import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Layout GỐC của /uiworkshop/* — chỉ giữ CỔNG CHẶN SHIP + nền trung tính.
 *
 * Vỏ xưởng (sidebar + thanh trên + switch Mobile/Web) nằm ở nhóm route `(shell)`. Các màn dựng
 * thử `<slug>` KHÔNG thuộc `(shell)` nên render "TRẦN" ở đây (không sidebar) — đó chính là bản mà
 * khung thiết bị (DeviceFrame) nhúng qua iframe để xem mobile/web. Nền `bg-ws-n-05` khớp nền CMS thật.
 *
 * ⛔ Route trả 404 khi build production. Xem: `npm run dev` → /uiworkshop
 */
export default function UiWorkshopRootLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return <div className="min-h-dvh bg-ws-n-05">{children}</div>;
}
