/**
 * /gia-pha/chi/[id] — TẦNG 2 theo chi, mở từ tầng 1 (Luồng 3 bước 3: chạm một khối chi khác).
 *
 * `[id]` là người đứng đầu chi (headPersonId từ ClanOverview). Core tự chuẩn hoá: đưa id của
 * BẤT KỲ người nào trên dòng huyết thống thì vẫn ra đúng chi chứa người ấy — nên đường dẫn chia
 * sẻ ở buổi họp họ không dễ gãy.
 */
import { notFound, redirect } from 'next/navigation';
import { tenPhaTuThongTin } from '@/components/pha/thanh-dieu-huong';
import { getClanInfo, resolveViewer } from '@/core/identity';
import { getAncestryPath, getBranchView } from '@/core/tree';
import { ManChi } from '../../_chia-se/man-chi';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await resolveViewer();
  if (!viewer) redirect('/dang-nhap');

  const chi = await getBranchView(id);
  if (!chi.ok) {
    if (chi.error.code === 'unauthenticated') redirect('/dang-nhap');
    // 'forbidden' → vắng lặng như không tồn tại; 'not-found'/'invalid' → cũng vậy.
    notFound();
  }

  // Nhánh son FR-13: đường huyết thống của CHÍNH người xem — chỉ hiện khi có chỗ trong phả.
  let duongVeGoc: string[] = [];
  if (viewer.personId) {
    const duong = await getAncestryPath(viewer.personId);
    if (duong.ok) duongVeGoc = duong.value.steps.map((s) => s.personId);
  }

  // AD-14: tên phả đọc từ `clan.settings` qua core/identity, truyền xuống component câm.
  const thongTinPha = await getClanInfo();
  return (
    <ManChi
      chi={chi.value}
      minhId={viewer.personId}
      duongVeGoc={duongVeGoc}
      tenPha={tenPhaTuThongTin(thongTinPha.ok ? thongTinPha.value : null)}
    />
  );
}
