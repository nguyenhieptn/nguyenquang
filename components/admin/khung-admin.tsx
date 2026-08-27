'use client';

/**
 * KHUNG `/admin` — bàn làm việc là MỘT trang: thanh trên · thanh việc trái · vùng nội dung.
 *
 * ── Vì sao khung nằm ở LAYOUT chứ không ở từng trang ─────────────────────────────────────────
 * Bản cũ (`components/pha/thanh-ban-duyet.tsx`) để TỪNG TRANG tự ghép chrome. Kết quả đếm được
 * trước khi xoá: 2/4 màn chính quên hẳn điều hướng, mọi màn lỗi và màn tải cũng quên, và bốn bề
 * rộng khác nhau (720 / 900 / 1100 / 1280) không theo hệ nào. Chừng nào chrome còn do trang tự
 * ghép thì sẽ luôn có trang quên — nên quyền sở hữu chuyển hẳn về đây.
 *
 * ── MỘT hệ bề rộng ──────────────────────────────────────────────────────────────────────────
 * Vùng nội dung lấy TRỌN bề ngang còn lại, đệm `px-6 py-8`. Không màn nào tự đặt `max-w` cho
 * khung của mình nữa. Chữ tự giới hạn bằng ĐỘ DÀI DÒNG (`max-w-[70ch]`) — đó là luật đọc, không
 * phải luật bố cục; bảng và canvas vì thế vẫn được dùng hết bề ngang màn hình.
 *
 * ── Đúng một `<h1>` ─────────────────────────────────────────────────────────────────────────
 * Tiêu đề màn đọc từ `MAN` trong `man-admin.ts` theo đường hiện tại. Trang con KHÔNG dựng `<h1>`;
 * các bước bên trong một màn (ví dụ "Xem trước so khớp" của Nạp khung) là `<h2>`.
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § IA › Bề mặt B — một trang, thanh việc luôn có mặt
 *   · EXPERIENCE.md § Bề mặt B — sàn chữ 17px áp nguyên; chật thì BỚT MỤC, không thu chữ
 *   · EXPERIENCE.md § Voice and Tone — cấm ngôi hai, cấm cả chữ "bạn"
 *   · DESIGN.md § Colors › Bề mặt B — khung TRẦN: `ban-nen` / `ban-o` / `ban-vien`, không giấy dó
 *   · DESIGN.md § Elevation — không đổ bóng, phân tầng bằng viền
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Crosshair,
  Inbox,
  LayoutDashboard,
  MapPin,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Search,
  Unlink,
  Upload,
  UserRoundCheck,
  UserRoundPlus,
  type LucideIcon,
} from 'lucide-react';
import { MAN, NHOM, manTheoDuong, type HamTim, type KetQuaTim, type KhoaMan, type SoViec } from './man-admin';

/** Icon theo khoá màn — tra ở phía client vì component không đi qua ranh giới server→client. */
const ICON: Record<KhoaMan, LucideIcon> = {
  nha: LayoutDashboard,
  cay: Network,
  'hang-cho': Inbox,
  'duyet-vao-pha': UserRoundCheck,
  'hop-nhat': Unlink,
  'noi-chon': MapPin,
  'so-dong-ho': ScrollText,
  'nap-khung': Upload,
};

/**
 * Nhớ thu/mở cho người xem ấy.
 *
 * Là một KHO NGOÀI đọc bằng `useSyncExternalStore` chứ không phải `useEffect` + `setState`:
 * localStorage chỉ tồn tại ở trình duyệt, nên server luôn dựng ở trạng thái MỞ và React tự
 * hoà lại sau khi hydrate — không nhấp nháy, không cascading render.
 *
 * Mọi lối vào đều bọc `try/catch`: cửa sổ riêng tư và trình duyệt chặn lưu vẫn phải dựng được
 * khung. Không đọc được thì mặc định MỞ.
 */
const KHOA_LUU = 'admin:thanh-viec-thu';

const NGHE = new Set<() => void>();
/** Cache để `getSnapshot` trả cùng một giá trị giữa hai lần đổi — React đòi vậy. */
let THU_HIEN: boolean | null = null;

/**
 * Tab KHÁC vừa thu/mở. Không nghe thì cache module ở tab này thành cũ vĩnh viễn: bàn bên kia đã
 * thu, bàn bên này vẫn mở, và cú bấm kế tiếp ở đây tính `!anhChupThu()` trên giá trị cũ nên ghi
 * đè đúng cái tab kia vừa đặt. `storage` không bắn ở chính tab đã ghi — đó là điều ta muốn.
 */
