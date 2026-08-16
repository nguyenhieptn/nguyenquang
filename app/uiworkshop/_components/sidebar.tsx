'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FLOWS, gapCount, viewChuaCoLuong } from '../_registry/flows';
import {
  FOUNDATION,
  PLANNED_REQS,
  REQ_GROUPS,
  SECTIONS,
  statusChip,
  type ReqGroup,
  type View,
} from '../_registry/outline';
import type { StoryMeta } from '../_registry/sprint';

/**
 * Sidebar UI Workshop = OUTLINE của sản phẩm, ba tầng: **BỀ MẶT → FR → view**, cộng trục thứ hai
 * là **Luồng** (hành trình). Thứ tự: Tổng quan · Luồng · Nền tảng · từng bề mặt (`SECTIONS`) · FR
 * chưa dựng. Tên bề mặt đọc từ `outline.ts` nên file này không dính nội dung của project nào.
 *
 * FR + view + ánh xạ story đến từ outline.ts (hand-authored); TRẠNG THÁI story đến từ
 * sprint-status.yaml qua prop `stories` (slug → {id, status}) nên chấm luôn khớp thực tế.
 *
 * Luật trình bày (sửa 24/07/2026 — sidebar trước đó lộn xộn):
 * 1. **Mỗi view đúng MỘT dòng.** Nhãn ngắn (outline.ts) + `truncate`; story gộp thành MỘT chấm
 *    trạng thái bên phải, chi tiết nằm ở `title` (hover) — trước đây chip story chiếm hẳn dòng thứ
 *    hai cho từng view, nhân đôi chiều cao của 40+ hàng.
 * 2. **Nhóm theo bề mặt** (chuẩn chrome khác nhau) chứ không trộn khách với CMS.
 * 3. Chiều rộng cố định, không hàng nào tràn: nhãn co được, phần đuôi (chấm) không co.
 *
 * ⚠️ FILE NÀY ĐÃ SỬA TẠI PROJECT — lệch khỏi bản kit (12/08/2026). `kit.mjs upgrade` sẽ báo drift;
 * khi ấy hoà tay, đừng ghi đè mất. Phần thêm vào là HAI DẤU NỢ, cả hai đều để lỗ hổng khỏi im lặng:
 *   · `∅` trên một view = chưa luồng nào dẫn tới nó (xem `viewChuaCoLuong`);
 *   · `~` trên một luồng = `source: null`, chưa distill vào EXPERIENCE.md § Key Flows.
 * Nếu bản kit sau này có sẵn hai dấu ấy thì bỏ phần sửa tay này đi.
 */
