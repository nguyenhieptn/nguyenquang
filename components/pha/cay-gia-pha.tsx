'use client';

/**
 * CÂY NGƯỜI — dùng cho TẦNG 2 (một chi) và TẦNG 3 (đường huyết thống).
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Responsive & Platform — cây vẽ từ TRÊN XUỐNG
 *   · EXPERIENCE.md § Accessibility Floor (sàn 17px, không mã hoá chỉ bằng màu)
 *   · DESIGN.md § Components — Node người, § Do's and Don'ts (cấm làm mờ tồn nghi)
 *
 * Tầng 3 KHÔNG cần component riêng: một đường huyết thống chỉ là cây mà mỗi node có đúng một con.
 * Dựng riêng thì hai màn lệch nhau lúc nào không biết, và thẻ người phải sửa hai chỗ.
 *
 * ── VÌ SAO TỪ TRÊN XUỐNG ───────────────────────────────────────────────────────────────────
 * Trái-sang-phải là hướng đọc của một BẢNG. Trên phả, XUỐNG là đi về phía sau — hướng đọc tự nó
 * mang nghĩa. Xem EXPERIENCE.md § Responsive, sửa 11/08/2026.
 */
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
  gioiTinh: 'nam' | 'nu';
  namSinh?: number;
  namMat?: number;
  tinCay: MucTinCayCay;
  /** Tên thật của người đã khuất, kiêng gọi thẳng (PRD §4) — chỉ tầng 3 bày ra. */
  huy?: string;
  nguoiThem?: string;
  ngayThem?: string;
};

export type CapCay = {
  nguoi: NguoiTrenCay;
  /** Vợ/chồng — hiện TRONG cùng một thẻ, không phải node riêng. */
  banDoi?: NguoiTrenCay;
  chaId: string | null;
  /** Dòng phụ do màn quyết định, vd "đời 3 · chi 1.2". */
  moTa?: string;
};

const RONG = 264;
const HO_NGANG = 24;
const CAO_HANG = 210;

function DongNam({ n }: { n: NguoiTrenCay }) {
  return (
    <p className="mt-0.5 text-[15px] text-muted-foreground">
      {n.namSinh ? `sinh ${n.namSinh}` : 'chưa rõ năm sinh'}
      {n.namMat ? ` · mất ${n.namMat}` : ''}
    </p>
  );
}

type DuLieuThe = { cap: CapCay; laMinh?: boolean; tren?: boolean };

function TheNguoi({ data }: NodeProps<Node<DuLieuThe>>) {
  const { cap, laMinh, tren } = data;
  const { nguoi: n, banDoi, moTa } = cap;
  const tonNghi = n.tinCay === 'ton-nghi';

  return (
    <div
      className={`w-[264px] ${lopThe({ tonNghi, toSon: tren })}`}
      style={tonNghi ? vienTonNghi : undefined}
    >
      <Handle type="target" position={Position.Top} className="!border-0 !bg-transparent" />

      <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
        {n.hoTen}
        {n.huy && (
          <span className="ml-2 text-[15px] font-normal text-muted-foreground">huý {n.huy}</span>
        )}
        {laMinh && <span className="ml-2 text-[15px] font-semibold text-primary">mình</span>}
      </p>
      {moTa && <p className="mt-0.5 text-[15px] text-muted-foreground">{moTa}</p>}
      <DongNam n={n} />

      {/* VỢ/CHỒNG trong cùng một thẻ. Trong phả, hai người đứng chung một ô và con cái treo dưới
          cả hai — tách ra thành node riêng là làm người bạn đời biến mất khỏi nhánh. */}
      {banDoi && (
        <div className="mt-2.5 border-t border-border pt-2">
          <p className="text-[15px] text-muted-foreground">
            {banDoi.gioiTinh === 'nu' ? 'vợ' : 'chồng'}
          </p>
          <p className="font-[family-name:var(--font-pha)] text-[17px]">{banDoi.hoTen}</p>
          <DongNam n={banDoi} />
        </div>
      )}

      <div className="mt-2">
        <ChamTinCay muc={n.tinCay} />
      </div>

      {/* Dòng ghi công (FR-39) — tên người đóng góp nằm TRÊN PHẢ, không chỉ trong nhật ký. */}
      {n.nguoiThem && (
        <p className="mt-1.5 text-[15px] italic text-primary">
          {n.nguoiThem} ghi · {n.ngayThem}
        </p>
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
   * Tầng 2 thì CÓ: đường của mình phải nổi lên giữa một chi đông người. Tầng 3 thì KHÔNG: ở đó
   * cả cây LÀ đường ấy, tô hết thành ra không tô gì — chỉ còn nhánh son và nhãn "mình".
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
