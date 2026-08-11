import Link from 'next/link';
import type { ReactNode } from 'react';
import { Sidebar } from '../_components/sidebar';
import { ViewportProvider, ViewportToggle } from '../_components/viewport';
import { readStoryIndex } from '../_registry/sprint';

/**
 * Vỏ xưởng — sidebar (outline bề mặt→FR→view) + thanh trên có switch Mobile/Web. Bọc trang tổng
 * quan (`/uiworkshop`) và trình xem màn (`/uiworkshop/view/<slug>`). KHÔNG bọc màn trần `<slug>`.
 *
 * ViewportProvider đặt ở đây (layout không remount khi chuyển màn) và **nhớ khung xem theo TỪNG
 * view** — mở lại một màn thì tự vào đúng khung đã chọn cho màn đó; chưa chọn bao giờ thì lấy mặc
 * định của bề mặt. Sidebar link tới `/uiworkshop/view/<slug>` → trình xem nhúng iframe.
 */
export default async function UiWorkshopShellLayout({ children }: { children: ReactNode }) {
  const stories = await readStoryIndex();

  return (
    <ViewportProvider>
      <div className="flex h-dvh flex-col bg-ws-n-05">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-ws-n-20 bg-white px-4 py-2">
          <Link
            href="/uiworkshop"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ws-ink-strong"
          >
            UI Workshop
          </Link>
          <ViewportToggle />
        </header>
        <div className="flex min-h-0 flex-1">
          <Sidebar stories={stories} />
          {/* `min-w-0`: flex item mặc định min-width:auto → nội dung rất rộng (canvas bản đồ luồng
              ~6000px) sẽ KÉO GIÃN cả khu làm việc thay vì bị cắt trong khung cuộn của nó. */}
          <main className="min-w-0 flex-1 overflow-y-auto px-6 py-6">{children}</main>
        </div>
      </div>
    </ViewportProvider>
  );
}
