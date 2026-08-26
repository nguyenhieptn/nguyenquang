/**
 * `/admin/cay` — canvas gia phả của bàn làm việc (story 5-2).
 *
 * Đơn vị của màn này là **vùng lân cận quanh một NEO**, không phải cả cây. Cây cả họ vẽ ra thì
 * không đọc được và không thao tác được; ban tu phả làm việc với MỘT người và những người quanh
 * họ — có ai gọi báo một cụ vừa mất thì mở ra đúng chỗ cụ ấy đứng.
 *
 * ── Neo nằm ở URL, không nằm trong state ──────────────────────────────────────────────────
 * `?neo=<personId>` — ba lý do, không phải một:
 *   1. Ô tìm trên thanh trên phải dời neo được từ BẤT KỲ màn nào của `/admin`. Đang ở Nạp khung
 *      mà tìm một người thì phải sang được đây với người ấy làm tâm. Context không làm được việc
 *      đó; URL thì làm được mà không cần thêm gì.
 *   2. Nút Back của trình duyệt tự nhiên trở thành "về tâm trước" — không phải dựng lịch sử riêng.
 *   3. Dán được đường dẫn cho người khác: "mở chỗ này ra xem giúp tôi".
 *
 * `<h1>` do `app/admin/layout.tsx` dựng, trang KHÔNG tự dựng. Bề rộng cũng của layout.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { tieuDeThe } from '@/components/admin/man-admin';
import type { NutCanvas } from '@/components/admin/khung-cay-admin';
import { listPendingAttachments, resolveSession } from '@/core/identity';
import { getClanOverview, getNeighborhood } from '@/core/tree';
import { CayClient } from './cay-client';

export const metadata: Metadata = { title: tieuDeThe('cay') };

// AD-23: cấu trúc cây tính lúc đọc và đổi theo từng mutation — không cache.
export const dynamic = 'force-dynamic';

const BAN_KINH_MAC_DINH = 2;
const BAN_KINH_TOI_DA = 6;

function doBanKinh(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > BAN_KINH_TOI_DA) return BAN_KINH_MAC_DINH;
  return n;
}

/** Màn rỗng CÓ LỜI — phả chưa có ai thì đó là một trạng thái, không phải một lỗi. */
function ChuaCoGi({ loi }: { loi: string }) {
  return (
    <>
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">{loi}</p>
      <Link
        href="/admin/nap-khung"
        className="mt-5 inline-flex min-h-11 items-center text-[17px] underline underline-offset-4"
      >
        Nạp khung dòng họ từ một tệp CSV
      </Link>
    </>
  );
}

