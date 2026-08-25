'use client';

/**
 * `/admin` — BÀN LÀM VIỆC. Bản dựng thử 1:1, mock data.
 *
 * Một trang ba cột, ăn hết khung nhìn: thanh việc trái (thu được thành ray) · canvas gia phả ·
 * chồng khẳng định phải.
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § IA › Bề mặt B — đang đổi từ thanh ngang bốn mục sang một trang ba cột
 *   · EXPERIENCE.md § Bề mặt B — sàn chữ 17px áp nguyên; chật thì BỚT MỤC, không thu chữ
 *   · EXPERIENCE.md § Interaction Primitives — bắt buộc có nút phóng/thu
 *   · EXPERIENCE.md § Voice and Tone — cấm ngôi hai, cấm cả chữ "bạn"
 *   · DESIGN.md § Colors › Bề mặt B — khung TRẦN (ban-*); thẻ người là khẳng định về người thật
 *     nên giữ luật bề mặt A: font-pha, nét đứt tồn nghi, chip ba mức
 *   · DESIGN.md § Cảnh báo là chàm mực — mâu thuẫn dùng destructive, KHÔNG dùng son
 *   · DESIGN.md § Elevation — không đổ bóng
 *
 * Story: 5-2 (canvas có neo) · 5-3 (chồng khẳng định) · 5-5 (duyệt vào phả) · 5-7 (nơi).
 * **5-1 (vỏ) ĐÃ PROMOTE ra `app/admin/` ngày 24/08/2026** — thanh trên, thanh việc và một hệ bề
 * rộng ở đây chỉ còn là ẢNH CHỤP để đối chiếu; nguồn sự thật là `components/admin/khung-admin.tsx`.
 *
 * Đồ thị: `@xyflow/react` 12.11.2 (đã có trong dự án). Bố cục gọi THẲNG `xepCay()` thật ở
 * `components/pha/xep-cay.ts` — không mô phỏng.
 *
 * TĨNH, MOCK-ONLY: không `@/core/*`, không `@/db/*`, không server action.
 *
 * ═══ BẢN ĐỒ PROMOTE — đọc trước khi dựng màn thật ═══════════════════════════════════════════
 *
 * Bản dựng thử này KHÔNG phải hình minh hoạ vứt đi; nó là mã khởi điểm
 * (`specs/frontend-stack.md §5`). Bảng dưới nói **cái gì ở lại, cái gì thay**:
 *
 *   Ở ĐÂY                          BẢN THẬT GỌI                                          STORY
 *   ───────────────────────────────────────────────────────────────────────────────────────────
 *   `xepCay()`                     GIỮ NGUYÊN — đã là hàm thật, có test                    5-2
 *   `lanCan()` BFS tại chỗ         `bfsDistances()` `core/tree/ops.ts`                     5-2
 *   `voCua()` qua `voChongId`      `CoupleNode.partners` (`core/tree`)                     5-2
 *   `doiCua()` / `nhanChi()`       `PersonCard.generation` / `.branchCode`                 5-2
 *   `khangDinhVe()`                `getPerson()` → `PersonProfile.assertions`              5-3
 *   `XIN_VAO_PHA`                  `listPendingAttachments()` (`core/identity`)            5-5
 *   `boDau()` tại chỗ              `core/so-khop/chuan-hoa.ts` (AD-16)                     5-7
 *   `NOI` / `NOI_CUA_NGUOI`        CHƯA CÓ GÌ — FR-65 chưa có bảng, 5-7 phải dựng          5-7
 *   ô tìm trên thanh trên          ĐÃ PROMOTE → `app/admin/actions.ts` (`searchPersons`)   ✅
 *
 * ── Bốn cái bẫy đã biết, ghi ra để không ai vấp lại ─────────────────────────────────────────
 *
 * 1. **`cao` phải là HÀM, không phải hằng số.** Thẻ có vợ cao hơn thẻ không. Truyền một hằng số
 *    vào `xepCay` chính là cách lỗi "thẻ đè lên nhau" (sửa 23/08) ra đời.
 *
 * 2. **Người kết hôn vào họ có `chaId: null`** — BFS cha-con KHÔNG BAO GIỜ chạm tới họ. Ở đây
 *    phải đi tìm qua `voChongId`; bản thật thì `bfsDistances` đi cả cạnh vợ-chồng nên vùng lân
 *    cận THẬT RỘNG HƠN vùng đang thấy ở đây. Đừng canh số lượng node theo bản dựng thử.
 *
 * 3. **Mock KHÔNG lọc bán kính riêng tư.** Mọi lối vào `core/` đều đã lọc sẵn (AD-13/AD-21), nên
 *    canvas thật sẽ bày ÍT người hơn — và `PersonProfile.assertions` CHỈ có mặt khi
 *    `visibility === 'full'`. Cột phải phải chịu được trường hợp vắng, không phải coi là lỗi.
 *
 * 4. **Nút "Từ chối" ở `PanelXin` chưa có gì đỡ.** `core/identity` mới có `approveAttachment`,
 *    `detachSelf`, `listPendingAttachments`, `requestAttachment` — KHÔNG có hàm từ chối. Story
 *    5-5 phải dựng nó trong core trước (kèm revision, AD-10), không được vá ở tầng app.
 *
 * ── Ba quyết định ĐÃ CHỐT 24/08/2026 (đừng mở lại mà không có lý do mới) ─────────────────────
 *   a. **Vỏ RIÊNG cho canvas quản trị**, không dùng lại `components/pha/khung-cay.tsx`. Khung ấy
 *      sinh ra cho bề mặt A — `elementsSelectable={false}`, không `Controls`, không chọn node —
 *      mà bàn làm việc cần ngược lại gần hết. Nhét cả hai vào một component là đẻ ra một chuỗi
 *      cờ bật/tắt mà về sau không ai dám sửa. Hai vỏ, mỗi vỏ một luật, đọc được cả hai.
 *   b. **KHÔNG lưới chấm nền.** `DESIGN.md § Elevation`: khung trần, phân tầng bằng viền chứ
 *      không bằng hoạ tiết. Nền phẳng `ban-nen` giữ nguyên tông với ba màn còn lại của bàn.
 *   c. **GIỮ nhãn ghi công của React Flow.** `@xyflow/react` là MIT nên ẩn nhãn không vi phạm
 *      giấy phép (`proOptions={{ hideAttribution: true }}` là xong) — nhưng đây là thư viện cho
 *      không, dùng ở màn quan trọng nhất của dự án. Giữ một dòng chữ nhỏ là cách trả ơn rẻ nhất.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronsUpDown,
  Crosshair,
  Crown,
  Inbox,
  LayoutDashboard,
  MapPin,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ScrollText,
  Search,
  TriangleAlert,
  Unlink,
  Upload,
  UserRoundCheck,
  UserRoundPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { xepCay } from '@/components/pha/xep-cay';
import {
  KHANG_DINH,
  MANH,
  NGUOI,
  NHAN_VAI_NOI,
  NOI,
  NOI_CUA_NGUOI,
  XIN_VAO_PHA,
  doiCua,
  hangChoDuyet,
  khangDinhVe,
  nhanChi,
  noiTheoId,
  type Nguoi,
} from '../_mock/seed';

// ── Kích thước thẻ ──────────────────────────────────────────────────────────────────────────
// Thẻ CAO KHÔNG BẰNG NHAU: có vợ thì thêm một dòng. Đây chính là ca đã đẻ ra lỗi "thẻ đè lên
// nhau" hôm 23/08 — nên chiều cao phải là HÀM, và `xepCay` nhận đúng một hàm như thế.
const RONG = 212;
const CAO_TRON = 68;
const CAO_CO_VO = 90;

const CON_CUA = new Map<string, string[]>();
for (const n of NGUOI) {
  if (n.chaId) CON_CUA.set(n.chaId, [...(CON_CUA.get(n.chaId) ?? []), n.id]);
}

function nguoiTheoId(id: string): Nguoi | undefined {
  return NGUOI.find((x) => x.id === id);
}

/**
 * Người bạn đời, GỘP VÀO CÙNG MỘT THẺ chứ không tách thành node riêng.
 *
 * Hai node cạnh nhau đọc thành hai người rời; vợ chồng là MỘT chỗ trong phả. Và người kết hôn
 * vào họ có `chaId: null` nên BFS cha-con không bao giờ chạm tới họ — phải đi tìm qua `voChongId`.
 */
