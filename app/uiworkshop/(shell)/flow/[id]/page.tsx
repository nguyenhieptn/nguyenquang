import { notFound } from 'next/navigation';
import { FlowMap } from '../../../_components/flow-map';
import { FLOWS, flowById, gapCount, viOnlyCount } from '../../../_registry/flows';

/**
 * Trang một LUỒNG — bản đồ hành trình zoom/pan, node là màn thật, cạnh mang chip trigger.
 * Trục "luồng" là trục thứ hai của xưởng, bên cạnh trục "bề mặt → FR → view" ở outline.
 * Nguồn hành trình: `EXPERIENCE.md § Key Flows` (xem `_registry/flows.ts`).
 */
export function generateStaticParams() {
  return FLOWS.map((f) => ({ id: f.id }));
}

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flow = flowById(id);
  if (!flow) notFound();

  const gaps = gapCount(flow);
  const viOnly = viOnlyCount(flow);

  return (
    /* `grid-cols-1`: grid không khai cột thì cột ngầm là `max-content` → canvas ~6000px của bản đồ
       kéo giãn cả khu làm việc (đúng cái bẫy đã trả giá ở cap-radio). */
    <div className="grid grid-cols-1 gap-3">
      <header className="grid gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-lg font-bold tracking-tight text-ws-ink">{flow.title}</h1>
          <span className="font-mono text-[11px] tabular-nums text-ws-n-40">
            {flow.steps.length} bước
          </span>
          {gaps > 0 && (
            <span className="rounded-full bg-ws-caution-bg px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ws-caution">
              {gaps} bước chưa có màn
            </span>
          )}
          {viOnly > 0 && (
            <span
              title="Màn đã dựng nhưng mới có bản tiếng Việt — việc phải làm trước khi đón đoàn thật"
              className="rounded-full border border-ws-caution/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ws-caution"
            >
              {viOnly} bước mới có bản VI
            </span>
          )}
        </div>
        <p className="text-sm text-ws-body">
          <strong>{flow.persona}</strong>
          {' · '}
          {flow.source ? (
            <span className="text-ws-n-60">{flow.source}</span>
          ) : (
            <span className="text-ws-caution">
              chưa có trong EXPERIENCE.md § Key Flows — cần distill ngược vào spine
            </span>
          )}
        </p>
      </header>

      {/* Bản đồ ăn hết chiều cao còn lại của khu làm việc (trừ thanh trên + padding + tiêu đề). */}
      <div className="h-[calc(100dvh-11rem)] min-h-[420px] min-w-0">
        <FlowMap key={flow.id} flow={flow} />
      </div>
    </div>
  );
}