function dongBoTuTabKhac(e: StorageEvent): void {
  if (e.key !== KHOA_LUU) return;
  THU_HIEN = e.newValue === '1';
  for (const goiLai of NGHE) goiLai();
}

function dangKyThu(goiLai: () => void): () => void {
  if (NGHE.size === 0) window.addEventListener('storage', dongBoTuTabKhac);
  NGHE.add(goiLai);
  return () => {
    NGHE.delete(goiLai);
    if (NGHE.size === 0) window.removeEventListener('storage', dongBoTuTabKhac);
  };
}

function anhChupThu(): boolean {
  if (THU_HIEN === null) {
    try {
      THU_HIEN = window.localStorage.getItem(KHOA_LUU) === '1';
    } catch {
      THU_HIEN = false;
    }
  }
  return THU_HIEN;
}

/** Trên server không có localStorage — bàn luôn mở lần dựng đầu. */
function anhChupThuServer(): boolean {
  return false;
}

/**
 * "Người dùng đã tự chỉnh" phải sống qua F5 — nếu không thì lời hứa ngay dưới đây sai.
 *
 * Ca hỏng: người vận hành thích thanh việc mở, vào màn cây (màn xin thu), bấm MỞ. `ghiThu(false)`
 * lưu "mở", `daChinh` chỉ nằm trong state React. Nhấn F5 ⇒ `daChinh` về `false` ⇒ màn cây xin thu
 * lần nữa ⇒ đúng lựa chọn họ vừa nói ra bị đè, trên đúng màn họ vừa nói nó ra.
 *
 * `sessionStorage` chứ không `localStorage`: đây là "trong phiên này thôi hỏi lại", không phải
 * một sở thích lâu dài. Đóng tab là quên, và đó đúng là nghĩa của chữ *phiên*.
 */
const KHOA_DA_CHINH = 'admin:thanh-viec-da-chinh';

function daChinhDaLuu(): boolean {
  try {
    return window.sessionStorage.getItem(KHOA_DA_CHINH) === '1';
  } catch {
    return false; // cửa sổ riêng tư, trình duyệt chặn lưu — không phải lỗi để báo
  }
}

function ghiDaChinh(): void {
  try {
    window.sessionStorage.setItem(KHOA_DA_CHINH, '1');
  } catch {
    /* không lưu được thì phiên sau hỏi lại — chấp nhận được */
  }
}

function ghiThu(v: boolean): void {
  THU_HIEN = v;
  try {
    window.localStorage.setItem(KHOA_LUU, v ? '1' : '0');
  } catch {
    /* không lưu được thì lần sau mở lại — không phải lỗi để báo */
  }
  for (const goiLai of NGHE) goiLai();
}

/**
 * ── Đường cho story 5-2 ────────────────────────────────────────────────────────────────────
 * Thu thanh việc là THỦ CÔNG, trừ màn cây: canvas cần bề ngang hơn mọi màn khác, nên nó XIN thu
 * lúc mở. Bày ra qua context để 5-2 không phải dựng lại khung.
 *
 * `xinThu` KHÁC `ghiThu` ở đúng chỗ quan trọng: nó là lời xin của MỘT MÀN, không phải quyết định
 * của người dùng. Nó không chạm `localStorage`, và nó tự im nếu người dùng đã tự chỉnh — nếu
 * không thì ghé màn cây một lần là thanh việc thu ở mọi màn, mọi phiên sau, mà không ai bảo nó
 * làm thế.
 */
type NgamThanhViec = { thu: boolean; xinThu: (v: boolean) => void };
const CtxThanhViec = createContext<NgamThanhViec>({ thu: false, xinThu: () => {} });

export function useThanhViec(): NgamThanhViec {
  return useContext(CtxThanhViec);
}

// ── Ô tìm ───────────────────────────────────────────────────────────────────────────────────

