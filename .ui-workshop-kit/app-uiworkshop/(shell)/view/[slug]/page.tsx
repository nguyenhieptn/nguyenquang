import { notFound } from 'next/navigation';
import { DeviceFrame } from '../../../_components/device-frame';
import { FOUNDATION, REQ_GROUPS } from '../../../_registry/outline';

/** Nhãn của một view theo slug — tra trong outline (FOUNDATION + mọi REQ_GROUPS). */
function findLabel(slug: string): string | undefined {
  const all = [...FOUNDATION, ...REQ_GROUPS.flatMap((g) => g.views)];
  return all.find((v) => v.slug === slug)?.label;
}

/**
 * Trình xem một màn — nhúng bản trần qua DeviceFrame ở khung Mobile hoặc Web (lựa chọn được nhớ
 * theo từng view, xem `_components/viewport.tsx`). Slug phải là một
 * view đã đăng ký trong outline; lạ → 404 (tránh iframe trỏ vào route rác).
 */
export default async function ViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = findLabel(slug);
  if (!label) notFound();

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight text-ws-ink">{label}</h1>
        <a
          href={`/uiworkshop/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 font-mono text-[11px] tracking-wide text-ws-ink-strong hover:underline"
        >
          mở toàn trang ↗
        </a>
      </div>
      <DeviceFrame slug={slug} label={label} />
    </div>
  );
}
