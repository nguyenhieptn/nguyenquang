'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { layoutFlow, type Flow, type FlowNode } from '../_registry/flows';

/**
 * BẢN ĐỒ LUỒNG — một hành trình vẽ thành chuỗi màn THẬT (iframe của chính prototype trong xưởng),
 * nối bằng cạnh có **chip trigger**. Bấm chip → bản đồ tự bay tới và canh giữa màn kế tiếp.
 *
 * Vì sao là bản đồ zoom/pan chứ không phải danh sách: một luồng dài 6–9 màn, đặt cạnh nhau ở tỉ lệ
 * thật thì rộng 4–6 nghìn px. Zoom xa = thấy TOÀN hành trình (kiểm được mạch); zoom gần = đọc được
 * từng màn. Hai câu hỏi khác nhau, một bề mặt.
 *
 * Ba quyết định đáng ghi:
 *  1. **Trigger nằm ở TẦNG BẢN ĐỒ, không nằm trong prototype.** Prototype là mock tĩnh, cô lập,
 *     không có state; nối chúng bằng router thật sẽ phải sửa cả 44 màn. Chip trên cạnh nói rõ
 *     "hành vi nào đưa tới bước sau" mà không giả vờ rằng bấm trong màn là đi được. Về sau muốn
 *     bấm THẬT trong prototype thì thay ruột (postMessage) mà giữ nguyên vỏ này.
 *  2. **iframe nạp theo tầm nhìn** (IntersectionObserver, root = khung bản đồ): mở một luồng không
 *     bốc 9 trang cùng lúc. Đã nạp thì giữ, không tháo — tránh nháy trắng khi pan qua lại.
 *  3. **iframe bị vô hiệu chuột trừ node đang focus** → kéo ngang qua màn vẫn là kéo bản đồ, và
 *     bấm vào một màn xa là "đi tới màn đó" chứ không phải bấm vào ruột nó.
 */
