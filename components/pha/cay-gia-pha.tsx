'use client';

/**
 * CÂY NGƯỜI — dùng cho TẦNG 2 (một chi) trên màn rộng.
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Responsive & Platform — cây vẽ từ TRÊN XUỐNG
 *   · EXPERIENCE.md § Accessibility Floor (sàn 17px, không mã hoá chỉ bằng màu)
 *   · DESIGN.md § Components — Node người, § Do's and Don'ts (cấm làm mờ tồn nghi)
 *
 * ── VÌ SAO TỪ TRÊN XUỐNG ───────────────────────────────────────────────────────────────────
 * Trái-sang-phải là hướng đọc của một BẢNG. Trên phả, XUỐNG là đi về phía sau — hướng đọc tự nó
 * mang nghĩa. Xem EXPERIENCE.md § Responsive, sửa 11/08/2026.
 *
 * ── PROMOTE 22/08/2026 — thẻ đổi theo dữ liệu THẬT của core/tree ────────────────────────────
 * Prototype nuôi thẻ bằng mock (`gioiTinh`, `namSinh`, `huy`…). Core trả `PersonCard` đã lọc
 * bán kính riêng tư (AD-13): năm tháng về dưới dạng MỘT chuỗi hiển thị (`lifespan`), tầng và
 * mức tin cậy tách đôi (tier ⇒ chất liệu tồn nghi, confidence ⇒ chip), và không có giới tính
 * nên nhãn bạn đời là "vợ/chồng" chung. Component này KHÔNG import core — trang server ánh xạ
 * PersonCard → NguoiTrenCay rồi truyền xuống, để thẻ vẫn là client thuần không kéo theo db.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import {
  KhungCay,
  xepCay,
  ChamTinCay,
  lopThe,
  vienTonNghi,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type MucTinCayCay,
} from './khung-cay';

export type NguoiTrenCay = {
  id: string;
  hoTen: string;
  /** Chuỗi hiển thị từ core — "1941–2019" / "sinh 1985" / "" (FR-37: người sống chỉ NĂM). */
  doiSong: string;
  /** Chip ba mức (FR-2). */
  tinCay: MucTinCayCay;
  /** Tầng tồn nghi (FR-3) ⇒ chất liệu nét đứt + vân giấy. KHÁC với chip `tinCay`. */
  tonNghi: boolean;
  /** Chạm → mở trang một người (EXPERIENCE § Node người). Không có thì thẻ trơ. */
  href?: string;
  /** Dòng ghi công FR-39 — đã định dạng sẵn ở server. */
  nguoiThem?: string;
  ngayThem?: string;
};

export type CapCay = {
  nguoi: NguoiTrenCay;
  /** Vợ/chồng — hiện TRONG cùng một thẻ, không phải node riêng. Core cho phép nhiều hơn một. */
  banDoi?: NguoiTrenCay[];
  chaId: string | null;
  /** Dòng phụ do màn quyết định, vd "đời 3". */
  moTa?: string;
};

const RONG = 264;
const HO_NGANG = 24;
const CAO_HANG = 210;

function DongDoiSong({ n }: { n: NguoiTrenCay }) {
  // Chuỗi rỗng thì KHÔNG vẽ gì: ngoài bán kính riêng tư, năm tháng vắng mặt như không tồn tại
  // (EXPERIENCE § Accessibility Floor — phần bị ẩn không phải ô bị che).
  if (!n.doiSong) return null;
  return <p className="mt-0.5 text-[15px] text-muted-foreground">{n.doiSong}</p>;
}

type DuLieuThe = { cap: CapCay; laMinh?: boolean; tren?: boolean };

