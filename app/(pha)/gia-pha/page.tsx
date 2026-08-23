/**
 * /gia-pha — ĐIỂM VÀO của mục "Gia phả" là TẦNG 2, không phải tầng 1.
 *
 * FR-15 đòi "mở lên thấy CHÍNH MÌNH trước, rồi đi ngược lên" — nên mở ra là chi CỦA MÌNH, đời
 * của mình và đời ngay trên bung sẵn (core trả `viewerGeneration`, ManChi lo phần bung). Mở
 * thẳng vào tầng 1 là bắt người dùng tự mò xuống tìm mình, đúng cái PRD gạch đi.
 *
 * Khách và tài khoản chưa gắn chỗ (FR-11: xem không cần đăng ký): thấy chi đầu của nhánh chính,
 * kèm lời mời đi tìm chỗ của mình — đường ghi dẫn về luồng nhận chỗ, không phải màn lỗi.
 *
 * AD-24: core tự đọc phiên — trang không truyền danh tính vào lời gọi đọc cây.
 */
import { redirect } from 'next/navigation';
import { resolveViewer } from '@/core/identity';
import { getAncestryPath, getBranchView, getClanOverview } from '@/core/tree';
import { ManChi } from './_chia-se/man-chi';
import { PhaTrong } from './_chia-se/pha-trong';

export default async function Page() {
  const viewer = await resolveViewer();
  // Không phiên và cũng không có phả nào mở cho khách — cùng nghĩa với 'unauthenticated'.
  if (!viewer) redirect('/dang-nhap');

  if (viewer.personId) {
    const [chi, duong] = await Promise.all([
      getBranchView(viewer.personId),
      getAncestryPath(viewer.personId),
    ]);
    if (chi.ok) {
      return (
        <ManChi
          chi={chi.value}
          minhId={viewer.personId}
          duongVeGoc={duong.ok ? duong.value.steps.map((s) => s.personId) : []}
        />
      );
    }
    if (chi.error.code === 'unauthenticated') redirect('/dang-nhap');
    // 'invalid': có chỗ trong phả nhưng không nằm trên dòng huyết thống nào (vd. kết hôn vào
    // họ) — core chưa có đường tìm chi theo người bạn đời. Rơi về chi đầu, KHÔNG banner mời
    // tìm chỗ: chỗ đã có rồi. TODO(core/tree): chi chứa mình cho người kết hôn vào họ.
  }

  const tongQuan = await getClanOverview();
  if (!tongQuan.ok) {
    if (tongQuan.error.code === 'unauthenticated') redirect('/dang-nhap');
    // 'forbidden' → vắng lặng, không băng-rôn lỗi (build contract § Result handling).
    return <PhaTrong />;
  }
  const { mainFragment, branches } = tongQuan.value;
  if (!mainFragment) return <PhaTrong />;

  const dauChi = branches[0]?.headPersonId ?? mainFragment.rootPersonId;
  const chi = await getBranchView(dauChi);
  if (!chi.ok) return <PhaTrong />;
  return <ManChi chi={chi.value} minhId={viewer.personId} moiTimCho={!viewer.personId} />;
}
