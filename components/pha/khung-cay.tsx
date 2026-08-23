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
import { useEffect, useMemo } from 'react';
import type { ViTri } from './xep-cay';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  useNodesInitialized,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export { Handle, Position } from '@xyflow/react';
export type { Node, Edge, NodeProps } from '@xyflow/react';

export type KichThuoc = { rong: number; cao: number };

/**
 * CHIỀU CAO KHUNG NHÌN — theo màn hình, không phải một con số cứng.
 *
 * `h-[620px]` cũ để cây — nội dung CHÍNH của màn — nằm gọn trong một hộp bằng nhau trên mọi máy,
 * trong khi phần trên trang cứ ăn dần chỗ. Trên màn 1080 thì hơn nửa chiều cao bỏ không mà cây
 * vẫn phải cuộn. `clamp` cho cây lấy hết phần còn lại của khung nhìn, có sàn để màn thấp không
 * bẹp và có trần để màn rất cao không kéo cây dài quá tầm mắt.
 */
export const CAO_KHUNG_NHIN = 'h-[clamp(460px,calc(100dvh-17rem),880px)]';

/**
 * ĐO RỒI XẾP LẠI — chỗ sửa lỗi thẻ đè lên nhau (23/08/2026).
 *
 * Bố cục cũ dùng một hằng số `CAO_HANG` cho mọi hàng. Nhưng thẻ người CAO KHÔNG BẰNG NHAU: thêm
 * một người bạn đời là +70px, thêm dòng ghi công (FR-39) là +25px, tên dài xuống dòng lại +25px
 * nữa. Thẻ nào vượt hằng số ấy thì tràn xuống hàng dưới và đè lên thẻ ở đó — đúng thứ nhìn thấy
 * trên màn.
 *
 * Không có con số cứng nào đúng được, vì chiều cao là kết quả của DỮ LIỆU chứ không phải của
 * thiết kế. Nên: dựng lần đầu bằng ước lượng, để trình duyệt đo thật, rồi xếp lại theo số đo —
 * mỗi hàng cao bằng thẻ cao nhất của chính hàng ấy.
 */
function KhungCayTrong({
  nodes,
  edges,
  nodeTypes,
  xepLai,
}: {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  xepLai?: (kichThuoc: Map<string, KichThuoc>) => Map<string, ViTri>;
}) {
  // `useNodesInitialized` bật lên đúng lúc trình duyệt đo xong mọi thẻ. Vị trí mới tính THẲNG
  // lúc render từ số đo ấy — không giữ thêm state, nên không có vòng render nào phải cắt.
  const daDo = useNodesInitialized();
  const { getNodes, fitView } = useReactFlow();

  const dsNode = useMemo(() => {
    if (!xepLai || !daDo) return nodes;
    const kichThuoc = new Map<string, KichThuoc>();
    for (const n of getNodes()) {
      kichThuoc.set(n.id, { rong: n.measured?.width ?? 0, cao: n.measured?.height ?? 0 });
    }
    const viTri = xepLai(kichThuoc);
    return nodes.map((n) => (viTri.has(n.id) ? { ...n, position: viTri.get(n.id)! } : n));
    // Đổi vị trí KHÔNG đổi số đo, nên `daDo` không lật lại — tính đúng một lần cho mỗi bộ dữ liệu.
  }, [nodes, xepLai, daDo, getNodes]);

  // Khung nhìn phải ôm lại cây SAU khi xếp lại, nếu không cây mới nằm lệch ngoài tầm nhìn.
  useEffect(() => {
    if (!daDo) return;
    const t = requestAnimationFrame(() => void fitView({ padding: 0.08, duration: 200 }));
    return () => cancelAnimationFrame(t);
  }, [daDo, dsNode, fitView]);

  return (
      <ReactFlow
        nodes={dsNode}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.08 }}
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
  );
}

export function KhungCay({
  nodes,
  edges,
  nodeTypes,
  chieuCao = CAO_KHUNG_NHIN,
  xepLai,
}: {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  chieuCao?: string;
  /** Xếp lại theo SỐ ĐO THẬT sau khi trình duyệt dựng xong thẻ. Bỏ trống thì giữ vị trí ban đầu. */
  xepLai?: (kichThuoc: Map<string, KichThuoc>) => Map<string, ViTri>;
}) {
  return (
    <div className={`${chieuCao} w-full overflow-hidden rounded-md border border-border`}>
      {/* Provider tường minh: `DoRoiXepLai`/`KhungCayTrong` dùng hook đọc số đo, mà hook phải nằm
          trong provider — và provider phải bọc NGOÀI component render <ReactFlow>. */}
      <ReactFlowProvider>
        {/* `key` theo tập node: sang chi khác thì khung nhìn dựng lại để ĐO LẠI từ đầu. Không có
            nó, `useNodesInitialized` vẫn đang bật từ bộ dữ liệu trước nên số đo mới không bao
            giờ được đọc, và cây mới phải sống bằng ước lượng. */}
        <KhungCayTrong
          key={nodes.map((n) => n.id).join('|')}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          xepLai={xepLai}
        />
      </ReactFlowProvider>
    </div>
  );
}

// Toán bố cục nằm ở `xep-cay.ts` (module thuần, có test). Re-export để nơi gọi không đổi.
export { xepCay } from './xep-cay';
export type { NutCay, ViTri } from './xep-cay';

// ── Mảnh dùng chung của mọi thẻ người ───────────────────────────────────────────────────────

// Khi cây được phục sinh (22/08/2026), ChamTinCay đã dọn sang tin-cay.tsx (xem lý do ở đó).
// Re-export để giữ import cũ của các thẻ cây; định nghĩa thật chỉ còn MỘT chỗ.
export type { MucTinCay as MucTinCayCay } from './tin-cay';
export { ChamTinCay } from './tin-cay';

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
