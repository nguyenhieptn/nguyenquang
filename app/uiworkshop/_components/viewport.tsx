'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { defaultViewport, type ViewportMode } from '../_registry/outline';

/**
 * Chế độ khung xem của xưởng — áp cho MỌI màn (một năng lực của xưởng, không nhân đôi file).
 *  - mobile: iframe 390px (breakpoint tính theo viewport iframe → ra layout mobile THẬT)
 *  - web:    iframe chiếm hết bề ngang khu làm việc → layout desktop
 *
 * Chốt 24/07/2026: bỏ chế độ "cả hai" (mỗi màn chỉ có MỘT bề mặt đúng), và **nhớ lựa chọn theo
 * TỪNG VIEW** — chọn Web ở một màn CMS thì lần sau mở lại đúng màn đó tự vào Web, trong khi màn
 * khách vẫn mở ở Mobile. Lưu ở `localStorage` (map slug → mode) nên bền qua reload.
 *
 * Lần đầu chưa có lựa chọn → mặc định theo BỀ MẶT (`defaultViewport` ở outline.ts): khách và
 * capability = mobile; CMS và màn trưng bày = web.
 *
 * Đọc bằng `useSyncExternalStore`: localStorage là external store, cách này cho snapshot server
 * (mặc định của bề mặt) khác snapshot client mà KHÔNG lệch hydrate và không phải set state trong
 * effect. Ghi thì `emit()` để mọi consumer vẽ lại; nghe cả sự kiện `storage` nên hai tab đồng bộ.
 */
export type { ViewportMode };

const STORE_KEY = 'uiworkshop:viewport-by-view';

/** Slug của view đang mở (`/uiworkshop/view/<slug>`); null nếu đang ở trang tổng quan. */
function slugOf(pathname: string): string | null {
  const m = /^\/uiworkshop\/view\/([^/?#]+)/.exec(pathname);
  return m?.[1] ?? null;
}

function readStore(): Record<string, ViewportMode> {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ViewportMode>) : {};
  } catch {
    return {}; // localStorage bị chặn / JSON hỏng → coi như chưa có lựa chọn nào
  }
}

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

const ViewportCtx = createContext<{
  mode: ViewportMode;
  setMode: (m: ViewportMode) => void;
  /** Có màn nào đang mở không — trang tổng quan và bản đồ luồng thì switch vô nghĩa, ẩn đi. */
  active: boolean;
}>({
  mode: 'mobile',
  setMode: () => {},
  active: false,
});

export function ViewportProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const slug = slugOf(pathname);

  /** Mặc định của bề mặt — cũng là snapshot phía server (chưa đọc được localStorage). */
  const fallback = slug ? defaultViewport(slug) : 'mobile';
  const mode = useSyncExternalStore(
    subscribe,
    () => (slug ? (readStore()[slug] ?? fallback) : fallback), // client: lựa chọn đã nhớ
    () => fallback, // server
  );

  const setMode = useCallback(
    (m: ViewportMode) => {
      if (!slug) return;
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify({ ...readStore(), [slug]: m }));
      } catch {
        // localStorage bị chặn → không nhớ được, nhưng vẫn không làm hỏng thao tác
      }
      emit();
    },
    [slug],
  );

  return (
    <ViewportCtx.Provider value={{ mode, setMode, active: slug !== null }}>
      {children}
    </ViewportCtx.Provider>
  );
}

export function useViewport() {
  return useContext(ViewportCtx);
}

const OPTIONS: { v: ViewportMode; label: string }[] = [
  { v: 'mobile', label: 'Mobile' },
  { v: 'web', label: 'Web' },
];

/** Segmented control ở thanh trên cùng của xưởng. */
export function ViewportToggle() {
  const { mode, setMode, active } = useViewport();
  if (!active) return null; // tổng quan & bản đồ luồng: không có màn nào để đổi khung
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-ws-n-20 bg-ws-n-05 p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => setMode(o.v)}
          aria-pressed={mode === o.v}
          className={[
            'rounded px-3 py-1 font-mono text-[11px] tracking-wide transition-colors',
            mode === o.v
              ? 'bg-white font-semibold text-ws-accent shadow-sm'
              : 'text-ws-n-60 hover:text-ws-ink-strong',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
