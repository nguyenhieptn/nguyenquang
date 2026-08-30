/**
 * /gia-pha — ĐIỂM VÀO của mục "Gia phả".
 *
 * ── Đã gắn chỗ: PHẢ QUANH MÌNH (story 6-10) ─────────────────────────────────────────────
 * FR-15 đòi "mở lên thấy CHÍNH MÌNH trước, rồi đi ngược lên". Từ 29/08/2026 đó là nghĩa đen:
 * mình ở giữa canvas, cha mẹ trên, vợ chồng chung thẻ, con dưới; bấm một người là phiếu mở
 * bên cạnh, ghi thêm được tại chỗ — không duyệt được, duyệt là việc ở `/admin`.
 * `?neo=` dời tâm sang người khác, `?ban-kinh=` nới vùng (1–6), cùng quy ước với `/admin/cay`.
 *
 * ── Khách và tài khoản chưa gắn chỗ: CHI ĐẦU + lời mời tìm chỗ (FR-11) ──────────────────
 * Không có "quanh mình" khi chưa có mình. Thấy chi đầu của nhánh chính, kèm lời mời đi tìm chỗ
 * của mình — đường ghi dẫn về luồng nhận chỗ, không phải màn lỗi.
 *
 * AD-24: core tự đọc phiên — trang không truyền danh tính vào lời gọi đọc cây.
 */
import { redirect } from 'next/navigation';
import { tenPhaTuThongTin } from '@/components/pha/thanh-dieu-huong';
import { coBanLamViec } from '@/lib/vai-quan-tri';
import { getClanInfo, resolveViewer } from '@/core/identity';
import { getBranchView, getClanOverview, getNeighborhood } from '@/core/tree';
import { ManChi } from './_chia-se/man-chi';
import { PhaTrong } from './_chia-se/pha-trong';
import { PhaQuanhMinh } from './_quanh-minh/pha-quanh-minh';

// AD-23: cấu trúc cây tính lúc đọc và đổi theo từng mutation — không cache.
export const dynamic = 'force-dynamic';

const BAN_KINH_MAC_DINH = 2;
const BAN_KINH_TOI_DA = 6;

function doBanKinh(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > BAN_KINH_TOI_DA) return BAN_KINH_MAC_DINH;
  return n;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ neo?: string | string[]; 'ban-kinh'?: string | string[] }>;
}) {
  const viewer = await resolveViewer();
  // Không phiên và cũng không có phả nào mở cho khách — cùng nghĩa với 'unauthenticated'.
  if (!viewer) redirect('/dang-nhap');

  // AD-14: tên phả đọc từ `clan.settings` qua core/identity, truyền xuống component câm.
  const thongTinPha = await getClanInfo();
  const tenPha = tenPhaTuThongTin(thongTinPha.ok ? thongTinPha.value : null);

  if (viewer.personId) {
    const sp = await searchParams;
    const neoParam = Array.isArray(sp.neo) ? sp.neo[0] : sp.neo;
    const banKinh = doBanKinh(Array.isArray(sp['ban-kinh']) ? sp['ban-kinh'][0] : sp['ban-kinh']);
    const banLamViec = await coBanLamViec();

    let vung = await getNeighborhood(neoParam || viewer.personId, banKinh);
    let loiNeo: string | undefined;
    if (!vung.ok && neoParam) {
      // `?neo=` cũ dán lại sau khi người ấy đã được gộp hoặc gỡ: về mình, và nói vì sao.
      loiNeo = 'Không thấy người ấy trong phả — đường dẫn có thể đã cũ. Đang mở lại quanh mình.';
      vung = await getNeighborhood(viewer.personId, BAN_KINH_MAC_DINH);
    }
    if (vung.ok) {
      return (
        <PhaQuanhMinh
          vung={vung.value}
          minhId={viewer.personId}
          tenPha={tenPha}
          banLamViec={banLamViec}
          loiNeo={loiNeo}
        />
      );
    }
    if (vung.error.code === 'unauthenticated') redirect('/dang-nhap');
    // Chỗ của mình không còn trong phả (đã gộp/gỡ) — rơi về chi đầu như người chưa gắn.
  }

  const tongQuan = await getClanOverview();
  if (!tongQuan.ok) {
    if (tongQuan.error.code === 'unauthenticated') redirect('/dang-nhap');
    // 'forbidden' → vắng lặng, không băng-rôn lỗi (build contract § Result handling).
    return <PhaTrong tenPha={tenPha} />;
  }
  const { mainFragment, branches } = tongQuan.value;
  if (!mainFragment) return <PhaTrong tenPha={tenPha} />;

  const dauChi = branches[0]?.headPersonId ?? mainFragment.rootPersonId;
  const chi = await getBranchView(dauChi);
  if (!chi.ok) return <PhaTrong tenPha={tenPha} />;
  return (
    <ManChi chi={chi.value} minhId={viewer.personId} moiTimCho={!viewer.personId} tenPha={tenPha} />
  );
}