function voCua(id: string): Nguoi | undefined {
  const n = nguoiTheoId(id);
  if (n?.voChongId) return nguoiTheoId(n.voChongId);
  return NGUOI.find((x) => x.voChongId === id);
}

function caoThe(id: string): number {
  return voCua(id) ? CAO_CO_VO : CAO_TRON;
}

/** Ba mức tin cậy ở dạng NHỎ NHẤT có thể mà vẫn không mã hoá chỉ bằng màu — HÌNH mang nghĩa. */
const HINH_TIN_CAY: Record<Nguoi['tinCay'], string> = {
  'chac-chan': '\u25cf',
  'theo-loi-ke': '\u25d0',
  'ton-nghi': '\u25cb',
};
const NHAN_TIN_CAY: Record<Nguoi['tinCay'], string> = {
  'chac-chan': 'chắc chắn',
  'theo-loi-ke': 'theo lời kể',
  'ton-nghi': 'tồn nghi',
};
const MAU_TIN_CAY: Record<Nguoi['tinCay'], string> = {
  'chac-chan': 'var(--color-tin-chac-chan)',
  'theo-loi-ke': 'var(--color-tin-loi-ke)',
  'ton-nghi': 'var(--color-tin-ton-nghi)',
};

function ChamNho({ muc }: { muc: Nguoi['tinCay'] }) {
  return (
    <span
      className="shrink-0 text-[15px] leading-none"
      style={{ color: MAU_TIN_CAY[muc] }}
      title={NHAN_TIN_CAY[muc]}
    >
      <span aria-hidden>{HINH_TIN_CAY[muc]}</span>
      <span className="sr-only">{NHAN_TIN_CAY[muc]}</span>
    </span>
  );
}

