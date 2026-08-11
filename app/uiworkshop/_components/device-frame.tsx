'use client';

import { useViewport } from './viewport';

/**
 * Khung thiết bị — nhúng màn "trần" (`/uiworkshop/<slug>`, không có vỏ xưởng) qua IFRAME ở đúng
 * bề rộng, để breakpoint responsive tính theo viewport iframe (mobile THẬT, không phải khung thu
 * nhỏ). Cùng một component màn hiện ở cả hai kích thước — đúng tinh thần "một component responsive"
 * mà dev sẽ promote nguyên vẹn.
 */
export function DeviceFrame({ slug, label }: { slug: string; label: string }) {
  const { mode } = useViewport();
  const src = `/uiworkshop/${slug}`;

  const mobile = (
    <figure className="m-0 grid justify-items-center gap-1.5">
      <div className="w-[390px] overflow-hidden rounded-[2rem] border-[8px] border-ws-n-60 bg-white shadow-md">
        <iframe src={src} title={`${label} · mobile`} className="h-[760px] w-full border-0" />
      </div>
      <figcaption className="font-mono text-[10px] tracking-wide text-ws-n-40">
        390 px · mobile
      </figcaption>
    </figure>
  );

  const web = (
    <figure className="m-0 grid min-w-0 gap-1.5">
      <div className="overflow-hidden rounded-lg border border-ws-n-20 bg-white shadow-sm">
        <iframe src={src} title={`${label} · web`} className="h-[640px] w-full border-0" />
      </div>
      <figcaption className="font-mono text-[10px] tracking-wide text-ws-n-40">
        web · bề ngang khu làm việc
      </figcaption>
    </figure>
  );

  // Chỉ hai chế độ (chốt 24/07/2026 — "cả hai" đã bỏ): mỗi màn có MỘT bề mặt đúng của nó.
  return mode === 'mobile' ? <div className="flex justify-center">{mobile}</div> : web;
}
