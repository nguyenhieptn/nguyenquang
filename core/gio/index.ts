/**
 * core/gio — lịch giỗ (FR-41, story 7-5). Bề mặt cho adapter (AD-24): core tự đọc phiên.
 * Khách vãng lai xem được: giỗ là của người đã khuất, và người đã khuất là 'full' với mọi người.
 */
import { err, type Result } from '@/core/types';
import { resolveViewer } from '@/core/identity/session';
import { withClanContext } from '@/db';
import { listGioSapToiOps, type GioSapToi } from './ops';

export type { GioSapToi } from './ops';

/** Giỗ trong `soNgay` ngày tới (kể cả hôm nay), gần nhất trước. */
export async function listGioSapToi(soNgay = 365): Promise<Result<GioSapToi[]>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => listGioSapToiOps(tx, viewer, { soNgay }));
}