export function Sidebar({ stories }: { stories: Record<string, StoryMeta> }) {
  const pathname = usePathname();
  const isActive = (slug: string) => pathname === `/uiworkshop/view/${slug}`;
  const moCoi = new Set(viewChuaCoLuong().map((v) => v.slug));

  /** Gộp trạng thái nhiều story của một view thành một tông + một dòng mô tả cho tooltip. */
  function rollup(view: View) {
    const refs = (view.storySlugs ?? []).map((slug) => ({ slug, meta: stories[slug] }));
    if (refs.length === 0) return null;
    const tones = refs.map(({ meta }) => (meta ? statusChip(meta.status).tone : 'neutral'));
    const tone = tones.includes('caution')
      ? 'caution'
      : tones.every((t) => t === 'success')
        ? 'success'
        : 'neutral';
    const title = refs
      .map(({ slug, meta }) => (meta ? `${meta.id} · ${meta.status}` : slug))
      .join('\n');
    return { tone, title, count: refs.length };
  }

  function ViewRow({ view }: { view: View }) {
    const active = isActive(view.slug);
    const st = rollup(view);
    return (
      <Link
        href={`/uiworkshop/view/${view.slug}`}
        title={st ? `${view.label}\n\n${st.title}` : view.label}
        className={[
          'flex min-h-8 items-center gap-2 rounded px-2 py-1 text-[14px] leading-tight',
          active
            ? 'bg-ws-accent/10 font-semibold text-ws-accent'
            : 'text-ws-body hover:bg-ws-n-05 hover:text-ws-ink',
        ].join(' ')}
      >
        <span className="min-w-0 flex-1 truncate">{view.label}</span>
        {/* Màn KHÔNG luồng nào dẫn tới. Không phải lỗi, nhưng là thứ phải nhìn thấy: hoặc hành
            trình dẫn tới nó chưa distill, hoặc chính màn ấy thừa. Im lặng thì cả hai đều trôi. */}
        {moCoi.has(view.slug) && (
          <span
            title="Chưa luồng nào dẫn tới màn này — hoặc hành trình chưa distill, hoặc màn thừa"
            className="shrink-0 font-mono text-[11px] leading-none text-ws-caution"
          >
            ∅
          </span>
        )}
        {/* Trạng thái story — MỘT chấm, chi tiết ở tooltip (giữ hàng đúng một dòng). */}
        {st && (
          <span
            aria-hidden
            className={[
              'size-1.5 shrink-0 rounded-full',
              st.tone === 'success'
                ? 'bg-ws-success'
                : st.tone === 'caution'
                  ? 'bg-ws-caution'
                  : 'bg-ws-n-20',
            ].join(' ')}
          />
        )}
      </Link>
    );
  }

  function ReqSection({ group }: { group: ReqGroup }) {
    // Nhóm mở sẵn — outline là để QUÉT; hàng một dòng nên mở hết vẫn gọn.
    return (
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded px-2 py-1 hover:bg-ws-n-05">
          <span
            aria-hidden
            className="shrink-0 text-[11px] text-ws-n-40 transition-transform group-open:rotate-90"
          >
            ▶
          </span>
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ws-ink">
            {group.title}
          </span>
          <span
            className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-ws-n-40"
            title={`${group.fr} · ${group.epics.join(' ')}`}
          >
            {group.fr}
          </span>
        </summary>
        <div className="mb-1 ml-[9px] grid gap-px border-l border-ws-n-10 pl-1.5">
          {group.views.map((v) => (
            <ViewRow key={v.slug} view={v} />
          ))}
        </div>
      </details>
    );
  }

  return (
    <aside className="w-80 shrink-0 overflow-y-auto overflow-x-hidden border-r border-ws-n-20 bg-white">
      <nav className="grid grid-cols-1 gap-4 p-3 pb-8">
        <Link
          href="/uiworkshop"
          className={[
            'rounded px-2 py-1.5 text-[14px] font-semibold',
            pathname === '/uiworkshop'
              ? 'bg-ws-accent/10 text-ws-accent'
              : 'text-ws-ink hover:bg-ws-n-05',
          ].join(' ')}
        >
          Tổng quan
        </Link>

        {/* Trục thứ HAI: luồng (hành trình). Outline trả lời "màn thuộc yêu cầu nào";
            luồng trả lời "sau màn này là màn nào". Nguồn: EXPERIENCE.md § Key Flows.
            Project chưa distill luồng nào thì mục này tự ẩn (không để đầu mục rỗng). */}
        {FLOWS.length > 0 && (
          <section className="grid gap-0.5">
            <SectionHead label="Luồng" note="hành trình có nhân vật" count={FLOWS.length} />
            {FLOWS.map((f) => {
              const active = pathname === `/uiworkshop/flow/${f.id}`;
              const gaps = gapCount(f);
              return (
                <Link
                  key={f.id}
                  href={`/uiworkshop/flow/${f.id}`}
                  title={`${f.title}\n${f.persona}\n${f.steps.length} bước${gaps ? ` · ${gaps} chưa có màn` : ''}${
                    f.source === null ? '\n\n~ CHƯA DISTILL vào EXPERIENCE.md § Key Flows' : ''
                  }`}
                  className={[
                    'flex min-h-8 items-center gap-2 rounded px-2 py-1 text-[14px] leading-tight',
                    active
                      ? 'bg-ws-accent/10 font-semibold text-ws-accent'
                      : 'text-ws-body hover:bg-ws-n-05 hover:text-ws-ink',
                  ].join(' ')}
                >
                  <span className="min-w-0 flex-1 truncate">{f.title}</span>
                  {/* Luồng SUY RA khác luồng người duyệt KỂ. Không đánh dấu thì hai thứ trông y
                      hệt nhau trên sidebar, mà chỉ cái thứ hai đáng tin. */}
                  {f.source === null && (
                    <span
                      title="Chưa distill vào EXPERIENCE.md § Key Flows — nợ tài liệu"
                      className="shrink-0 font-mono text-[11px] leading-none text-ws-caution"
                    >
                      ~
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-ws-n-40">
                    {f.steps.length}
                  </span>
                  {gaps > 0 && (
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-ws-caution" />
                  )}
                </Link>
              );
            })}
          </section>
        )}

        <section className="grid gap-0.5">
          <SectionHead label="Nền tảng" count={FOUNDATION.length} />
          {FOUNDATION.map((v) => (
            <ViewRow key={v.slug} view={v} />
          ))}
        </section>

        {SECTIONS.map((s) => {
          const groups = REQ_GROUPS.filter((g) => g.section === s.key);
          if (groups.length === 0) return null;
          const views = groups.reduce((n, g) => n + g.views.length, 0);
          return (
            <section key={s.key} className="grid gap-0.5">
              <SectionHead label={s.label} note={s.note} count={views} />
              {groups.map((g, i) => (
                <ReqSection key={`${s.key}-${g.fr}-${i}`} group={g} />
              ))}
            </section>
          );
        })}

        <section className="grid gap-0.5">
          <details>
            <summary className="cursor-pointer list-none px-2 py-1 font-mono text-[12px] uppercase tracking-[0.12em] text-ws-n-40 hover:text-ws-ink-strong">
              FR chưa dựng ({PLANNED_REQS.length})
            </summary>
            <div className="mt-0.5 ml-[9px] grid gap-px border-l border-ws-n-10 pl-1.5">
              {PLANNED_REQS.map((r) => (
                <div
                  key={r.fr + r.title}
                  className="flex min-h-8 items-center gap-2 px-2 py-1 text-[14px] leading-tight text-ws-n-40"
                  title={`${r.fr} · ${r.epic}`}
                >
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  <span className="shrink-0 font-mono text-[11px]">{r.fr}</span>
                </div>
              ))}
            </div>
          </details>
        </section>
      </nav>
    </aside>
  );
}

/** Đầu mục bề mặt — nhãn mono + ghi chú chuẩn chrome + đếm view. */
function SectionHead({ label, note, count }: { label: string; note?: string; count: number }) {
  return (
    <h3 className="flex items-baseline gap-1.5 px-2 pb-0.5 pt-1">
      <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-ws-ink-strong">
        {label}
      </span>
      {note && <span className="min-w-0 flex-1 truncate text-[12px] text-ws-n-40">{note}</span>}
      <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-ws-n-40">
        {count}
      </span>
    </h3>
  );
}
