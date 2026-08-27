'use client';

/**
 * CANVAS CÂY của bàn làm việc — story 5-2.
 *
 * ── Vì sao KHÔNG dùng lại `components/pha/khung-cay.tsx` (chốt 24/08, đừng mở lại) ─────────
 * Khung ấy sinh ra cho bề mặt A: `elementsSelectable={false}`, không `Controls`, không chọn node.
 * Bàn làm việc cần ngược lại gần hết. Nhét cả hai vào một component là đẻ ra một chuỗi cờ bật/tắt
 * mà về sau không ai dám sửa. Hai vỏ, mỗi vỏ một luật, đọc được cả hai.
 *
 * ── Ba quyết định hình thức, đã chốt ──────────────────────────────────────────────────────
 *   · KHÔNG lưới chấm nền — `DESIGN.md § Elevation`: khung trần, phân tầng bằng viền chứ không
 *     bằng hoạ tiết. Nền phẳng `ban-nen`, cùng tông với bốn màn còn lại của bàn.
 *   · GIỮ nhãn ghi công của React Flow. Ẩn được và không vi phạm giấy phép MIT — nhưng đây là
 *     thư viện cho không, dùng ở màn quan trọng nhất của dự án.
 *   · Không đổ bóng ở bất cứ đâu.
 *
 * ── Bố cục gọi THẲNG `xepCay()` thật ──────────────────────────────────────────────────────
 * Không mô phỏng, không dagre/elk. Vùng lân cận là một lát CẮT RỜI khỏi cây nên người ở rìa có
 * `chaId: null` — và `xepCay` vốn đã lặp qua nhiều gốc, nên nó chạy đúng mà không phải sửa gì.
 *
 * `docs/build-contract.md § Phân tầng`: file này KHÔNG import `@/core/*`. Trang dịch dữ liệu core
 * sang hình dạng dưới đây rồi mới truyền xuống.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { ChevronsUpDown, Crosshair, UserRoundPlus } from 'lucide-react';
import {
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { xepCay } from '@/components/pha/xep-cay';
import { KIEU_NUT, type DuLieuTheNguoi } from './the-nguoi';
import { dongBanDoi, type BanDoiThe } from './ban-doi-the';
import { camNutTam, ID_TAM, type HuongThem } from './dat-nut-tam';
import { useThanhViec } from './khung-admin';

/**
 * Thẻ CAO KHÔNG BẰNG NHAU: mỗi bạn đời là thêm một dòng. Đây là ca đã đẻ ra lỗi "thẻ đè nhau"
 * (sửa 23/08), nên chiều cao phải tính từ CHÍNH thứ thẻ sẽ vẽ, không phải từ một hằng số đoán.
 *
 * Số dòng bạn đời do `dongBanDoi()` ở `the-nguoi.tsx` quyết — MỘT nguồn, để chiều cao đo được ở
 * đây và chiều cao vẽ ra ở đó không thể lệch nhau.
 */
const RONG = 212;
const CAO_TRON = 68;
const CAO_MOI_DONG_BAN_DOI = 22;

export type NutCanvas = {
  id: string;
  /** `null` = cha nằm NGOÀI vùng ⇒ gốc của bố cục. Do core tính, không suy ở đây. */
  chaId: string | null;
  the: Omit<DuLieuTheNguoi, 'cao' | 'rong' | 'laNeo'>;
};