export function FlowMap({ flow }: { flow: Flow }) {
  const box = useRef<HTMLDivElement>(null);
  const nodeEls = useRef<Array<HTMLDivElement | null>>([]);
  const { nodes, width, height } = useMemo(() => layoutFlow(flow), [flow]);

  const [view, setView] = useState({ x: 0, y: 0, z: 0.4 });
  const [glide, setGlide] = useState(false); // bật transition khi BAY, tắt khi kéo/cuộn
  const [focus, setFocus] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  /** Toàn màn hình. `full` = Fullscreen API thật; `expanded` = dự phòng CSS khi API bị chặn. */
  const [full, setFull] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const wide = full || expanded;

  const here = nodes[focus];
  const fitted = useRef(false);
  const drag = useRef<{ moved: number } | null>(null);
  /** Ý ĐỊNH cuối cùng của người xem — để khi khung đổi kích thước thì canh lại đúng thứ họ đang xem. */
  const intent = useRef<{ kind: 'fit' } | { kind: 'node'; i: number }>({ kind: 'fit' });

  /** Canh cả luồng vừa khung — trả lời "mạch này đi đâu về đâu". */
  const fitAll = useCallback(
    (animate = true) => {
      const el = box.current;
      if (!el) return;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const z = Math.min((cw - 48) / width, (ch - 48) / height, 1);
      intent.current = { kind: 'fit' };
      setGlide(animate);
      setView({ z, x: (cw - width * z) / 2, y: (ch - height * z) / 2 });
    },
    [width, height],
  );

  /** Bay tới một bước và canh giữa — đây là hành vi chính khi bấm chip trigger. */
  const goTo = useCallback(
    (i: number) => {
      const el = box.current;
      const n = nodes[i];
      if (!el || !n) return;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const z = Math.min((cw - 96) / n.w, (ch - 72) / n.h, 1);
      intent.current = { kind: 'node', i };
      setGlide(true);
      setFocus(i);
      setView({ z, x: cw / 2 - (n.x + n.w / 2) * z, y: ch / 2 - (n.y + n.h / 2) * z });
    },
    [nodes],
  );

  // Vừa khung ngay khi biết kích thước khung (ResizeObserver bắn phát đầu lúc observe), và **canh
  // lại theo Ý ĐỊNH cuối** mỗi khi khung đổi cỡ — vào/ra toàn màn hình, kéo cửa sổ, đổi zoom trình
  // duyệt. Không có bước này thì bật toàn màn hình xong bản đồ vẫn nằm ở tỉ lệ của khung cũ.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === 0) return;
      if (!fitted.current) {
        fitted.current = true;
        fitAll(false);
        return;
      }
      const it = intent.current;
      if (it.kind === 'node') goTo(it.i);
      else fitAll(false);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitAll, goTo]);

  // Đồng bộ trạng thái Fullscreen API (người dùng có thể thoát bằng Esc, không qua nút của mình).
  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Nạp iframe theo tầm nhìn. IntersectionObserver đo hình học ĐÃ transform nên vẫn đúng khi zoom.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number((e.target as HTMLElement).dataset.i));
        if (hit.length === 0) return;
        setLoaded((prev) => {
          const next = { ...prev };
          for (const i of hit) next[i] = true;
          return next;
        });
      },
      { root: el, rootMargin: '400px' },
    );
    for (const n of nodeEls.current) if (n) io.observe(n);
    return () => io.disconnect();
  }, [flow.id]);

  // Cuộn để zoom quanh con trỏ. Phải là listener non-passive mới preventDefault được.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      setGlide(false);
      setView((v) => {
        const z = Math.min(2, Math.max(0.08, v.z * Math.exp(-e.deltaY * 0.0015)));
        const k = z / v.z;
        return { z, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  /**
   * Kéo để pan. **KHÔNG dùng `setPointerCapture`**: bắt con trỏ về khung bản đồ khiến `pointerdown`
   * và `pointerup` cùng bắn vào khung, nên `click` được dispatch lên khung thay vì lên nút —
   * chip trigger và thẻ node sẽ IM LẶNG không phản hồi (đã dính đúng lỗi này). Thay bằng listener
   * tạm trên `window`: kéo vẫn mượt cả khi con trỏ ra ngoài khung, mà click vẫn về đúng đích.
   */
  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setGlide(false);
    let last = { x: e.clientX, y: e.clientY };
    drag.current = { moved: 0 };

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - last.x;
      const dy = ev.clientY - last.y;
      last = { x: ev.clientX, y: ev.clientY };
      if (drag.current) drag.current.moved += Math.abs(dx) + Math.abs(dy);
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // Giữ quãng đường vừa kéo tới lúc `click` bắn (ngay sau `pointerup`) để chặn click-nhầm.
      window.setTimeout(() => {
        drag.current = null;
      }, 0);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  /** Vừa kéo xong thì click liền sau đó là click-nhầm — bỏ qua. */
  const wasDrag = () => (drag.current?.moved ?? 0) > 6;

  /**
   * Toàn màn hình: ưu tiên Fullscreen API THẬT (giấu cả chrome trình duyệt → được thêm ~120px chiều
   * cao và cả bề ngang sidebar). Trình duyệt/iframe chặn API thì rơi về `fixed inset-0` — vẫn chiếm
   * hết cửa sổ, chỉ không giấu được chrome. Cả hai đều thoát bằng Esc.
   */
  const toggleWide = async () => {
    const el = box.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      await document.exitFullscreen();
      return;
    }
    if (expanded) {
      setExpanded(false);
      return;
    }
    try {
      await el.requestFullscreen();
    } catch {
      setExpanded(true);
    }
  };

  const zoomBy = (k: number) => {
    const el = box.current;
    if (!el) return;
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    setGlide(true);
    setView((v) => {
      const z = Math.min(2, Math.max(0.08, v.z * k));
      const r = z / v.z;
      return { z, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r };
    });
  };

  return (
    <div
      ref={box}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') goTo(Math.min(focus + 1, nodes.length - 1));
        if (e.key === 'ArrowLeft') goTo(Math.max(focus - 1, 0));
        if (e.key === '0') fitAll();
        if (e.key === 'f') void toggleWide();
        if (e.key === 'Escape' && expanded) setExpanded(false); // Esc của Fullscreen API tự lo
      }}
      onPointerDown={onPointerDown}
      className={[
        'cursor-grab touch-none overflow-hidden border-ws-n-20 bg-ws-n-05 focus:outline-none active:cursor-grabbing',
        expanded
          ? 'fixed inset-0 z-50' // dự phòng khi Fullscreen API bị chặn
          : 'relative h-full w-full rounded-xl border focus-visible:ring-2 focus-visible:ring-ws-accent',
        '[&:fullscreen]:rounded-none [&:fullscreen]:border-0', // toàn màn hình thì bỏ viền/bo góc
      ].join(' ')}
      style={{
        backgroundImage: 'radial-gradient(rgba(19,54,90,0.10) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }}
    >
      <div
        className={glide ? 'transition-transform duration-500 ease-ws' : ''}
        style={{
          width,
          height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
          transformOrigin: '0 0',
        }}
      >
        <Edges
          nodes={nodes}
          onJump={(i) => {
            if (!wasDrag()) goTo(i);
          }}
        />
        {nodes.map((n) => (
          <NodeCard
            key={n.i}
            node={n}
            focused={focus === n.i}
            loaded={loaded[n.i] === true}
            register={(el) => {
              nodeEls.current[n.i] = el;
            }}
            onSelect={() => {
              if (!wasDrag()) goTo(n.i);
            }}
          />
        ))}
      </div>

      {/* HUD — không bị transform, luôn đọc được ở mọi mức zoom (nhãn trong node thì không). */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ws-n-60 backdrop-blur">
        kéo để di chuyển · cuộn để zoom · ← → đổi bước · F toàn màn hình
      </div>

      {here && (
        <div className="pointer-events-none absolute right-3 top-3 w-64 rounded-xl border border-ws-n-20 bg-white/95 p-2.5 shadow-sm backdrop-blur">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[10px] tabular-nums text-ws-n-40">
              {focus + 1}/{nodes.length}
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight text-ws-ink">
              {here.step.label}
            </span>
            {here.step.viOnly && (
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-ws-caution">
                chỉ VI
              </span>
            )}
          </div>
          <p className="mt-1 border-t border-ws-n-10 pt-1 text-[12px] leading-snug text-ws-n-60">
            <span className="font-mono text-[9px] uppercase tracking-wide text-ws-warm">
              tới đây bằng:{' '}
            </span>
            {here.step.trigger}
          </p>
          {here.step.note && (
            <p className="mt-1 text-[12px] leading-snug text-ws-body">{here.step.note}</p>
          )}
        </div>
      )}

      <div className="absolute bottom-3 left-1/2 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-xl border border-ws-n-20 bg-white/95 p-1.5 shadow-md backdrop-blur">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {nodes.map((n) => (
            <button
              key={n.i}
              type="button"
              onClick={() => goTo(n.i)}
              title={n.step.label}
              className={[
                'size-7 shrink-0 rounded-lg font-mono text-[11px] tabular-nums transition-colors duration-ws-fast ease-ws',
                focus === n.i
                  ? 'bg-ws-accent font-bold text-white'
                  : n.step.slug === null
                    ? 'border border-dashed border-ws-n-40 text-ws-n-40 hover:border-ws-accent'
                    : 'bg-ws-n-05 text-ws-n-60 hover:bg-ws-accent/10 hover:text-ws-accent',
              ].join(' ')}
            >
              {n.i + 1}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 border-l border-ws-n-20 pl-1.5">
          <HudBtn label="−" title="Thu nhỏ" onClick={() => zoomBy(1 / 1.35)} />
          <HudBtn label="+" title="Phóng to" onClick={() => zoomBy(1.35)} />
          <button
            type="button"
            onClick={() => fitAll()}
            className="rounded-lg border border-ws-n-20 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-ws-n-60 hover:border-ws-accent hover:text-ws-accent"
          >
            vừa khung
          </button>
          <button
            type="button"
            onClick={() => void toggleWide()}
            title={wide ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình (F)'}
            aria-pressed={wide}
            className={[
              'rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-wide',
              wide
                ? 'border-ws-accent bg-ws-accent text-white'
                : 'border-ws-n-20 text-ws-n-60 hover:border-ws-accent hover:text-ws-accent',
            ].join(' ')}
          >
            {wide ? '↙ thoát' : '⤢ toàn màn'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HudBtn({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="size-7 rounded-lg border border-ws-n-20 font-mono text-[13px] leading-none text-ws-n-60 hover:border-ws-accent hover:text-ws-accent"
    >
      {label}
    </button>
  );
}

/** Cạnh nối + chip trigger. Chip là NÚT: bấm là bay tới bước kế tiếp. */
function Edges({ nodes, onJump }: { nodes: FlowNode[]; onJump: (i: number) => void }) {
  return (
    <>
      <svg
        className="pointer-events-none absolute left-0 top-0 overflow-visible text-ws-n-40"
        width="100%"
        height="100%"
        aria-hidden
      >
        {nodes.slice(0, -1).map((a, i) => {
          const b = nodes[i + 1];
          if (!b) return null;
          const y = a.y + a.h / 2;
          const y2 = b.y + b.h / 2;
          const x1 = a.x + a.w;
          const x2 = b.x - 10;
          return (
            <g key={a.i} stroke="currentColor" strokeWidth={2}>
              <path
                d={`M ${x1} ${y} C ${x1 + 90} ${y}, ${x2 - 90} ${y2}, ${x2} ${y2}`}
                fill="none"
                strokeDasharray="7 6"
              />
              <polygon
                points={`${x2},${y2 - 7} ${x2 + 12},${y2} ${x2},${y2 + 7}`}
                fill="currentColor"
                stroke="none"
              />
            </g>
          );
        })}
      </svg>

      {nodes.slice(0, -1).map((a, i) => {
        const b = nodes[i + 1];
        if (!b) return null;
        const mid = (a.x + a.w + b.x) / 2;
        const y = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
        return (
          <button
            key={`t-${a.i}`}
            type="button"
            onClick={() => onJump(i + 1)}
            className="absolute z-10 w-[228px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ws-warm/60 bg-white px-3 py-2 text-left shadow-sm transition-colors duration-ws-fast ease-ws hover:border-ws-warm hover:bg-ws-caution-bg"
            style={{ left: mid, top: y }}
          >
            <span className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ws-n-40">
              <span className="text-ws-warm">▶</span> trigger
            </span>
            <span className="block text-[13px] font-medium leading-snug text-ws-body">
              {b.step.trigger}
            </span>
          </button>
        );
      })}
    </>
  );
}

function NodeCard({
  node,
  focused,
  loaded,
  register,
  onSelect,
}: {
  node: FlowNode;
  focused: boolean;
  loaded: boolean;
  register: (el: HTMLDivElement | null) => void;
  onSelect: () => void;
}) {
  const { step } = node;
  return (
    <div
      ref={register}
      data-i={node.i}
      onClick={onSelect}
      className={[
        'absolute overflow-hidden rounded-2xl border bg-white transition-shadow duration-ws-base ease-ws',
        focused ? 'border-ws-accent shadow-lg' : 'border-ws-n-20 shadow-sm',
        step.slug === null ? 'border-dashed border-ws-n-40 bg-ws-n-05' : '',
      ].join(' ')}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      <header className="flex h-8 items-center gap-2 border-b border-ws-n-10 px-2.5">
        <span
          className={[
            'grid size-5 shrink-0 place-items-center rounded font-mono text-[10px] font-bold tabular-nums',
            focused ? 'bg-ws-accent text-white' : 'bg-ws-n-10 text-ws-n-60',
          ].join(' ')}
        >
          {node.i + 1}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ws-ink">
          {step.label}
        </span>
        {step.climax && (
          <span className="shrink-0 rounded-full bg-ws-caution-bg px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-ws-caution">
            cao trào
          </span>
        )}
        {/* Màn có nhưng mới có bản tiếng Việt — với luồng khách nước ngoài, đây là đứt gãy thật. */}
        {step.viOnly && (
          <span
            title="Màn đã dựng nhưng mới có bản tiếng Việt"
            className="shrink-0 rounded-full border border-ws-caution/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-ws-caution"
          >
            chỉ VI
          </span>
        )}
        {step.slug && (
          <a
            href={`/uiworkshop/${step.slug}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 font-mono text-[10px] text-ws-ink-strong hover:underline"
          >
            ↗
          </a>
        )}
      </header>

      <div className="relative bg-white" style={{ height: node.h - 32 }}>
        {step.slug === null ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <div className="grid gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ws-n-40">
                chưa dựng
              </span>
              <span className="text-[13px] leading-snug text-ws-n-60">
                {step.note ?? step.label}
              </span>
            </div>
          </div>
        ) : loaded ? (
          <iframe
            // `step.query` cho một view phục vụ nhiều luồng với dữ liệu khác nhau (vd `?v=vinfast`).
            src={`/uiworkshop/${step.slug}${step.query ? `?${step.query}` : ''}`}
            title={step.label}
            loading="lazy"
            className={focused ? '' : 'pointer-events-none'}
            style={{
              width: node.nativeW,
              height: node.nativeH,
              border: 0,
              transform: `scale(${node.scale})`,
              transformOrigin: '0 0',
            }}
          />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="font-mono text-[10px] uppercase tracking-wide text-ws-n-40">
              đang nạp…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