function TheNguoi({ data }: NodeProps<Node<DuLieuThe>>) {
  const { cap, laMinh, tren } = data;
  const { nguoi: n, banDoi = [], moTa } = cap;
  const tonNghi = n.tonNghi;

  const ruot = (
    <>
      <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
        {n.hoTen}
        {laMinh && <span className="ml-2 text-[15px] font-semibold text-primary">mình</span>}
      </p>
      {moTa && <p className="mt-0.5 text-[15px] text-muted-foreground">{moTa}</p>}
      <DongDoiSong n={n} />

      {/* VỢ/CHỒNG trong cùng một thẻ. Trong phả, hai người đứng chung một ô và con cái treo dưới
          cả hai — tách ra thành node riêng là làm người bạn đời biến mất khỏi nhánh. */}
      {banDoi.map((b) => (
        <div key={b.id} className="mt-2.5 border-t border-border pt-2">
          <p className="text-[15px] text-muted-foreground">vợ/chồng</p>
          <p className="font-[family-name:var(--font-pha)] text-[17px]">{b.hoTen}</p>
          <DongDoiSong n={b} />
        </div>
      ))}

      <div className="mt-2">
        <ChamTinCay muc={n.tinCay} />
      </div>

      {/* Dòng ghi công (FR-39) — tên người đóng góp nằm TRÊN PHẢ, không chỉ trong nhật ký. */}
      {n.nguoiThem && (
        <p className="mt-1.5 text-[15px] italic text-primary">
          {n.nguoiThem} ghi · {n.ngayThem}
        </p>
      )}
    </>
  );

  const lop = `block w-[264px] ${lopThe({ tonNghi, toSon: tren })}`;
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!border-0 !bg-transparent" />
      {/* Chạm → mở trang một người. Không menu ngữ cảnh, không nhấn-giữ (EXPERIENCE § Node người). */}
      {n.href ? (
        <Link href={n.href} className={lop} style={tonNghi ? vienTonNghi : undefined}>
          {ruot}
        </Link>
      ) : (
        <div className={lop} style={tonNghi ? vienTonNghi : undefined}>
          {ruot}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!border-0 !bg-transparent" />
    </div>
  );
}

const nodeTypes = { nguoi: TheNguoi };

export function CayGiaPha({
  caps,
  minhId,
  duongVeGoc = [],
  vongSonTrenDuong = true,
  chieuCao,
}: {
  caps: CapCay[];
  minhId?: string;
  /** Các id trên đường huyết thống — nhánh son (FR-13). */
  duongVeGoc?: string[];
  /**
   * Có tô vòng son quanh từng node trên đường không.
   *
   * Tầng 2 thì CÓ: đường của mình phải nổi lên giữa một chi đông người. Màn nào cả cây LÀ đường
   * ấy thì tắt đi — tô hết thành ra không tô gì.
   */
  vongSonTrenDuong?: boolean;
  chieuCao?: string;
}) {
  const { nodes, edges } = useMemo(() => {
    const tren = new Set(duongVeGoc);
    const viTri = xepCay(
      caps.map((c) => ({ id: c.nguoi.id, chaId: c.chaId })),
      { rong: RONG, hoNgang: HO_NGANG, caoHang: CAO_HANG },
    );

    const nodes: Node<DuLieuThe>[] = caps.map((cap) => ({
      id: cap.nguoi.id,
      type: 'nguoi',
      position: viTri.get(cap.nguoi.id) ?? { x: 0, y: 0 },
      data: {
        cap,
        laMinh: cap.nguoi.id === minhId,
        tren: vongSonTrenDuong && tren.has(cap.nguoi.id),
      },
    }));

    const edges: Edge[] = caps
      .filter((c) => c.chaId)
      .map((c) => {
        const tronDuong = tren.has(c.nguoi.id) && tren.has(c.chaId!);
        return {
          id: `${c.chaId}-${c.nguoi.id}`,
          source: c.chaId!,
          target: c.nguoi.id,
          type: 'smoothstep',
          style: {
            stroke: tronDuong ? 'var(--color-primary)' : 'var(--color-border)',
            strokeWidth: tronDuong ? 2 : 1.5,
          },
        };
      });

    return { nodes, edges };
  }, [caps, minhId, duongVeGoc, vongSonTrenDuong]);

  return <KhungCay nodes={nodes} edges={edges} nodeTypes={nodeTypes} chieuCao={chieuCao} />;
}
