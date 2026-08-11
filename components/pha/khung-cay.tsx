'use client';

/**
 * KHUNG CÂY — vỏ React Flow dùng chung cho CẢ BA TẦNG của cây (Tộc → Chi → Người).
 *
 * Spine chi phối: EXPERIENCE.md § Information Architecture — Cây ba tầng
 *                 EXPERIENCE.md § Interaction Primitives (phải có nút phóng/thu)
 *                 DESIGN.md § Brand & Style (không lưới chấm), § Colors
 *
 * Vì sao tách riêng file này: ba tầng dùng chung đúng một vỏ (zoom/pan, nút phóng thu, nền trong
 * suốt, không lưới chấm) nhưng khác hẳn nhau ở NODE. Không tách thì ba màn có ba bản React Flow
 * copy-paste, và lần sau đổi một luật của vỏ phải sửa ba chỗ — kiểu gì cũng sót một.
 *
 * React Flow CHỈ lo khung nhìn. Mọi thẻ đều là component của mình, token có tên.
 */
import {
  ReactFlow,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export { Handle, Position } from '@xyflow/react';
export type { Node, Edge, NodeProps } from '@xyflow/react';

export function KhungCay({
  nodes,
  edges,
  nodeTypes,
  chieuCao = 'h-[620px]',
}: {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  chieuCao?: string;
}) {
  return (
    <div className={`${chieuCao} w-full overflow-hidden rounded-md border border-border`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.25}
        maxZoom={1.4}
        // Cây là để ĐỌC, không phải để sửa: kéo một node đi chỗ khác chỉ tạo ra một cái cây sai.
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        // Nền trong suốt để giấy dó xuyên qua. KHÔNG dùng <Background/> chấm lưới — lưới chấm là
        // ngôn ngữ của công cụ vẽ sơ đồ, kéo sản phẩm về phía "phần mềm" (DESIGN.md § Brand).
        style={{ background: 'transparent' }}
      >
        {/* Nút phóng/thu BẮT BUỘC — § Interaction Primitives: chụm hai ngón không phải ai cũng
            làm được, và cử chỉ ẩn là thứ đầu tiên mất với người ít dùng máy. */}
        <Controls
          showInteractive={false}
          className="[&_button]:size-11 [&_button]:border-border [&_button]:bg-card [&_button]:fill-foreground"
        />
      </ReactFlow>
    </div>
  );
}

// ── Bố cục: cha đứng GIỮA bề rộng của cả nhánh con ──────────────────────────────────────────
// Không phải giữa hai con đầu–cuối: với nhánh lệch (một con có 5 cháu, con kia không có ai) thì
// hai cách cho ra hai kết quả khác nhau, và cách "giữa đầu–cuối" vẽ ra cái cây nghiêng.

export type NutCay = { id: string; chaId: string | null };

export function xepCay<T extends NutCay>(
  nut: T[],
  { rong, hoNgang, caoHang }: { rong: number; hoNgang: number; caoHang: number },
): Map<string, { x: number; y: number }> {
  const con = new Map<string | null, T[]>();
  for (const n of nut) con.set(n.chaId, [...(con.get(n.chaId) ?? []), n]);

  const beRong = new Map<string, number>();
  const doRong = (id: string): number => {
    if (beRong.has(id)) return beRong.get(id)!;
    const cs = con.get(id) ?? [];
    const w = cs.length ? cs.reduce((s, c) => s + doRong(c.id), 0) : rong + hoNgang;
    beRong.set(id, w);
    return w;
  };

  const viTri = new Map<string, { x: number; y: number }>();
  const dat = (n: T, trai: number, sau: number) => {
    let x = trai;
    for (const c of con.get(n.id) ?? []) {
      dat(c, x, sau + 1);
      x += doRong(c.id);
    }
    viTri.set(n.id, { x: trai + doRong(n.id) / 2 - rong / 2, y: sau * caoHang });
  };

  let x = 0;
  for (const goc of con.get(null) ?? []) {
    dat(goc, x, 0);
    x += doRong(goc.id);
  }
  return viTri;
}

// ── Mảnh dùng chung của mọi thẻ người ───────────────────────────────────────────────────────

export type MucTinCayCay = 'chac-chan' | 'theo-loi-ke' | 'ton-nghi';

const NHAN_TIN_CAY: Record<MucTinCayCay, string> = {
  'chac-chan': 'chắc chắn',
  'theo-loi-ke': 'theo lời kể',
  'ton-nghi': 'tồn nghi',
};

const MAU_TIN_CAY: Record<MucTinCayCay, string> = {
  'chac-chan': 'var(--color-tin-chac-chan)',
  'theo-loi-ke': 'var(--color-tin-loi-ke)',
  'ton-nghi': 'var(--color-tin-ton-nghi)',
};

/** Chấm màu + CHỮ. Không bao giờ chỉ màu — phải đọc được khi in đen trắng và với người mù màu. */
export function ChamTinCay({ muc }: { muc: MucTinCayCay }) {
  return (
    <span className="flex items-center gap-1.5 text-[15px] text-muted-foreground">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: MAU_TIN_CAY[muc] }}
        aria-hidden
      />
      {NHAN_TIN_CAY[muc]}
    </span>
  );
}

/**
 * Lớp vỏ chung của một thẻ trên cây: chất liệu tồn nghi (nét đứt + vân giấy, TUYỆT ĐỐI không
 * opacity) và vòng son cho thứ đang được tô sáng.
 */
export function lopThe({ tonNghi, toSon }: { tonNghi: boolean; toSon?: boolean }): string {
  return [
    'rounded-md border px-4 py-3 text-left',
    tonNghi ? 'van-ton-nghi border-dashed' : 'border-border bg-card',
    toSon ? 'ring-2 ring-primary' : '',
  ].join(' ');
}

export const vienTonNghi = { borderColor: 'var(--color-tin-ton-nghi)' } as const;