export default async function CayPage({
  searchParams,
}: {
  searchParams: Promise<{
    neo?: string | string[];
    'ban-kinh'?: string | string[];
    them?: string | string[];
    /** Người vừa bị tách khỏi neo bằng một lượt gỡ quan hệ — xem § Giữ người vừa bị tách. */
    giu?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const neoParam = Array.isArray(sp.neo) ? sp.neo[0] : sp.neo;
  const banKinh = doBanKinh(Array.isArray(sp['ban-kinh']) ? sp['ban-kinh'][0] : sp['ban-kinh']);

  /**
   * Neo mặc định: node của CHÍNH người đang đăng nhập. Bàn tu phả mở màn cây ra thì thứ họ muốn
   * thấy trước tiên là chỗ mình đứng trong phả. Chưa gắn node thì rơi về gốc của mảnh chính —
   * vẫn là một chỗ đứng thật, chỉ không phải chỗ của họ.
   */
  let neoId = neoParam;
  if (!neoId) {
    const phien = await resolveSession();
    neoId = phien?.personId ?? undefined;
  }
  if (!neoId) {
    const toanCanh = await getClanOverview();
    neoId = toanCanh.ok ? (toanCanh.value.mainFragment?.rootPersonId ?? undefined) : undefined;
  }
  if (!neoId) {
    return (
      <ChuaCoGi loi="Phả chưa có ai, nên chưa có cây để mở. Nạp khung xong thì màn này tự có người." />
    );
  }

  const giuParam = Array.isArray(sp.giu) ? sp.giu[0] : sp.giu;

  const vung = await getNeighborhood(neoId, banKinh);
  if (!vung.ok) {
    // `not-found` ở đây thường là một đường dẫn cũ dán lại sau khi người ấy đã bị gộp hoặc gỡ.
    return (
      <ChuaCoGi
        loi={
          vung.error.code === 'not-found'
            ? 'Không thấy người này trong phả — đường dẫn có thể đã cũ.'
            : vung.error.message
        }
      />
    );
  }

  /**
   * Ai đang xin nhận một chỗ (FR-64, story 5-5).
   *
   * Đọc hỏng hoặc không đủ quyền thì **cây vẫn vẽ**, chỉ vắng dấu — một màn hỏng hẳn vì không đọc
   * được một thứ phụ là cái giá quá đắt. `listPendingAttachments` trả `forbidden` cho vai không
   * duyệt được, và đó là trạng thái bình thường, không phải trục trặc.
   */
  const xin = await listPendingAttachments();
  const xinTheoNguoi = new Map(
    (xin.ok ? xin.value : []).map((r) => [
      r.personId,
      { attachmentId: r.attachmentId, luc: new Date(r.requestedAt).toLocaleDateString('vi-VN') },
    ]),
  );

  /**
   * ── Giữ người vừa bị tách (AC 23, chốt 26/08/2026) ────────────────────────────────────────
   *
   * Vùng lân cận đi THEO CẠNH. Gỡ đúng cạnh duy nhất buộc một người vào neo thì họ rơi khỏi bán
   * kính và biến mất khỏi canvas ngay trước mắt người vừa gỡ — trong một hệ không có nút hoàn
   * tác. Bán kính tính đúng; cái sai là để người vận hành mất dấu thứ họ vừa động vào.
   *
   * Nên `?giu=` giữ họ lại đúng một lượt, và dữ liệu thẻ lấy từ CHÍNH `getNeighborhood` với họ
   * làm neo — không bịa một thẻ rỗng, không đoán đời và chi. Bán kính 1 vì thứ cần là chỗ đứng
   * mới của họ, không phải cả nhánh.
   */
  let nutGiu: (typeof vung.value.nodes)[number] | null = null;
  if (giuParam && !vung.value.nodes.some((n) => n.person.personId === giuParam)) {
    const vungGiu = await getNeighborhood(giuParam, 1);
    if (vungGiu.ok) {
      nutGiu =
        vungGiu.value.nodes.find((n) => n.person.personId === vungGiu.value.anchorPersonId) ?? null;
    }
  }

  // Dịch sang hình dạng của tầng component. `components/` không import `@/core/*`
  // (`docs/build-contract.md § Phân tầng`), nên chỗ dịch nằm ở đây, một lần, tường minh.
  const nut: NutCanvas[] = [...vung.value.nodes, ...(nutGiu ? [nutGiu] : [])].map((n) => ({
    id: n.person.personId,
    // Người được GIỮ đứng như gốc mảnh: cha của họ (nếu có) nằm ngoài vùng đang bày, và một
    // `chaId` trỏ vào node không có trên hình là đúng con bug "mất cạnh im lặng" của 5-2.
    chaId: nutGiu && n.person.personId === nutGiu.person.personId ? null : n.parentNodeId,
    the: {
      hoTen: n.person.fullName,
      // CẢ danh sách, không chỉ `partners[0]`. Người vợ thứ hai không có node riêng (vợ chồng
      // chung một thẻ — luật 5-2), nên cắt ở đây là cắt họ khỏi canvas hoàn toàn.
      banDoi: n.partners.map((p) => ({ ten: p.fullName })),
      doi: n.person.generation,
      chi: n.person.branchCode,
      laGocManh: n.isFragmentRoot,
      tinCay: n.person.confidence,
      tonNghi: n.person.tier === 'tentative',
      coNguoiXin: xinTheoNguoi.has(n.person.personId),
    },
  }));

  return (
    <CayClient
      // Dời tâm ⇒ dựng lại cả khối, nên người đang chọn tự về rỗng. Rẻ hơn một effect canh neo,
      // và không có đường quên.
      key={vung.value.anchorPersonId}
      neoId={vung.value.anchorPersonId}
      banKinh={vung.value.radius}
      canKiet={vung.value.exhausted}
      nut={nut}
      // Nút "Thêm người vào phả" ở thanh việc đưa sang đây kèm `?them=roi`. Chrome không nói
      // chuyện được với trang bằng cách nào khác — cùng lý do neo nằm ở URL.
      moThemNgay={(Array.isArray(sp.them) ? sp.them[0] : sp.them) === 'roi'}
      xinVaoPha={Object.fromEntries(xinTheoNguoi)}
    />
  );
}