/** Bỏ dấu để tìm không dấu — bản thật dùng `boDau` của `core/so-khop/chuan-hoa.ts` (AD-16). */
function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Lân cận quanh MỘT NEO, đi theo CẠNH chứ không theo cây — nên nó tự bước sang nhánh khác.
 * Bản mock chỉ đi cạnh cha-con; `bfsDistances` thật đi cả cạnh vợ-chồng nên vùng thật rộng hơn.
 */
function lanCan(neoId: string, banKinh: number): Map<string, number> {
  const kc = new Map<string, number>([[neoId, 0]]);
  const hangDoi: string[] = [neoId];
  while (hangDoi.length > 0) {
    const id = hangDoi.shift()!;
    const d = kc.get(id) ?? 0;
    if (d >= banKinh) continue;
    const n = nguoiTheoId(id);
    if (!n) continue;
    for (const k of [...(n.chaId ? [n.chaId] : []), ...(CON_CUA.get(id) ?? [])]) {
      if (!kc.has(k)) {
        kc.set(k, d + 1);
        hangDoi.push(k);
      }
    }
  }
  return kc;
}

// ── Thanh việc ──────────────────────────────────────────────────────────────────────────────

const SO_MAU_THUAN = new Set(
  KHANG_DINH.filter((k) => k.menhDe.includes('sinh năm')).map((k) => k.veNguoiId),
).size;

type MucViec = { nhan: string; icon: LucideIcon; so: number | null; dangMo?: boolean };

/**
 * BA THANH GHI, KHÔNG PHẢI BA CHỦ ĐỀ — sửa 24/08/2026 sau khi soi lại thanh việc.
 *
 * Bản trước gom theo chủ đề và hoá ra toàn HỘP THƯ ĐẾN: mọi mục đều trả lời *"cái gì đang đợi
 * tôi"*, không mục nào trả lời *"tôi muốn làm gì"*. Với một bàn tu phả thì đó là ngược đầu —
 * việc thường ngày không phải DUYỆT (hàng chờ chỉ đầy khi có người khác đóng góp, mà ngày đầu
 * thì chưa ai) mà là GHI: có người gọi điện báo chú Hùng vừa mất, phải viết được xuống ngay.
 *
 * Nên thanh việc chia theo THANH GHI:
 *   1. HÀNH ĐỘNG  — một nút, luôn ở đỉnh, không phải mục điều hướng
 *   2. Bàn làm việc — nơi đứng làm (không có số)
 *   3. Đối chiếu   — hộp thư đến (CÓ số)
 *   4. Sổ dòng họ  — dữ liệu nền, sửa thưa nhưng phải sửa được (không có số)
 *
 * Có số hay không chính là thứ phân biệt thanh ghi 3 với 2 và 4 — không cần thêm hoa văn nào.
 *
 * ── "Chỉnh sửa" KHÔNG có mục riêng, và đó là chủ ý ───────────────────────────────────────────
 * AD-9/AD-10: hệ này không bao giờ ĐÈ một sự thật cũ; sửa = **ghi thêm một khẳng định** rồi để
 * chồng khẳng định bày cả hai. Nên "sửa" không phải một màn — nó xảy ra ở cột phải, bất cứ chỗ
 * nào một người đang hiện. Đường ngắn nhất tới đó là ô tìm trên thanh trên (gõ → dời tâm → cột
 * phải mở), không phải một mục trên thanh việc.
 */
const NHOM_VIEC: { ten: string; muc: MucViec[] }[] = [
  {
    ten: 'Bàn làm việc',
    muc: [
      { nhan: 'Cây gia phả', icon: Network, so: null, dangMo: true },
      { nhan: 'Trang nhà', icon: LayoutDashboard, so: null },
    ],
  },
  {
    ten: 'Đối chiếu',
    muc: [
      { nhan: 'Hàng chờ khẳng định', icon: Inbox, so: hangChoDuyet().length },
      { nhan: 'Duyệt vào phả', icon: UserRoundCheck, so: XIN_VAO_PHA.length },
      { nhan: 'Mâu thuẫn', icon: TriangleAlert, so: SO_MAU_THUAN },
      { nhan: 'Mảnh chưa nối', icon: Unlink, so: MANH.length },
    ],
  },
  {
    ten: 'Sổ dòng họ',
    muc: [
      { nhan: 'Nơi chốn', icon: MapPin, so: null },
      // `ClanSettings` (tên họ, chữ đệm, đề từ) ĐÃ có trong core và được BỐN màn bề mặt A đọc —
      // nhưng `core/identity` KHÔNG có hàm ghi. Đặt tên họ một lần bằng script bootstrap rồi
      // thôi. Đây là lỗ thật, không phải mục trang trí.
      { nhan: 'Tên họ & đề từ', icon: ScrollText, so: null },
      { nhan: 'Nạp khung', icon: Upload, so: null },
    ],
  },
];