export function KhungCayAdmin({
  neoId,
  banKinh,
  canKiet,
  nut,
  chonId,
  onChon,
  onDoiNeo,
  onDoiBanKinh,
  themVao,
  onMoThem,
}: {
  neoId: string;
  banKinh: number;
  canKiet: boolean;
  nut: NutCanvas[];
  /** Người đang chọn. NÂNG LÊN TRANG ở story 5-3 — cột phải cần biết, canvas thì không sở hữu. */
  chonId: string | null;
  onChon: (id: string) => void;
  onDoiNeo: (id: string) => void;
  onDoiBanKinh: (n: number) => void;
  /** Story 5-4 — đang mở biểu mẫu thêm người: bày một node MỜ ở chỗ người ấy sẽ rơi vào. */
  themVao?: { mocId: string | null; huong: HuongThem; hoTen: string } | null;
  onMoThem?: () => void;
  /**
   * Story 6-9 — phím tắt nhập nhanh. `Enter` thêm con, `Shift+Enter` thêm anh em.
   *
   * Canvas KHÔNG tự quyết mốc: nó chỉ báo ra hành động và để nơi gọi tra bố cục. Cha của node
   * đang chọn nằm trong `nut` (`chaId`), thứ nơi gọi đang giữ.
   */
}) {
  const { xinThu } = useThanhViec();

  /**
   * Vào màn cây thì thanh việc tự thu thành ray — canvas là thứ cần bề ngang nhất của cả bàn.
   *
   * ── `xinThu`, KHÔNG phải `datThu` ────────────────────────────────────────────────────────
   * `datThu` ghi vào `localStorage`, tức là đổi lựa chọn của người dùng cho MỌI màn và mọi phiên
   * sau. Người vận hành thích thanh việc mở, ghé màn cây một lần, rồi từ đó thanh việc thu ở cả
   * Hàng chờ lẫn Nạp khung — không ai bảo nó làm thế. Đây là yêu cầu của MỘT MÀN, nên nó phải
   * sống và chết cùng màn ấy.
   *
   * Dọn dẹp trả lại lựa chọn thật khi rời đi. Dời neo cũng chạy qua đây (trang gắn `key` nên
   * khối này dựng lại), nhưng `xinThu` biết người dùng đã tự chỉnh hay chưa — chỉnh rồi thì lời
   * xin này im, đúng như câu "mở lại thì tôn trọng, không ép thu lần nữa" vẫn hứa.
   */
  useEffect(() => {
    xinThu(true);
    return () => xinThu(false);
  }, [xinThu]);

  const { nodes, edges } = useMemo(() => {
    const trong = new Set(nut.map((n) => n.id));
    // Tra theo Map, không `find` lồng trong `map`: `banDoiCua` được gọi hai lượt cho mỗi node
    // (một cho chiều cao, một cho dữ liệu thẻ), nên `find` biến bộ nhớ hoá thành O(n²).
    const theoId = new Map(nut.map((n) => [n.id, n]));
    const tenSapThem = themVao?.hoTen.trim() || 'người sắp thêm';

    /**
     * Bạn đời của một node, ĐÃ GỘP bản xem trước.
     *
     * Hướng "vợ/chồng" không sinh node nào — vợ chồng chung một thẻ (luật 5-2), nên chỗ người
     * mới sẽ rơi vào là một DÒNG trên thẻ của mốc. Trước bản vá 25/08 hướng này không vẽ gì cả:
     * một trong bốn hướng im lặng hoàn toàn, trong khi cả story sinh ra từ câu "thấy vị trí
     * TRƯỚC khi ghi".
     */
    const banDoiCua = (id: string): BanDoiThe[] => {
      const co = theoId.get(id)?.the.banDoi ?? [];
      return themVao?.huong === 'vo-chong' && themVao.mocId === id
        ? [...co, { ten: tenSapThem, sapThem: true }]
        : co;
    };

    /**
     * Đo bằng CHÍNH hàm thẻ dùng để vẽ. Bản trước đếm `Math.min(banDoi.length, 2)` — một phép
     * đếm THỨ HAI, và nó lệch ngay: với hai bạn đời thật cộng một bản xem trước, thẻ vẽ ba dòng
     * còn phép này trả hai. Lệch chiều cao là lỗi "thẻ đè lên nhau", thứ repo đã sửa hai lần.
     */
    const caoCua = (id: string) =>
      id === ID_TAM ? CAO_TRON : CAO_TRON + dongBanDoi(banDoiCua(id)).length * CAO_MOI_DONG_BAN_DOI;

    const goc = nut.map((n) => ({
      id: n.id,
      chaId: n.chaId && trong.has(n.chaId) ? n.chaId : null,
    }));

    /**
     * "Thấy vị trí TRƯỚC khi ghi": node mờ đi qua CHÍNH `xepCay`, không đoán toạ độ bằng tay.
     * Đoán toạ độ là cách lỗi "thẻ đè lên nhau" quay lại dưới một cái tên khác — và ở đây nó còn
     * tệ hơn, vì người vận hành sẽ tin vào một vị trí không đúng rồi mới ghi.
     */
    const cam = themVao
      ? camNutTam(goc, themVao.mocId, themVao.huong)
      : { boCuc: goc, coNodeTam: false, daThayCanhCu: false };

    // `cao` là HÀM, không phải hằng số. Truyền hằng số vào đây — kể cả dạng `() => 120` — chính
    // là cách lỗi "thẻ đè lên nhau" (sửa 23/08) quay lại.
    const viTri = xepCay(cam.boCuc, { rong: RONG, hoNgang: 30, hoDoc: 56, cao: caoCua });

    const ns: Node[] = nut.map((n) => ({
      id: n.id,
      type: 'nguoi',
      position: viTri.get(n.id) ?? { x: 0, y: 0 },
      selected: n.id === chonId,
      data: {
        ...n.the,
        banDoi: banDoiCua(n.id),
        laNeo: n.id === neoId,
        cao: caoCua(n.id),
        rong: RONG,
      } satisfies DuLieuTheNguoi,
    }));

    if (cam.coNodeTam && themVao) {
      ns.push({
        id: ID_TAM,
        type: 'nguoi',
        position: viTri.get(ID_TAM) ?? { x: 0, y: 0 },
        // Node mờ KHÔNG chọn được: nó chưa tồn tại, nên không có hồ sơ để mở ở cột phải.
        selectable: false,
        data: {
          hoTen: tenSapThem,
          banDoi: [],
          doi: null,
          chi: null,
          laGocManh: false,
          tinCay: 'ton-nghi',
          tonNghi: true,
          laNeo: false,
          sapThem: true,
          cao: CAO_TRON,
          rong: RONG,
        } satisfies DuLieuTheNguoi,
      });
    }

    const es: Edge[] = cam.boCuc
      .filter((n) => n.chaId !== null)
      .map((n) => ({
        id: `${n.chaId}->${n.id}`,
        source: n.chaId!,
        target: n.id,
        type: 'smoothstep',
        style:
          n.id === ID_TAM || n.chaId === ID_TAM
            ? { stroke: 'var(--color-muted-foreground)', strokeWidth: 1.5, strokeDasharray: '6 5' }
            : { stroke: 'var(--color-ban-vien)', strokeWidth: 1.5 },
      }));

    return { nodes: ns, edges: es };
  }, [nut, chonId, neoId, themVao]);

  const datLamTam = useCallback(() => {
    if (chonId && chonId !== neoId) onDoiNeo(chonId);
  }, [chonId, neoId, onDoiNeo]);

  return (
    <div className="relative h-full min-w-0 flex-1 rounded-md border border-ban-vien">
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={datLamTam}
          disabled={!chonId || chonId === neoId}
          className="flex min-h-11 items-center gap-2 rounded-md border border-ban-vien bg-ban-o px-3 text-[17px] disabled:text-muted-foreground"
        >
          <Crosshair className="size-4" aria-hidden />
          Đặt làm tâm
        </button>
        <button
          type="button"
          onClick={() => onDoiBanKinh(banKinh + 1)}
          disabled={canKiet || banKinh >= 6}
          /**
           * Lý do bị vô hiệu nằm TRÊN CHÍNH NÚT, không phải một băng-rôn cạnh nó (bỏ 26/08 để
           * giữ view gọn). Một nút xám không nói gì là một câu đố; `title` cho chuột, `aria-label`
           * cho máy đọc.
           */
          {...(canKiet
            ? { title: 'Đã hết người để mở thêm', 'aria-label': 'Mở thêm một đời — đã hết người để mở thêm' }
            : banKinh >= 6
              ? { title: 'Đã tới bán kính xa nhất', 'aria-label': 'Mở thêm một đời — đã tới bán kính xa nhất' }
              : {})}
          className="flex min-h-11 items-center gap-2 rounded-md border border-ban-vien bg-ban-o px-3 text-[17px] disabled:text-muted-foreground"
        >
          <ChevronsUpDown className="size-4" aria-hidden />
          Mở thêm một đời
        </button>
        {chonId && onMoThem ? (
          <button
            type="button"
            onClick={onMoThem}
            className="flex min-h-11 items-center gap-2 rounded-md border border-ban-vien bg-ban-o px-3 text-[17px]"
          >
            <UserRoundPlus className="size-4" aria-hidden />
            Thêm người quanh đây
          </button>
        ) : null}
      </div>

      <ReactFlowProvider>
        <Trong nodes={nodes} edges={edges} onChon={onChon} khoaOm={`${neoId}|${banKinh}`} />
      </ReactFlowProvider>
    </div>
  );
}