function OTim({ tim }: { tim: HamTim }) {
  const [q, setQ] = useState('');
  /**
   * Kết quả mang theo TỪ KHOÁ đã sinh ra nó. Không phải để đẹp: nếu chỉ giữ mảng, kết quả của
   * từ khoá cũ còn nằm trên màn trong lúc gõ từ khoá mới — người vận hành bấm nhầm sang một
   * người khác mà không thấy gì sai. So khoá xong mới bày, và ô rỗng thì tự nó rỗng.
   */
  const [ketQua, setKetQua] = useState<{ tuKhoa: string; ds: KetQuaTim[]; loi?: boolean }>({
    tuKhoa: '',
    ds: [],
  });
  const [mo, setMo] = useState(false);
  const hop = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const khoa = q.trim();
  const ds = ketQua.tuKhoa === khoa ? ketQua.ds : [];
  const dangTim = khoa.length >= 2 && ketQua.tuKhoa !== khoa;

  /**
   * Gõ tới đâu tìm tới đó, nhưng chờ 300ms cho tay dừng — mỗi lượt là một vòng vào core.
   *
   * `conHieuLuc` KHÔNG thừa. Dọn dẹp chỉ huỷ được cái hẹn giờ, không huỷ được lượt đã bay đi: gõ
   * `ngu` (chậm) rồi `nguyen` (nhanh), `nguyen` về trước, `ngu` về sau ghi đè — `ketQua.tuKhoa`
   * thành `'ngu'` trong khi ô đang là `'nguyen'`, nên `ds` rỗng và `dangTim` bật vĩnh viễn dù
   * không còn lượt nào đang bay. Chốt hiệu lực theo lượt là cách rẻ nhất để lượt cũ tự im.
   */
  useEffect(() => {
    if (khoa.length < 2) return;
    let conHieuLuc = true;
    const t = setTimeout(() => {
      tim(khoa)
        .then((ds) => {
          if (conHieuLuc) setKetQua({ tuKhoa: khoa, ds });
        })
        .catch(() => {
          // MỌI lối hỏng đổ về đây: mất mạng, 500, bản triển khai đã đổi, và cả lỗi `Result` của
          // core — `timNguoi` NÉM chứ không quy về mảng rỗng, vì rỗng nghĩa là "không có ai tên
          // ấy" và đó là câu không được nói khi chưa đọc được gì. Nuốt im là treo màn.
          if (conHieuLuc) setKetQua({ tuKhoa: khoa, ds: [], loi: true });
        });
    }, 300);
    return () => {
      conHieuLuc = false;
      clearTimeout(t);
    };
  }, [khoa, tim]);

  useEffect(() => {
    const ngoai = (e: MouseEvent) => {
      if (hop.current && !hop.current.contains(e.target as globalThis.Node)) setMo(false);
    };
    document.addEventListener('mousedown', ngoai);
    return () => document.removeEventListener('mousedown', ngoai);
  }, []);

  const loi = ketQua.tuKhoa === khoa && ketQua.loi === true;
  const bayKetQua = mo && khoa.length >= 2;

  return (
    <div
      ref={hop}
      onKeyDown={(e) => {
        // Escape là lối ra duy nhất không cần chuột. Đóng bảng, giữ nguyên chữ đã gõ.
        if (e.key !== 'Escape') return;
        setMo(false);
        /**
         * CHẶN NỔI BỌT (sửa 26/08 sau code review story 6-9).
         *
         * `app/admin/cay/cay-client.tsx` nghe `keydown` ở cấp CỬA SỔ để `Esc` bỏ biểu mẫu thêm
         * người. Listener uỷ nhiệm của React nằm ở `document`, tức ngay trước `window` — nên
         * đóng bảng gợi ý của ô tìm này sẽ đóng luôn biểu mẫu bên kia màn, hoặc tệ hơn: bật câu
         * hỏi *"bỏ những gì vừa gõ?"* cho một thao tác chẳng liên quan gì tới nó.
         *
         * Đóng từ TRONG ra NGOÀI — luật chung của mọi app canvas, và ở đây lớp trong là bảng này.
         */
        e.stopPropagation();
      }}
      className="relative w-full max-w-[560px]"
    >
      <div className="flex min-h-11 items-center gap-2 rounded-md border border-ban-vien bg-ban-o px-3">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setMo(true);
          }}
          onFocus={() => setMo(true)}
          placeholder="Tìm người trong phả"
          aria-label="Tìm người trong phả"
          className="min-h-11 w-full bg-transparent text-[17px] outline-none placeholder:text-muted-foreground"
        />
      </div>

      {bayKetQua ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-ban-vien bg-ban-o">
          {/* KHÔNG khai `role="combobox"` ở ô nhập. Khai thì phải kèm phím mũi tên và
              `aria-activedescendant`, mà hai thứ ấy còn nợ (xem `deferred-work.md`) — hứa một
              hộp chọn rồi không cho lái bằng bàn phím còn tệ hơn không hứa. Cái RẺ mà thật sự
              giúp được ngay là báo miệng trạng thái: `role="status"` đọc "Đang tìm…" và "không
              có ai" mà không cần người dùng nhìn màn hình. Escape đóng bảng, xử ở `onKeyDown`
              của khối bao. */}
          {ds.length === 0 ? (
            <p role="status" className="px-3 py-3 text-[17px] text-muted-foreground">
              {dangTim
                ? 'Đang tìm…'
                : loi
                  ? 'Không tìm được lúc này — sửa từ khoá để thử lại.'
                  : 'Không có ai trùng tên ấy trong phần phả xem được.'}
            </p>
          ) : (
            <ul className="py-1">
              {ds.map((n) => (
                <li key={n.personId}>
                  <button
                    type="button"
                    onClick={() => {
                      setMo(false);
                      setQ('');
                      // Ô tìm DỜI TÂM CANVAS, không đẩy ra khỏi bàn làm việc (story 5-2 trả nợ
                      // 5-1, nơi nó còn nhảy sang `/nguoi/[id]` của bề mặt A công cộng).
                      //
                      // Neo đi qua URL chứ không qua context, và đó là điều làm ô này dùng được
                      // từ MỌI màn của `/admin`: đang ở Nạp khung mà tìm một người thì sang thẳng
                      // màn cây với người ấy làm tâm.
                      router.push(`/admin/cay?neo=${encodeURIComponent(n.personId)}`);
                    }}
                    className="flex min-h-11 w-full items-center gap-3 px-3 text-left hover:bg-ban-nen"
                  >
                    <Crosshair className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="font-pha min-w-0 flex-1 truncate text-[17px]">{n.hoTen}</span>
                    {n.nguCanh ? (
                      <span className="shrink-0 text-[15px] text-muted-foreground">{n.nguCanh}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Thanh việc ──────────────────────────────────────────────────────────────────────────────

function ThanhViec({
  so,
  dangMo,
  thu,
  doiThu,
}: {
  so: SoViec;
  dangMo: KhoaMan | null;
  thu: boolean;
  doiThu: () => void;
}) {
  return (
    <nav
      id="thanh-viec"
      aria-label="Thanh việc"
      className={`flex shrink-0 flex-col border-r border-ban-vien bg-ban-o ${thu ? 'w-16' : 'w-60'}`}
    >
      {/*
        THANH GHI 1 — HÀNH ĐỘNG, không phải mục điều hướng (soi lại thanh việc 24/08).
        Nó đứng NGOÀI `MAN` và có gạch ngăn với ba nhóm bên dưới, vì nó trả lời câu hỏi khác hẳn:
        ba nhóm kia nói "cái gì đang đợi tôi", nút này nói "tôi muốn làm gì".

        KHÔNG mang son. `DESIGN.md § Colors` cho son đúng một nghĩa — *đã chốt* — mà nút này chỉ
        MỞ biểu mẫu, chưa ghi gì. Son thuộc về nút gửi bên trong biểu mẫu.
      */}
      <div className={`border-b border-ban-vien py-3 ${thu ? 'px-2' : 'px-3'}`}>
        <Link
          href="/admin/cay?them=roi"
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
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        {NHOM.map((g) => {
          const muc = MAN.filter((m) => m.nhom === g.khoa);
          if (muc.length === 0) return null;
          return (
            <div key={g.khoa} className="mb-3">
              {/* Khi thu, nhãn nhóm nhường chỗ cho một gạch — nhóm vẫn đọc được bằng mắt. */}
              {thu ? (
                <div className="mx-3 mb-1 border-t border-ban-vien" />
              ) : (
                <p className="px-4 pb-1 text-[15px] tracking-wide text-muted-foreground uppercase">
                  {g.ten}
                </p>
              )}
              <ul>
                {muc.map((m) => {
                  const Icon = ICON[m.khoa];
                  // `undefined` = mục không có hàng chờ; `null` = có nhưng đọc hỏng. Cả hai đều
                  // KHÔNG hiện `0` — số 0 giả làm người vận hành tin là đã sạch việc.
                  const n = m.coSo ? (so[m.khoa] ?? null) : undefined;
                  // Ray rộng 68px (`w-16` = 4rem, mà gốc chữ là 17px — không phải 64px), số ở sàn 17px: hai chữ số vừa khít, ba chữ số thì tràn ra
                  // ngoài viền và bị `overflow-y-auto` của vùng cuộn cắt cụt — "1247" đọc thành
                  // một số khác hẳn. Trần `99+` giữ nghĩa "nhiều hơn sức đếm"; con số thật vẫn
                  // còn nguyên ở `title` và ở nhãn cho trình đọc màn hình.
                  const nRay = n != null && n > 99 ? '99+' : n;
                  const mo = m.khoa === dangMo;
                  return (
                    <li key={m.khoa}>
                      <Link
                        href={m.duong}
                        aria-current={mo ? 'page' : undefined}
                        title={thu ? `${m.nhan}${n != null ? ` — ${n}` : ''}` : undefined}
                        className={`flex min-h-11 w-full items-center gap-3 border-l-2 text-left ${
                          thu ? 'justify-center px-0' : 'px-4'
                        } ${
                          mo
                            ? 'border-foreground bg-ban-nen font-semibold'
                            : 'border-transparent text-muted-foreground hover:bg-ban-nen'
                        }`}
                      >
                        <span className="relative shrink-0">
                          <Icon className="size-5" aria-hidden />
                          {/* Thu rồi RAY VẪN GIỮ SỐ. Mất số là mất hộp thư đến giữa lúc làm việc.
                              `aria-hidden`: nhãn `sr-only` ngay dưới đã đọc con số rồi, để đây
                              đọc nữa thành "12 — Hàng chờ khẳng định, 12 việc". */}
                          {thu && n != null ? (
                            <span
                              aria-hidden
                              className="absolute -top-1.5 -right-2 rounded-4xl bg-foreground px-1 text-[17px] leading-tight text-ban-o tabular-nums"
                            >
                              {nRay}
                            </span>
                          ) : null}
                        </span>
                        {thu ? (
                          <span className="sr-only">
                            {m.nhan}
                            {n != null ? `, ${n} việc` : ''}
                          </span>
                        ) : (
                          <>
                            <span className="flex-1 text-[17px]">{m.nhan}</span>
                            {n != null ? (
                              <span className="text-[17px] text-foreground tabular-nums">{n}</span>
                            ) : null}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={doiThu}
        aria-expanded={!thu}
        aria-controls="thanh-viec"
        className={`flex min-h-11 items-center gap-3 border-t border-ban-vien text-muted-foreground hover:bg-ban-nen ${
          thu ? 'justify-center px-0' : 'px-4'
        }`}
      >
        {thu ? (
          <PanelLeftOpen className="size-5" aria-hidden />
        ) : (
          <PanelLeftClose className="size-5" aria-hidden />
        )}
        {/* Mở thì nhãn đã hiện thành chữ — thêm `sr-only` cùng nội dung là đọc hai lần.
            Chỉ khi thu, lúc nút trơ lại còn mỗi icon, mới cần nhãn riêng cho trình đọc. */}
        {thu ? (
          <span className="sr-only">Mở thanh việc</span>
        ) : (
          <span className="text-[17px]">Thu thanh việc</span>
        )}
      </button>
    </nav>
  );
}

// ── Khung ───────────────────────────────────────────────────────────────────────────────────

export function KhungAdmin({
  so,
  nguoiVanHanh,
  tim,
  children,
}: {
  so: SoViec;
  /** "Nguyễn Quang Hiệp · quản trị" — FR-39 ghi công theo người: bàn phải nói việc sẽ mang tên ai. */
  nguoiVanHanh: string | null;
  tim: HamTim;
  children: ReactNode;
}) {
  const duong = usePathname() ?? '/admin';
  const man = manTheoDuong(duong);

  const luuThu = useSyncExternalStore(dangKyThu, anhChupThu, anhChupThuServer);

  /**
   * Trạng thái thu/mở CHỈ SỐNG TRONG PHIÊN — không ghi, không mang sang lần sau.
   *   · `xin`     — màn đang mở xin thu (màn cây). Lời xin, không phải quyết định.
   *   · `daChinh` — người dùng đã tự bấm thu/mở kể từ khi vào bàn này. Đã bấm thì lời xin im.
   *
   * Cố ý KHÔNG đặt lại `daChinh` khi rời màn: người vận hành đã nói họ muốn thanh việc mở, thì
   * bàn này không hỏi lại câu ấy nữa trong cả phiên.
   */
  const [thanhViec, setThanhViec] = useState({ xin: false, daChinh: false });

  const thu = thanhViec.daChinh ? luuThu : thanhViec.xin || luuThu;

  // Định danh CỐ ĐỊNH (deps rỗng): màn cây gọi nó trong một effect, nên hàm đổi mỗi lượt vẽ là
  // effect chạy lại mỗi lượt vẽ. Trả về chính `cu` khi đã chỉnh tay để React bỏ qua luôn.
  /**
   * Đọc `sessionStorage` Ở ĐÂY, không ở initializer của `useState`.
   *
   * Máy chủ không có `sessionStorage`, nên đọc lúc dựng thì lượt vẽ đầu của client ra khác lượt
   * vẽ của server và React kêu lệch hydrate — cùng cái bẫy mà `thu` né bằng `useSyncExternalStore`.
   * `xinThu` chỉ được gọi từ effect của màn cây, tức là sau khi đã gắn vào DOM: lúc ấy đọc kho là
   * an toàn, và trạng thái lúc VẼ vẫn thuần tuý suy từ state.
   */
  const xinThu = useCallback((v: boolean) => {
    setThanhViec((cu) => (cu.daChinh || daChinhDaLuu() ? { ...cu, xin: false } : { ...cu, xin: v }));
  }, []);

  const doiThu = useCallback(() => {
    setThanhViec({ xin: false, daChinh: true });
    ghiDaChinh();
    // Lật thứ đang THẤY, không lật thứ đang lưu: hai giá trị ấy khác nhau khi một màn đang xin
    // thu, và lật nhầm cái thì nút "Mở thanh việc" lại thu thêm một lần nữa.
    ghiThu(!thu);
  }, [thu]);

  return (
    <CtxThanhViec value={{ thu, xinThu }}>
      <div className="flex h-dvh flex-col bg-ban-nen">
        <header className="flex shrink-0 items-center gap-5 border-b border-ban-vien bg-ban-o px-5 py-2.5">
          <Link href="/admin" className="text-[17px] font-semibold whitespace-nowrap">
            Admin
          </Link>
          <OTim tim={tim} />
          {nguoiVanHanh ? (
            <span className="ml-auto text-[15px] whitespace-nowrap text-muted-foreground">
              {nguoiVanHanh}
            </span>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1">
          <ThanhViec so={so} dangMo={man?.khoa ?? null} thu={thu} doiThu={doiThu} />

          {/*
            `min-h-full` + cột co giãn, chứ không phải một khối cao theo nội dung.

            Màn cây cần một chiều cao CÓ THẬT (React Flow đo bằng pixel, không vẽ được vào một hộp
            cao 0). Trước bản vá 25/08 nó tự trừ `100dvh - 10rem` — một phép đoán, và đoán sai vì
            gốc chữ của dự án là 17px chứ không phải 16px. Ở đây `flex-1` cho nó phần còn lại của
            khung nhìn, đo bởi trình duyệt; màn dài hơn thì `min-h-full` cho khối tự cao lên và
            `main` cuộn như cũ.

            `shrink-0` KHÔNG thừa. `min-h-full` là một `min-height` tường minh nên nó THAY
            `min-height: auto` của flex item — mất cái chặn ấy thì flex co khối này về đúng chiều
            cao khung nhìn, nội dung tràn ra ngoài và `main` cuộn phần tràn, nhưng `py-8` vẫn dính
            ở đáy khối, tức là NẰM TRÊN phần nội dung tràn. Đo trên trình duyệt thật (25/08): mọi
            màn dài hơn khung nhìn được **0px** đệm đáy thay vì 34px — hàng cuối của Hàng chờ,
            Mảnh chưa nối, Nạp khung, Nơi chốn đều dí sát mép dưới.
          */}
          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            <div className="flex min-h-full shrink-0 flex-col px-6 py-8">
              <h1 className="shrink-0 text-[23px] font-semibold">{man?.tieuDe ?? 'Admin'}</h1>
              <div className="mt-4 flex min-h-0 flex-1 flex-col">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </CtxThanhViec>
  );
}