/**
 * NÚT HÀNH ĐỘNG CHÍNH — không phải mục điều hướng, nên nó không nằm trong nhóm nào.
 *
 * Vì sao KHÔNG dùng son: `DESIGN.md § Colors` cho son đúng một nghĩa — *đã chốt*. Nút này chỉ
 * MỞ một biểu mẫu, nó chưa ghi gì. Son thuộc về nút gửi bên trong biểu mẫu ấy (giống nút "Ghi
 * N dòng vào phả" của màn Nạp khung), không thuộc về cái mở nó ra.
 *
 * Bấm KHÔNG điều hướng đi đâu: người mới hiện ra thành một nút tồn nghi trên canvas, cột phải
 * mở biểu mẫu. Chưa biết nối vào ai thì cứ để rời — FR-48/FR-63 nói rõ mảnh rời là chuyện
 * thường, và người chép từ cuốn phả giấy thường có TÊN trước khi có chỗ nối.
 */
function NutThem({ thu }: { thu: boolean }) {
  return (
    <div className={`border-b border-ban-vien py-3 ${thu ? 'px-2' : 'px-3'}`}>
      <button
        type="button"
        title={thu ? 'Thêm người vào phả' : undefined}
        className={`flex min-h-11 w-full items-center gap-2.5 rounded-md border border-foreground bg-ban-o text-[17px] font-semibold hover:bg-ban-nen ${
          thu ? 'justify-center px-0' : 'px-3'
        }`}
      >
        <UserRoundPlus className="size-5 shrink-0" aria-hidden />
        {thu ? (
          <span className="sr-only">Thêm người vào phả</span>
        ) : (
          <span>Thêm người vào phả</span>
        )}
      </button>
    </div>
  );
}

