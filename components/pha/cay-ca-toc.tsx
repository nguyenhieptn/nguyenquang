'use client';

/**
 * CÂY CẢ TỘC — TẦNG 1. Node là KHỐI CHI, không phải người.
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture — Cây ba tầng (tầng 1 vẽ chi, không vẽ người)
 *   · EXPERIENCE.md § Accessibility Floor — chính con số dưới đây đẻ ra luật ấy
 *   · DESIGN.md § Colors (son khan hiếm)
 *
 * FR: FR-15 · FR-63 (gốc tạm) · FR-48 (mảnh chưa nối) · FR-3 (số còn ở tồn nghi)
 *
 * VÌ SAO TẦNG NÀY KHÔNG VẼ NGƯỜI — con số, không phải khẩu vị: Q1 chốt dưới 300 người, 5–7 đời →
 * đời rộng nhất khoảng 120 người. Sàn chữ 17px buộc một ô tên rộng ~140px, tức ~16.800px bề
 * ngang. Vẽ hết người thì chữ phải xuống dưới sàn 15px. Cây toàn tộc trọn vẹn là hiện vật của
 * BẢN IN (FR-33), không phải của màn hình.
 *
 * VÌ SAO MẢNH CHƯA NỐI KHÔNG CÓ NHÁNH NÀO: vì chưa ai tìm ra chỗ nối. Vẽ một nét mờ nối tạm là
 * nói dối đúng cái điều FR-48 sinh ra để chống. Trên khung nhìn kéo–thả được, khoảng trắng ấy
 * còn nói rõ hơn: mảnh rời nằm tách hẳn ra một bên, và người xem phải kéo tới mới thấy.
 */
import { useMemo } from 'react';
import {
  KhungCay,
  lopThe,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from './khung-cay';

export type GocTamCay = {
  id: string;
  hoTen: string;
  tenHem?: string;
};

export type KhoiChiCay = {
  id: string;
  ten: string;
  nguoiDungDau: string;
  soDoi: number;
  soNguoi: number;
  soTonNghi: number;
};

export type ManhRoiCay = {
  id: string;
  nhan: string;
  soNguoi: number;
};

const RONG = 264;
const HO_NGANG = 32;
const CAO_HANG = 230;
/** Khoảng tách mảnh rời — cố ý rộng gấp nhiều lần hở giữa các chi, để khoảng trắng tự nói. */
const KHOANG_TACH = 260;

function OSoLieu({ nhan, so }: { nhan: string; so: number }) {
  return (
    <div>
      <p className="text-[15px] text-muted-foreground">{nhan}</p>
      <p className="font-[family-name:var(--font-pha)] text-[17px]">{so} người</p>
    </div>
  );
}

function TheGocTam({ data }: NodeProps<Node<{ goc: GocTamCay }>>) {
  const { goc } = data;
  return (
    // Gốc tạm LUÔN là tồn nghi về bản chất: FR-63 nói rõ đây không phải khẳng định đã là Thuỷ tổ.
    <div className={`w-[264px] ${lopThe({ tonNghi: false })} text-center`}>
      <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold">{goc.hoTen}</p>
      {goc.tenHem && (
        <p className="mt-0.5 text-[15px] text-muted-foreground">tên hèm {goc.tenHem}</p>
      )}
      <p className="mt-1 text-[15px] text-muted-foreground">cụ xa nhất hiện biết · đời 1</p>
      <Handle type="source" position={Position.Bottom} className="!border-0 !bg-transparent" />
    </div>
  );
}

function TheKhoiChi({ data }: NodeProps<Node<{ chi: KhoiChiCay; cuaMinh?: boolean }>>) {
  const { chi, cuaMinh } = data;
  return (
    <div className={`w-[264px] ${lopThe({ tonNghi: false, toSon: cuaMinh })} text-center`}>
      <Handle type="target" position={Position.Top} className="!border-0 !bg-transparent" />
      <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold">{chi.ten}</p>
      {cuaMinh && <p className="mt-0.5 text-[15px] font-semibold text-primary">chi của mình</p>}
      <p className="mt-1 text-[15px] text-muted-foreground">
        {chi.nguoiDungDau} · {chi.soDoi} đời
      </p>
      {/* Đúng HAI con số. Con số thứ hai lộ ra chi nào cần người đi xác minh; con số thứ ba thì
          bảng chỉ số bắt đầu dài, và bảng càng dài càng không ai đọc. */}
      <div className="mt-3 flex justify-center gap-6 border-t border-border pt-2.5">
        <OSoLieu nhan="đã ghi" so={chi.soNguoi} />
        <OSoLieu nhan="còn tồn nghi" so={chi.soTonNghi} />
      </div>
    </div>
  );
}

function TheManhRoi({ data }: NodeProps<Node<{ manh: ManhRoiCay }>>) {
  const { manh } = data;
  return (
    // Mảnh rời toàn bộ ở tồn nghi — và KHÔNG có Handle nào, vì không có nhánh nào để nối.
    <div className={`w-[264px] ${lopThe({ tonNghi: true })}`}>
      <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">{manh.nhan}</p>
      <p className="mt-0.5 text-[15px] text-muted-foreground">
        {manh.soNguoi} người · chưa ai tìm ra chỗ nối
      </p>
    </div>
  );
}

const nodeTypes = { goc: TheGocTam, chi: TheKhoiChi, manh: TheManhRoi };

export function CayCaToc({
  goc,
  khoiChi,
  manhRoi,
  chiCuaMinhId,
  chieuCao,
}: {
  goc: GocTamCay;
  khoiChi: KhoiChiCay[];
  manhRoi: ManhRoiCay[];
  chiCuaMinhId?: string;
  chieuCao?: string;
}) {
  const { nodes, edges } = useMemo(() => {
    const buoc = RONG + HO_NGANG;
    const beRongChi = Math.max(khoiChi.length, 1) * buoc - HO_NGANG;

    const nodes: Node[] = [
      {
        id: goc.id,
        type: 'goc',
        position: { x: beRongChi / 2 - RONG / 2, y: 0 },
        data: { goc },
      },
      ...khoiChi.map((chi, i) => ({
        id: chi.id,
        type: 'chi',
        position: { x: i * buoc, y: CAO_HANG },
        data: { chi, cuaMinh: chi.id === chiCuaMinhId },
      })),
      ...manhRoi.map((manh, i) => ({
        id: manh.id,
        type: 'manh',
        // Đẩy hẳn sang phải, ngoài bề rộng của cả tộc. Không cùng hàng ngẫu nhiên: nằm lệch
        // xuống một nhịp để đọc ra "chưa thuộc về đâu" thay vì "là một chi nữa".
        position: { x: beRongChi + KHOANG_TACH + i * buoc, y: CAO_HANG + 60 },
        data: { manh },
      })),
    ];

    // Chỉ có nhánh từ gốc tạm xuống các chi. Mảnh rời KHÔNG có cạnh nào — xem đầu file.
    const edges: Edge[] = khoiChi.map((chi) => ({
      id: `${goc.id}-${chi.id}`,
      source: goc.id,
      target: chi.id,
      type: 'smoothstep',
      style: {
        stroke: chi.id === chiCuaMinhId ? 'var(--color-primary)' : 'var(--color-border)',
        strokeWidth: chi.id === chiCuaMinhId ? 2 : 1.5,
      },
    }));

    return { nodes, edges };
  }, [goc, khoiChi, manhRoi, chiCuaMinhId]);

  return <KhungCay nodes={nodes} edges={edges} nodeTypes={nodeTypes} chieuCao={chieuCao} />;
}
