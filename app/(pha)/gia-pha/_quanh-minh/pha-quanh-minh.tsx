/**
 * PHẢ QUANH MÌNH — màn của người trong họ ĐÃ nhận chỗ (story 6-10). Server component: đọc vùng
 * lân cận qua core, dịch sang hình của tầng component, rồi giao cho `QuanhMinhClient`.
 *
 * ── Vì sao điểm vào của mục Gia phả đổi từ "chi của mình" sang "quanh mình" ──────────────
 * FR-15: *"mở lên thấy chính mình trước, rồi đi ngược lên"*. Chi của mình (tầng 2) bày cả chi,
 * mình là một dòng trong đó. Quanh mình đặt mình ở GIỮA, cha mẹ trên, vợ chồng chung thẻ, con
 * dưới — và bấm một người là phiếu của họ mở ngay bên cạnh, ghi thêm được tại chỗ. Ba tầng cũ
 * vẫn còn nguyên làm lối khám phá (cả tộc · một chi · đường về cụ).
 *
 * Yêu cầu chủ dự án 29/08/2026: *"với user login — frontend view cây gia phả cũng sẽ cần cấu
 * trúc như cây gia phả + sidebar như trong bàn làm việc, khác là thành viên login này chỉ nhìn
 * được gia phả các node liên quan tới họ. Họ cũng có thể thêm node, sửa thông tin, tuy nhiên
 * không duyệt được. Quản lý của gia phả mới có thể duyệt."*
 *
 * "Chỉ nhìn được các node liên quan tới họ" = vùng lân cận quanh một NEO (`getNeighborhood`, đi
 * theo cạnh máu + hôn nhân), và mỗi thẻ đã qua bán kính riêng tư của core (AD-13/AD-21): người
 * sống ngoài ba bậc chỉ tên + chỗ đứng + năm sinh, người được giữ kín thành "Một người trong họ".
 * Trang không lọc thêm gì — cái ngoài bán kính không rời server.
 *
 * AD-24: core tự đọc phiên. AD-23: cấu trúc tính lúc đọc, không cache.
 */
import Link from 'next/link';
import type { NutCanvas } from '@/components/admin/khung-cay-admin';
import { KHUNG, RONG } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';
import type { Neighborhood } from '@/core/tree';
import { tenChi } from '../_chia-se/chuyen-doi';
import { QuanhMinhClient } from './quanh-minh-client';

export function PhaQuanhMinh({
  vung,
  minhId,
  tenPha,
  banLamViec,
  loiNeo,
  moPhieuNgay,
}: {
  vung: Neighborhood;
  minhId: string | null;
  tenPha?: string;
  banLamViec: boolean;
  /** Một câu khi `?neo=` trỏ vào người không thấy — về mình, và nói vì sao. */
  loiNeo?: string;
  /** `?phieu=mo` — vừa thêm người xong, điện thoại mở sẵn tấm phiếu của neo. */
  moPhieuNgay: boolean;
}) {
  // Dịch sang hình dạng của tầng component — một lần, tường minh (`build-contract § Phân tầng`).
  const nut: NutCanvas[] = vung.nodes.map((n) => ({
    id: n.person.personId,
    chaId: n.parentNodeId,
    the: {
      hoTen: n.person.fullName,
      banDoi: n.partners.map((p) => ({ ten: p.fullName })),
      doi: n.person.generation,
      // Bề mặt A gọi chi bằng TÊN — "chi Hai", không phải "chi 2" (`chuyen-doi.ts § tenChi`).
      chi: n.person.branchCode ? tenChi(n.person.branchCode).replace(/^chi /, '') : null,
      laGocManh: n.isFragmentRoot,
      tinCay: n.person.confidence,
      tonNghi: n.person.tier === 'tentative',
    },
  }));
  const neo = vung.nodes.find((n) => n.person.personId === vung.anchorPersonId);
  const tenNeo = neo?.person.fullName ?? '';
  const soNguoi = vung.nodes.reduce((s, n) => s + 1 + n.partners.length, 0);
  const laMinh = vung.anchorPersonId === minhId;

  return (
    <>
      <main className="flex-1 pb-28 pt-7 md:pb-4 md:pt-[5.5rem]">
        <div className={KHUNG}>
          {/* ĐẦU TRANG MỘT HÀNG trên máy — cùng nếp `man-chi.tsx`: chiều dọc ở đó là của cây. */}
          <div className="md:flex md:items-center md:gap-4 md:border-b md:border-border md:pb-2.5">
            <Link
              href="/gia-pha/ca-toc"
              className="inline-flex min-h-11 shrink-0 items-center text-[15px] text-muted-foreground underline underline-offset-4"
            >
              ← Xem cả tộc
            </Link>
            <div className="md:flex md:min-w-0 md:flex-1 md:items-baseline md:gap-3">
              <h1 className="mt-2 font-[family-name:var(--font-pha)] text-[23px] md:mt-0 md:shrink-0">
                {laMinh ? 'Phả quanh mình' : `Quanh ${tenNeo}`}
              </h1>
              <p className="mt-1 truncate text-[15px] text-muted-foreground md:mt-0">
                {soNguoi} người trong vòng {vung.radius} bậc
                {laMinh ? '' : ` · ${tenNeo} ở giữa`}
              </p>
            </div>
            <Link
              href="/gia-pha/duong-cua-toi"
              className="hidden shrink-0 rounded-md border border-input px-4 py-2.5 text-[17px] md:block"
            >
              Đường về cụ
            </Link>
          </div>

          {loiNeo ? (
            <p className="mt-3 border-l-4 border-destructive bg-canh-bao-nen px-3 py-2 text-[15px]">
              {loiNeo}
            </p>
          ) : null}
        </div>

        <div className={`${RONG} mt-3`}>
          <QuanhMinhClient
            key={vung.anchorPersonId}
            neoId={vung.anchorPersonId}
            banKinh={vung.radius}
            canKiet={vung.exhausted}
            nut={nut}
            minhId={minhId}
            moPhieuNgay={moPhieuNgay}
          />
          <p className="mt-1.5 hidden max-w-3xl text-[15px] text-muted-foreground md:block">
            Kéo để di chuyển · chụm hoặc dùng nút + − để phóng to. Chạm một người để mở phiếu bên
            phải; viền son là người đang ở giữa.
          </p>
          <Link
            href="/gia-pha/duong-cua-toi"
            className="mt-5 block rounded-md border border-input px-4 py-3.5 text-center text-[17px] md:hidden"
          >
            Đường về cụ
          </Link>
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" tenPha={tenPha} banLamViec={banLamViec} />
    </>
  );
}