function ThanhViec({ thu, doiThu }: { thu: boolean; doiThu: () => void }) {
  return (
    <nav
      aria-label="Thanh việc"
      className={`flex shrink-0 flex-col border-r border-ban-vien bg-ban-o ${thu ? 'w-14' : 'w-60'}`}
    >
      <NutThem thu={thu} />

      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        {NHOM_VIEC.map((g) => (
          <div key={g.ten} className="mb-3">
            {thu ? (
              <div className="mx-3 mb-1 border-t border-ban-vien" />
            ) : (
              <p className="px-4 pb-1 text-[15px] tracking-wide text-muted-foreground uppercase">
                {g.ten}
              </p>
            )}
            <ul>
              {g.muc.map((m) => {
                const Icon = m.icon;
                return (
                  <li key={m.nhan}>
                    <button
                      type="button"
                      aria-current={m.dangMo ? 'page' : undefined}
                      title={thu ? `${m.nhan}${m.so !== null ? ` — ${m.so}` : ''}` : undefined}
                      className={`flex min-h-11 w-full items-center gap-3 border-l-2 text-left ${
                        thu ? 'justify-center px-0' : 'px-4'
                      } ${
                        m.dangMo
                          ? 'border-foreground bg-ban-nen font-semibold'
                          : 'border-transparent text-muted-foreground hover:bg-ban-nen'
                      }`}
                    >
                      <span className="relative shrink-0">
                        <Icon className="size-5" aria-hidden />
                        {thu && m.so !== null ? (
                          <span className="absolute -top-1.5 -right-2 rounded-4xl bg-foreground px-1 text-[15px] leading-tight text-ban-o tabular-nums">
                            {m.so}
                          </span>
                        ) : null}
                      </span>
                      {thu ? (
                        <span className="sr-only">
                          {m.nhan}
                          {m.so !== null ? `, ${m.so} việc` : ''}
                        </span>
                      ) : (
                        <>
                          <span className="flex-1 text-[17px]">{m.nhan}</span>
                          {m.so !== null ? (
                            <span className="text-[15px] text-foreground tabular-nums">{m.so}</span>
                          ) : null}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={doiThu}
        className={`flex min-h-11 items-center gap-3 border-t border-ban-vien text-muted-foreground hover:bg-ban-nen ${
          thu ? 'justify-center px-0' : 'px-4'
        }`}
      >
        {thu ? (
          <PanelLeftOpen className="size-5" aria-hidden />
        ) : (
          <PanelLeftClose className="size-5" aria-hidden />
        )}
        {thu ? null : <span className="text-[17px]">Thu thanh việc</span>}
        <span className="sr-only">{thu ? 'Mở thanh việc' : 'Thu thanh việc'}</span>
      </button>
    </nav>
  );
}

// ── Thẻ người trên canvas ───────────────────────────────────────────────────────────────────

type DuLieuNut = {
  ten: string;
  vo: string | null;
  doi: number;
  chi: string;
  laGocToc: boolean;
  tinCay: Nguoi['tinCay'];
  tonNghi: boolean;
  laNeo: boolean;
  laXin: boolean;
  ghiChuXin?: string;
  cao: number;
};

/**
 * THẺ NGƯỜI — nhỏ gọn, không bao giờ tràn.
 *
 * Ba luật giữ cho chữ nằm trong thẻ: `overflow-hidden` ở vỏ, `min-w-0` + `truncate` ở mọi ô chữ
 * co giãn, và `shrink-0` ở mọi thứ KHÔNG được co (chấm tin cậy, chip đời, icon).
 *
 * Tiết kiệm diện tích bằng CHIP thay chữ: số đời là một ô vuông nhỏ; "gốc của tộc" là vương miện
 * chứ không phải mười một ký tự. Nhưng ba mức tin cậy KHÔNG được mã hoá chỉ bằng màu
 * (DESIGN.md § Colors) — nên chấm ở đây mang HÌNH khác nhau (đặc / nửa / rỗng), kèm `title` và
 * chữ cho trình đọc màn hình. Chữ đầy đủ vẫn nằm ở cột phải, nơi có chỗ.
 */
function TheNguoi({ data, selected }: NodeProps) {
  const d = data as unknown as DuLieuNut;
  const vien = d.laXin
    ? 'border-2 border-dashed border-destructive van-ton-nghi'
    : selected
      ? 'border-2 border-foreground bg-ban-o'
      : d.laNeo
        ? 'border-2 border-primary bg-ban-o'
        : d.tonNghi
          ? 'border border-dashed van-ton-nghi'
          : 'border border-ban-vien bg-ban-o';

  return (
    <div
      className={`relative overflow-hidden rounded-md ${vien}`}
      style={{ width: RONG, height: d.cao }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div className="flex h-full flex-col justify-center gap-0.5 px-2.5 text-left">
        <div className="flex items-center gap-1.5">
          <p className="font-pha min-w-0 flex-1 truncate text-[17px] leading-tight font-semibold">
            {d.ten}
          </p>
          {d.laXin ? null : <ChamNho muc={d.tinCay} />}
        </div>

        {d.vo ? (
          <p className="flex items-center gap-1 text-[15px] leading-tight text-muted-foreground">
            <Users className="size-3.5 shrink-0" aria-hidden />
            <span className="sr-only">vợ: </span>
            <span className="min-w-0 truncate">{d.vo}</span>
          </p>
        ) : null}

        <div className="flex items-center gap-1.5 text-[15px] leading-tight text-muted-foreground">
          {d.laXin ? (
            <span className="min-w-0 truncate text-destructive">{d.ghiChuXin}</span>
          ) : (
            <>
              <span
                className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-sm border border-ban-vien px-1 tabular-nums"
                title={`đời ${d.doi}`}
              >
                <span aria-hidden>{d.doi}</span>
                <span className="sr-only">đời {d.doi}</span>
              </span>
              {d.laGocToc ? (
                <>
                  <Crown className="size-3.5 shrink-0" aria-hidden />
                  <span className="sr-only">gốc của tộc</span>
                </>
              ) : (
                <span className="min-w-0 truncate">{d.chi}</span>
              )}
            </>
          )}
        </div>
      </div>

      {d.laNeo ? (
        <span className="absolute -top-2.5 left-2.5 rounded-4xl bg-primary px-2 text-[15px] leading-tight text-primary-foreground">
          tâm
        </span>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

const KIEU_NUT: NodeTypes = { nguoi: TheNguoi };

function KhungTrong({
  nodes,
  edges,
  onChon,
  khoaNeo,
}: {
  nodes: Node[];
  edges: Edge[];
  onChon: (id: string) => void;
  /** Đổi khoá này = neo đã dời ⇒ ôm lại khung nhìn. Chọn người thì KHÔNG đổi. */
  khoaNeo: string;
}) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const t = setTimeout(() => void fitView({ padding: 0.14, duration: 260 }), 0);
    return () => clearTimeout(t);
  }, [khoaNeo, fitView]);

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
      onNodeClick={(_, n) => onChon(n.id)}
      style={{ background: 'transparent' }}
    >
      <Controls
        showInteractive={false}
      />
    </ReactFlow>
  );
}

// ── Ô tìm ───────────────────────────────────────────────────────────────────────────────────

function OTim({ onChonNguoi }: { onChonNguoi: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [mo, setMo] = useState(false);
  const hop = useRef<HTMLDivElement>(null);

  const khoa = boDau(q.trim());
  const hitNguoi = khoa ? NGUOI.filter((n) => boDau(n.hoTen).includes(khoa)).slice(0, 5) : [];
  const hitNoi = khoa ? NOI.filter((n) => boDau(`${n.ten} ${n.thuoc}`).includes(khoa)) : [];

  useEffect(() => {
    const ngoai = (e: MouseEvent) => {
      if (hop.current && !hop.current.contains(e.target as globalThis.Node)) setMo(false);
    };
    document.addEventListener('mousedown', ngoai);
    return () => document.removeEventListener('mousedown', ngoai);
  }, []);

  return (
    <div ref={hop} className="relative w-full max-w-[560px]">
      <div className="flex min-h-11 items-center gap-2 rounded-md border border-ban-vien bg-ban-o px-3">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setMo(true);
          }}
          onFocus={() => setMo(true)}
          placeholder="Tìm người, chi, hoặc nơi — gõ để dời tâm"
          aria-label="Tìm người, chi, hoặc nơi"
          className="min-h-11 w-full bg-transparent text-[17px] outline-none placeholder:text-muted-foreground"
        />
      </div>

      {mo && khoa && (hitNguoi.length > 0 || hitNoi.length > 0) ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-ban-vien bg-ban-o">
          {hitNguoi.length > 0 ? (
            <ul className="py-1">
              {hitNguoi.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChonNguoi(n.id);
                      setMo(false);
                      setQ('');
                    }}
                    className="flex min-h-11 w-full items-center gap-3 px-3 text-left hover:bg-ban-nen"
                  >
                    <Crosshair className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="font-pha flex-1 text-[17px]">{n.hoTen}</span>
                    <span className="text-[15px] text-muted-foreground">
                      đời {doiCua(n.id)} · {nhanChi(n.id)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {hitNoi.length > 0 ? (
            <ul className="border-t border-ban-vien py-1">
              {hitNoi.map((n, i) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center gap-3 px-3 text-left hover:bg-ban-nen"
                  >
                    <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="flex-1 text-[17px]">
                      {n.ten}
                      <span className="text-muted-foreground"> · {n.thuoc}</span>
                    </span>
                    <span className="text-[15px] text-muted-foreground">{n.soNguoi} người</span>
                    <span className="text-[15px]">{i === 0 ? '● chắc' : '○ vừa'}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Cột phải: chồng khẳng định ──────────────────────────────────────────────────────────────

function Khoi({
  ten,
  kieu,
  children,
}: {
  ten: string;
  kieu?: 'mau-thuan' | 'noi-tiep';
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-ban-vien px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] tracking-wide text-muted-foreground uppercase">{ten}</h3>
        {kieu === 'mau-thuan' ? (
          <span className="flex items-center gap-1 text-[15px] text-destructive">
            <TriangleAlert className="size-3.5" aria-hidden />
            chọn một
          </span>
        ) : kieu === 'noi-tiep' ? (
          <span className="text-[15px] text-muted-foreground">theo thời gian</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function GhiThem() {
  return (
    <button
      type="button"
      className="flex min-h-11 items-center gap-1.5 text-[17px] text-primary underline-offset-4 hover:underline"
    >
      <Plus className="size-4" aria-hidden />
      ghi thêm
    </button>
  );
}

function Dong({
  giaTri,
  chinhThuc,
  xuatXu,
  lech,
}: {
  giaTri: string;
  chinhThuc: boolean;
  xuatXu: string;
  lech?: boolean;
}) {
  return (
    <li className="flex min-h-11 items-start gap-2 py-1.5">
      <span className="mt-0.5 text-[17px]" aria-hidden>
        {chinhThuc ? '●' : '○'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[17px] font-semibold">{giaTri}</span>
          <span className="text-[15px] text-muted-foreground">
            {chinhThuc ? 'chính thức' : 'tạm'}
          </span>
          {lech ? (
            <span className="rounded-4xl bg-canh-bao-nen px-2 text-[15px] text-destructive">
              lệch
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[15px] text-muted-foreground">{xuatXu}</span>
      </span>
    </li>
  );
}

function PanelNguoi({ nguoi, laNeo }: { nguoi: Nguoi; laNeo: boolean }) {
  const kd = khangDinhVe(nguoi.id);
  const sinh = kd.filter((k) => k.menhDe.includes('sinh năm'));
  const quanHe = kd.filter((k) => k.menhDe.includes('con của') || k.menhDe.includes('anh ruột'));
  const khac = kd.filter((k) => !sinh.includes(k) && !quanHe.includes(k));
  const noi = NOI_CUA_NGUOI[nguoi.id] ?? [];
  const vo = voCua(nguoi.id);

  return (
    <>
      <header className="border-b border-ban-vien px-4 py-3">
        <h2 className="font-pha text-[23px] leading-tight font-semibold">{nguoi.hoTen}</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          đời {doiCua(nguoi.id)} · {nhanChi(nguoi.id)} · {nguoi.conSong ? 'còn sống' : 'đã mất'}
          {laNeo ? ' · đang là tâm' : ''}
        </p>
        {vo ? (
          <p className="mt-2 flex items-center gap-1.5 text-[17px]">
            <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-muted-foreground">vợ</span>
            <span className="font-pha font-semibold">{vo.hoTen}</span>
          </p>
        ) : null}
      </header>

      <Khoi ten="Năm sinh" kieu={sinh.length > 1 ? 'mau-thuan' : undefined}>
        {sinh.length === 0 ? (
          <p className="py-1.5 text-[17px] text-muted-foreground">chưa có khẳng định nào</p>
        ) : (
          <ul>
            {sinh.map((k) => (
              <Dong
                key={k.id}
                giaTri={k.menhDe.replace(`${nguoi.hoTen} sinh năm `, '')}
                chinhThuc={k.tang === 'chinh-pha'}
                xuatXu={k.nguon}
                lech={sinh.length > 1}
              />
            ))}
          </ul>
        )}
        <GhiThem />
      </Khoi>

      {quanHe.length > 0 ? (
        <Khoi ten="Quan hệ">
          <ul>
            {quanHe.map((k) => (
              <Dong
                key={k.id}
                giaTri={k.menhDe.replace(`${nguoi.hoTen} là `, '')}
                chinhThuc={k.tang === 'chinh-pha'}
                xuatXu={k.nguon}
              />
            ))}
          </ul>
        </Khoi>
      ) : null}

      <Khoi ten="Nơi" kieu={noi.length > 1 ? 'noi-tiep' : undefined}>
        {noi.length === 0 ? (
          <p className="py-1.5 text-[17px] text-muted-foreground">chưa có khẳng định nào</p>
        ) : (
          <ul>
            {noi.map((m, i) => {
              const chon = noiTheoId(m.noiId);
              return (
                <li key={`${m.noiId}-${i}`} className="flex min-h-11 items-start gap-2 py-1.5">
                  <MapPin className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold">
                      {chon?.ten}
                      <span className="font-normal text-muted-foreground"> · {chon?.thuoc}</span>
                    </span>
                    <span className="mt-0.5 block text-[15px] text-muted-foreground">
                      {NHAN_VAI_NOI[m.vai]}
                      {m.moc ? ` · ${m.moc}` : ''}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <GhiThem />
      </Khoi>

      {khac.length > 0 ? (
        <Khoi ten="Khác">
          <ul>
            {khac.map((k) => (
              <Dong
                key={k.id}
                giaTri={k.menhDe}
                chinhThuc={k.tang === 'chinh-pha'}
                xuatXu={k.nguon}
              />
            ))}
          </ul>
        </Khoi>
      ) : null}

      <Khoi ten="Mất">
        <p className="py-1.5 text-[17px] text-muted-foreground">
          {nguoi.namMat ? `${nguoi.namMat}` : 'chưa có khẳng định nào'}
        </p>
        <GhiThem />
      </Khoi>
    </>
  );
}

function PanelXin() {
  const x = XIN_VAO_PHA[0]!;
  const canh = nguoiTheoId(x.canhNguoiId);
  return (
    <>
      <header className="border-b border-ban-vien px-4 py-3">
        <h2 className="font-pha text-[23px] leading-tight font-semibold">{x.hoTen}</h2>
        <p className="mt-1 text-[15px] text-destructive">
          xin vào phả · {x.xinNgay} · tài khoản {x.taiKhoan}
        </p>
      </header>

      <Khoi ten="Nhận là">
        <p className="py-1.5 text-[17px]">
          {x.nhanLaGi} — đứng cạnh <span className="font-pha font-semibold">{canh?.hoTen}</span>,
          đời {canh ? doiCua(canh.id) + 1 : '?'}.
        </p>
      </Khoi>

      <Khoi ten="Bảo lãnh">
        {x.baoLanh ? (
          <p className="py-1.5 text-[17px]">
            <span className="font-pha font-semibold">{x.baoLanh}</span> đứng ra bảo lãnh.
          </p>
        ) : (
          <p className="border-l-2 border-destructive bg-canh-bao-nen px-3 py-2 text-[17px]">
            Chưa ai trong họ bảo lãnh.
          </p>
        )}
      </Khoi>

      <div className="flex flex-wrap gap-3 px-4 py-4">
        <button
          type="button"
          className="min-h-11 rounded-md bg-primary px-5 text-[17px] text-primary-foreground"
        >
          Nhận vào phả
        </button>
        <button
          type="button"
          className="min-h-11 rounded-md border border-ban-vien bg-ban-o px-5 text-[17px]"
        >
          Từ chối
        </button>
      </div>
    </>
  );
}

// ── Trang ───────────────────────────────────────────────────────────────────────────────────

export default function BanLamViecPage() {
  const [neoId, setNeoId] = useState('n-005');
  const [chonId, setChonId] = useState('n-009');
  const [banKinh, setBanKinh] = useState(2);
  const [thu, setThu] = useState(false);

  const xin = XIN_VAO_PHA[0]!;

  const { nodes, edges } = useMemo(() => {
    const kc = lanCan(neoId, banKinh);
    const trong = (id: string) => kc.has(id);

    const dauVao: { id: string; chaId: string | null }[] = [...kc.keys()].map((id) => {
      const n = nguoiTheoId(id);
      return { id, chaId: n?.chaId && trong(n.chaId) ? n.chaId : null };
    });
    if (trong(xin.canhNguoiId)) dauVao.push({ id: xin.id, chaId: xin.canhNguoiId });

    // Chiều cao là HÀM, không phải hằng số: thẻ có vợ cao hơn thẻ không. Truyền hằng số vào đây
    // chính là cách lỗi "thẻ đè lên nhau" ra đời.
    const viTri = xepCay(dauVao, {
      rong: RONG,
      hoNgang: 30,
      hoDoc: 56,
      cao: (id) => (id === xin.id ? CAO_TRON : caoThe(id)),
    });

    const ns: Node[] = dauVao.map((d) => {
      const p = viTri.get(d.id) ?? { x: 0, y: 0 };
      if (d.id === xin.id) {
        return {
          id: d.id,
          type: 'nguoi',
          position: p,
          selected: d.id === chonId,
          data: {
            ten: xin.hoTen,
            vo: null,
            doi: 0,
            chi: '',
            laGocToc: false,
            tinCay: 'ton-nghi',
            tonNghi: true,
            laNeo: false,
            laXin: true,
            ghiChuXin: `xin vào phả · ${xin.xinNgay}`,
            cao: CAO_TRON,
          } satisfies DuLieuNut,
        };
      }
      const n = nguoiTheoId(d.id)!;
      const chi = nhanChi(n.id);
      const vo = voCua(n.id);
      return {
        id: d.id,
        type: 'nguoi',
        position: p,
        selected: d.id === chonId,
        data: {
          ten: n.hoTen,
          vo: vo?.hoTen ?? null,
          doi: doiCua(n.id),
          chi,
          laGocToc: chi === 'gốc của tộc',
          tinCay: n.tinCay,
          tonNghi: n.tang === 'ton-nghi',
          laNeo: d.id === neoId,
          laXin: false,
          cao: caoThe(n.id),
        } satisfies DuLieuNut,
      };
    });

    const es: Edge[] = dauVao
      .filter((d) => d.chaId)
      .map((d) => ({
        id: `${d.chaId}-${d.id}`,
        source: d.chaId!,
        target: d.id,
        type: 'smoothstep',
        style:
          d.id === xin.id
            ? { stroke: 'var(--color-destructive)', strokeWidth: 2, strokeDasharray: '6 5' }
            : { stroke: 'var(--color-ban-vien)', strokeWidth: 1.5 },
      }));

    return { nodes: ns, edges: es };
  }, [neoId, chonId, banKinh, xin]);

  const chon = nguoiTheoId(chonId);
  const datLamTam = useCallback(() => {
    if (chon) setNeoId(chon.id);
  }, [chon]);

  const neo = nguoiTheoId(neoId);

  return (
    <div className="flex h-dvh flex-col bg-ban-nen">
      <header className="flex shrink-0 items-center gap-5 border-b border-ban-vien bg-ban-o px-5 py-2.5">
        <span className="text-[17px] font-semibold whitespace-nowrap">Bàn làm việc</span>
        <OTim
          onChonNguoi={(id) => {
            setNeoId(id);
            setChonId(id);
          }}
        />
        <span className="ml-auto text-[15px] whitespace-nowrap text-muted-foreground">
          Nguyễn Quang Hiệp · quản trị
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        <ThanhViec thu={thu} doiThu={() => setThu((v) => !v)} />

        <div className="relative min-w-0 flex-1">
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={datLamTam}
              disabled={!chon || chon.id === neoId}
              className="flex min-h-11 items-center gap-2 rounded-md border border-ban-vien bg-ban-o px-3 text-[17px] disabled:text-muted-foreground"
            >
              <Crosshair className="size-4" aria-hidden />
              Đặt làm tâm
            </button>
            <button
              type="button"
              onClick={() => setBanKinh((b) => (b >= 5 ? 2 : b + 1))}
              className="flex min-h-11 items-center gap-2 rounded-md border border-ban-vien bg-ban-o px-3 text-[17px]"
            >
              <ChevronsUpDown className="size-4" aria-hidden />
              Mở thêm một đời
            </button>
            <span className="rounded-md border border-ban-vien bg-ban-o px-3 py-1.5 text-[15px] text-muted-foreground">
              tâm: <span className="font-pha text-foreground">{neo?.hoTen}</span> · bán kính{' '}
              {banKinh}
            </span>
          </div>

          <ReactFlowProvider>
            <KhungTrong
              nodes={nodes}
              edges={edges}
              onChon={setChonId}
              khoaNeo={`${neoId}|${banKinh}`}
            />
          </ReactFlowProvider>
        </div>

        <aside
          className="w-90 shrink-0 overflow-y-auto border-l border-ban-vien bg-ban-o"
          aria-label="Người đang chọn"
        >
          {chonId === xin.id ? (
            <PanelXin />
          ) : chon ? (
            <PanelNguoi nguoi={chon} laNeo={chon.id === neoId} />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