function Trong({
  nodes,
  edges,
  onChon,
  khoaOm,
}: {
  nodes: Node[];
  edges: Edge[];
  onChon: (id: string) => void;
  /** Đổi khoá = neo hoặc bán kính đã đổi ⇒ ôm lại khung nhìn. CHỌN NGƯỜI THÌ KHÔNG ĐỔI. */
  khoaOm: string;
}) {
  const { fitView } = useReactFlow();

  /**
   * Chọn người đi qua `onNodesChange`, KHÔNG qua `onNodeClick`. Hai lý do, cả hai là lỗi thật:
   *
   *   · BÀN PHÍM. `nodes` là controlled; không có `onNodesChange` thì React Flow không có đường
   *     báo ra rằng người dùng vừa chọn một node, và Enter/Space trên node đang focus không tới
   *     `onNodeClick`. Cả màn cây khi ấy chỉ dùng được bằng chuột.
   *   · NODE MỜ. `onNodeClick` bắn cho cả node có `selectable: false`, nên bấm vào bản xem trước
   *     đặt `chonId = '__sap-them__'`: nút "Đặt làm tâm" sáng lên và dời neo sang một id không
   *     tồn tại. `onNodesChange` thì không phát `select` cho node không chọn được — hết đường.
   */
  const doiNode = useCallback(
    (thayDoi: NodeChange[]) => {
      for (const t of thayDoi) {
        if (t.type === 'select' && t.selected) onChon(t.id);
      }
    },
    [onChon],
  );

  /**
   * Ôm lại khung nhìn CHỈ khi neo hoặc bán kính đổi.
   *
   * Đây là quy tắc dễ vi phạm nhất của story: nếu ôm lại mỗi lần chọn người thì canvas nhảy liên
   * tục và người vận hành mất chỗ đứng — đúng thứ màn này sinh ra để cho. Khoá `neo|bán kính` là
   * cách rẻ nhất để nói "chọn người không phải là dời tâm".
   */
  useEffect(() => {
    const t = setTimeout(() => void fitView({ padding: 0.14, duration: 260 }), 0);
    return () => clearTimeout(t);
  }, [khoaOm, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={KIEU_NUT}
      fitView
      fitViewOptions={{ padding: 0.14 }}
      minZoom={0.3}
      maxZoom={1.5}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      /**
       * CẢ HAI, không phải một. Mỗi cái bịt một lỗ mà cái kia không bịt:
       *
       *   · `onNodesChange` cho BÀN PHÍM. `nodes` là controlled nên không có nó thì React Flow
       *     không có đường báo ra rằng Enter/Space vừa chọn một node.
       *   · `onNodeClick` cho cú bấm LẶP LẠI. `node_modules/@xyflow/react/dist/esm/index.js:1647`
       *     — `if (!node.selected) { addSelectedNodes([id]) }` — bấm vào node ĐANG chọn không
       *     phát `select` change nào. Bỏ `onNodeClick` là cắt mất đường phục hồi duy nhất khi
       *     cột phải lệch khỏi node đang sáng.
       *
       * Node mờ loại bằng `ID_TAM` tường minh: `onNodeClick` bắn cho cả node `selectable: false`.
       */
      onNodeClick={(_, n) => {
        if (n.id !== ID_TAM) onChon(n.id);
      }}
      onNodesChange={doiNode}
      style={{ background: 'transparent' }}
    >
      {/*
        Nút phóng/thu là BẮT BUỘC (`EXPERIENCE.md § Interaction Primitives`), và phải đạt sàn chạm
        44px — mặc định của React Flow là 26px.

        KHÔNG vá bằng utility ở đây. `@xyflow/react/dist/style.css` không có `@layer` nào, mà CSS
        không phân lớp thắng CSS phân lớp bất kể độ đặc hiệu — nên `[&_button]:size-11` từng đứng
        đúng chỗ này suốt Đợt 1 mà chưa bao giờ áp một pixel nào. Bản vá thật nằm ở
        `app/globals.css`, chỗ có chú thích giải thích vì sao nó phải sống ngoài mọi lớp.
      */}
      <Controls showInteractive={false} className="van-nut-cay-admin" />
    </ReactFlow>
  );
}
