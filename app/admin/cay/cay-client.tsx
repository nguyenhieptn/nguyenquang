'use client';

/**
 * Chốt nối của màn cây: đường dẫn · người đang chọn · cột phải.
 *
 * `components/admin/*` cố ý KHÔNG biết gì về `next/navigation` lẫn về `@/core/*`. Quy ước đường
 * dẫn và việc dịch dữ liệu core sang hình dạng của component đều nằm ở đây — tầng `app/`.
 *
 * ── `push` cho neo, `replace` cho bán kính ────────────────────────────────────────────────
 * Dời tâm là một chỗ đứng MỚI, phải quay lại được bằng nút Back. Nới rồi thu bán kính thì không:
 * bấm "mở thêm một đời" bốn lần rồi phải Back bốn lần để về chỗ cũ là một cái bẫy.
 *
 * ── Người đang chọn KHÔNG vào đường dẫn ───────────────────────────────────────────────────
 * Đưa vào là mỗi cú bấm một lượt điều hướng, `loading.tsx` thay cả trang, canvas chớp tắt —
 * trong khi luật của 5-2 là *chọn người thì canvas đứng yên*. Một lượt gọi server action giữ
 * canvas nguyên vẹn và chỉ cột phải đổi.
 */
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { KhungCayAdmin, type NutCanvas } from '@/components/admin/khung-cay-admin';
import { CotKhangDinh, type HoSoPanel } from '@/components/admin/cot-khang-dinh';
import { BieuMauThemNguoi } from '@/components/admin/bieu-mau-them-nguoi';
import { ThaoTacXinVaoPha } from '@/components/admin/thao-tac-xin-vao-pha';
import { camNutTam, type HuongThem } from '@/components/admin/dat-nut-tam';
import { hanhDongEsc, hanhDongPhim } from '@/components/admin/phim-canvas';
// `import type` — bị xoá lúc biên dịch, không kéo `pg` vào bó trình duyệt.
import type { AttachmentRole } from '@/core/identity';
import {
  ghiThemKhangDinh,
  ghiThemNoi,
  ghiThemQuanHe,
  loaiKhangDinh,
  nangTang,
  taoNoi,
  themNguoi,
  timNoi,
  xemHoSo,
} from './actions';
import { nhanVaoPha, tuChoiVaoPha } from '../duyet-vao-pha/actions';
/** Dùng lại ĐÚNG lối tìm của ô tìm trên thanh trên — không dựng đường đọc thứ hai (AD-13/AD-21). */
import { timNguoi } from '../actions';

/** "18/03/2026" — ngày đủ dùng; giờ phút là nhiễu trên một cột 360px. */
function ngay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('vi-VN');
}

export function CayClient({
  neoId,
  banKinh,
  canKiet,
  nut,
  moThemNgay,
  xinVaoPha,
  vaiCuaMinh,
}: {
  neoId: string;
  banKinh: number;
  canKiet: boolean;
  nut: NutCanvas[];
  /** Vào bằng nút ở thanh việc (`?them=roi`) — mở sẵn biểu mẫu, chưa có mốc. */
  moThemNgay: boolean;
  /** personId → yêu cầu vào phả đang chờ (story 5-5). Rỗng khi không đủ quyền duyệt. */
  xinVaoPha: Record<string, { attachmentId: string; taiKhoan: string; luc: string }>;
  /** Vai của người đang xem — quyết định họ trao được vai nào khi nhận (story 6-2). */
  vaiCuaMinh: AttachmentRole | 'guest';
}) {
  const router = useRouter();
  /**
   * ── Mở màn là mở HỒ SƠ CỦA NEO (sửa 26/08 sau code review) ────────────────────────────────
   *
   * Bản trước khởi tạo `null`, nên vào màn cây là cột phải trắng — và tệ hơn: bấm một chip quan
   * hệ dời tâm sang người ấy thì trang gắn `key={anchorPersonId}` ⇒ khối này dựng lại ⇒ `chonId`
   * lại về `null`. Đường điều hướng mà story gọi là "nhanh nhất trong cả bàn làm việc" bỏ người
   * vận hành vào một cột trống, phải bấm lại lên chính người vừa chọn.
   *
   * Neo là chỗ đứng; hồ sơ của chỗ đứng là thứ đáng bày trước tiên.
   */
  const [chonId, setChonId] = useState<string | null>(neoId);
  /**
   * Câu trả lời cho một phím tắt không dùng được, hoặc câu hỏi trước khi bỏ chữ đã gõ.
   *
   * Mang `lan` chứ không chỉ mang chữ (sửa 26/08 sau code review): gõ `Shift+Enter` lần hai trên
   * cùng một người đặt lại ĐÚNG chuỗi cũ ⇒ React bail-out ⇒ vùng `role="status"` không đổi ⇒
   * trình đọc màn hình im hoàn toàn. Người dùng bàn phím gõ hai lần và không nghe gì cả.
   */
  const [loiPhim, setLoiPhim] = useState<{ chu: string; lan: number } | null>(null);
  const noiPhim = useCallback((chu: string | null) => {
    setLoiPhim((cu) => (chu === null ? null : { chu, lan: (cu?.lan ?? 0) + 1 }));
  }, []);
  /**
   * Đang chờ phím lần hai cho việc gì — `'dong'` (Esc bỏ biểu mẫu) hay `'thay'` (Enter thay biểu
   * mẫu đang gõ dở bằng một mốc khác).
   *
   * MỘT cờ chung mà ghi rõ VIỆC, không phải một `boolean` (sửa 26/08): dùng chung một boolean thì
   * `Esc` đặt câu hỏi xong, `Enter` ngay sau đó thấy `dangHoi === true` và thay biểu mẫu luôn —
   * người dùng chưa bao giờ được hỏi về việc thứ hai.
   */
  const [hoiBo, setHoiBo] = useState<'dong' | 'thay' | null>(null);
  /** Biểu mẫu thêm người đã bẩn chưa — do CHÍNH biểu mẫu báo ra, gồm cả xuất xứ. */
  const [banThem, setBanThem] = useState(false);
  const [hoSo, setHoSo] = useState<HoSoPanel | null>(null);
  const [dangTai, batDauTai] = useTransition();

  /** `null` = biểu mẫu đóng. Mở thì cột phải bày biểu mẫu thay cho chồng khẳng định. */
  const [them, setThem] = useState<{ mocId: string | null; huong: HuongThem; hoTen: string } | null>(
    moThemNgay ? { mocId: null, huong: 'roi', hoTen: '' } : null,
  );

  /**
   * ── Nút "Thêm người vào phả" ở thanh việc phải mở được biểu mẫu, kể cả khi neo không đổi ──
   * Nút ấy điều hướng sang `?them=roi`. Trang gắn `key={neo}`, nên nếu người vận hành ĐANG ở màn
   * cây thì neo không đổi, khối này không dựng lại, và `moThemNgay` — thứ chỉ được đọc trong
   * initializer của `useState` — không ai đọc nữa. Nút trơ ở đúng ca thường gặp nhất.
   *
   * Chỉnh state ngay trong lượt vẽ khi prop đổi là nếp React chỉ ra cho đúng việc này, và nó rẻ
   * hơn một `useEffect` (React vẽ lại trước khi nhả ra màn, không có khung hình sai nào lọt).
   * Đặt `key` theo `them` thì mỗi lần mở/đóng biểu mẫu là một lần dựng lại cả canvas — mất người
   * đang chọn, mất khung nhìn.
   */
  const [moThemTruoc, setMoThemTruoc] = useState(moThemNgay);
  if (moThemNgay !== moThemTruoc) {
    setMoThemTruoc(moThemNgay);
    if (moThemNgay) setThem({ mocId: null, huong: 'roi', hoTen: '' });
  }

  const doiNeo = useCallback(
    (id: string) => {
      // Dời tâm thì bán kính về mặc định: bán kính cũ là của vùng cũ, mang sang vùng mới có thể
      // bày ra vài trăm người mà người vận hành không hề yêu cầu.
      router.push(`/admin/cay?neo=${encodeURIComponent(id)}`);
    },
    [router],
  );

  const doiBanKinh = useCallback(
    (n: number) => {
      router.replace(`/admin/cay?neo=${encodeURIComponent(neoId)}&ban-kinh=${n}`);
    },
    [router, neoId],
  );

  /**
   * Người mà cột phải ĐANG MUỐN bày. Không phải state: đổi nó không cần vẽ lại gì, nó chỉ có mặt
   * để một lượt nạp biết mình còn được dùng hay không.
   *
   * Nếp này repo đã dựng hai lần (`components/admin/chon-noi.tsx` chốt theo khoá truy vấn) — hai
   * cú bấm liên tiếp thì lượt CHẬM về sau và ghi đè lượt nhanh, nên cột phải bày người vừa bỏ
   * chọn. Ở đây hậu quả nặng hơn một ô tìm: các nút Nâng tầng / Loại trỏ vào `assertionId` của
   * người ấy.
   */
  const dangMuon = useRef<string | null>(null);

  /**
   * Nạp hồ sơ người đang chọn. Canvas KHÔNG chờ theo — nó đã dựng xong từ dữ liệu của trang.
   *
   * `batBuoc` cho lối GHI: sau một lượt ghi thì người ấy vẫn là người đang muốn, nhưng dữ liệu
   * về họ vừa đổi — phải đọc lại. Mọi lối khác thì trùng người là bỏ qua, vì canvas gọi cả
   * `onNodeClick` lẫn `onNodesChange` cho cùng một cú bấm và không có cách nào phân biệt.
   */
  const napHoSo = useCallback((personId: string, batBuoc = false) => {
    if (!batBuoc && dangMuon.current === personId) return;
    dangMuon.current = personId;
    batDauTai(async () => {
      let res: Awaited<ReturnType<typeof xemHoSo>>;
      try {
        res = await xemHoSo(personId);
      } catch {
        /**
         * Reject trong transition đi thẳng ra `reportGlobalError`, không tới `error.tsx`. Không
         * bắt thì cột phải đứng im ở "Đang mở hồ sơ…" và không ai biết vì sao.
         *
         * `loiDoc: true` — sửa 26/08 sau code review. Bản trước đặt `chong: []` không kèm cờ, nên
         * mạng đứt giữa chừng in ra *"Chưa có khẳng định nào sống về người này"* kèm nút Ghi thêm,
         * cho một hồ sơ CHƯA đọc được: đường thẳng tới một khẳng định trùng, thứ chỉ loại được
         * chứ không xoá được (AD-4). Nhánh `!res.ok` ngay dưới đã đặt đúng từ đầu.
         */
        if (dangMuon.current === personId) {
          setHoSo({ personId, hoTen: 'Không mở được hồ sơ', chong: null, loiDoc: true });
        }
        return;
      }
      if (dangMuon.current !== personId) return; // lượt này đã cũ — bỏ, đừng đè lượt mới
      if (!res.ok) {
        /**
         * `loiDoc`, KHÔNG phải `chong: []`.
         *
         * Mảng rỗng có nghĩa xác định — *"người này chưa có khẳng định nào sống"* — và cột phải
         * tin nó: nó bày đúng câu ấy VÀ bày nút "Ghi thêm thông tin", trỏ vào `chonId` là người
         * thật. Một lượt đọc hỏng không biết người ấy có gì; nói rằng họ không có gì rồi mời ghi
         * thêm là đường thẳng dẫn tới một khẳng định trùng, thứ chỉ loại được chứ không xoá được.
         */
        setHoSo({ personId, hoTen: 'Không mở được hồ sơ', chong: null, loiDoc: true });
        return;
      }
      const v = res.value;
      setHoSo({
        personId: v.personId,
        hoTen: v.hoTen,
        tieuSu: v.tieuSu,
        quanHe: v.quanHe,
        // `chong` vắng nghĩa là NGOÀI BÁN KÍNH RIÊNG TƯ, không phải "chưa có gì" — cột phải nói
        // hai chuyện ấy bằng hai câu khác nhau, nên `null` mang đúng nghĩa thứ nhất.
        chong:
          v.chong === undefined
            ? null
            : v.chong.map((c) => ({
                khoa: c.kind,
                nhan: c.nhan,
                kieu: c.stackKind,
                dong: c.rows.map((r) => ({
                  id: r.assertionId,
                  ...(r.doiTuongId ? { doiTuongId: r.doiTuongId } : {}),
                  giaTri: r.valueText,
                  chinhThuc: r.tier === 'official',
                  tinCay: r.confidence,
                  xuatXu: r.toldByName
                    ? `${r.sourceDescription} (${r.toldByName})`
                    : r.sourceDescription,
                  nguoiGhi: r.createdByName,
                  luc: ngay(r.createdAt),
                })),
              })),
      });
    });
  }, []);

  /**
   * Chọn người thì nạp NGAY tại đây, không qua `useEffect`.
   *
   * Hai lý do, cả hai đều thật: ESLint `react-hooks/set-state-in-effect` cấm `setState` trong
   * thân effect (bài học đã gặp ở 5-1); và một effect chạy theo `chonId` là mô tả vòng vo cho một
   * việc thẳng thớm — bấm thì nạp.
   *
   * Dời tâm KHÔNG cần dọn dẹp ở đây: trang gắn `key={neo}` nên cả component dựng lại, người đang
   * chọn tự về `null`. Rẻ hơn một effect canh `neoId`, và không quên được.
   */
  /**
   * Nạp hồ sơ của NEO một lượt khi vào màn. Không phải đồng bộ hai state — là một lượt ĐỌC, và
   * `napHoSo` chạy trong `startTransition` chứ không `setState` thẳng trong thân effect.
   *
   * Trang gắn `key={anchorPersonId}` nên khối này dựng lại mỗi lần đổi neo ⇒ effect chạy đúng
   * một lần cho mỗi chỗ đứng.
   */
  useEffect(() => {
    napHoSo(neoId);
  }, [neoId, napHoSo]);


  const chon = useCallback(
    (id: string) => {
      setChonId(id);
      /**
       * DỌN câu cảnh báo cũ (sửa 26/08 sau code review). § *CHƯA kiểm được* của story khai
       * *"chọn node khác là hết"* — sai: `chon()` chưa từng đụng tới `loiPhim`. Hậu quả: câu
       * *"Chưa biết cha của người này…"* treo lại trên canvas và nay nói về một người KHÁC người
       * đang chọn. Một lời khai sai đứng giữa màn.
       */
      noiPhim(null);
      setHoiBo(null);
      // DỌN NGAY, không đợi lượt nạp về. Giữ lại hồ sơ cũ trong lúc chờ thì cột phải in tên
      // người A trong khi mọi nút trên đó — Nhận vào phả, Nâng tầng, Loại — đang trỏ vào B.
      // "Nhận vào phả" trao quyền ghi và mở bán kính riêng tư: hiện sai tên ở đó là hỏng nặng.
      setHoSo(null);
      /**
       * `batBuoc` — sửa 26/08. `chon()` vừa xoá `hoSo`, nên nó LUÔN cần một lượt nạp; hàng rào
       * chống-đua của `napHoSo` (bỏ qua khi `dangMuon.current` đã là người này) đúng cho lượt
       * gọi tự động, sai cho một cú bấm có chủ ý.
       *
       * Ca hỏng: mở màn nạp sẵn hồ sơ của NEO ⇒ `dangMuon.current = neoId`. Bấm lên chính người
       * ấy trên cây ⇒ `hoSo` bị xoá, lượt nạp bị bỏ, cột phải trắng vĩnh viễn cho tới khi chọn
       * người khác.
       */
      napHoSo(id, true);
    },
    [napHoSo, noiPhim],
  );

  /**
   * Trả `null` khi xong xuôi, hoặc câu lỗi để dòng ấy tự bày.
   *
   * Nhận `Result<unknown>` chứ không buộc `Result<void>`: ba lối ghi của cột phải trả ba hình
   * dạng khác nhau (`void`, `{ assertionId }`), mà việc phải làm sau đó thì y hệt.
   */
  /**
   * Ổn định giữa các lượt vẽ. Bản trước là một mũi tên viết thẳng trong JSX, nên nó mang danh
   * tính MỚI mỗi lượt vẽ của màn này — mà `ChonNguoi` để `onTim` trong deps của effect tìm kiếm.
   * Hệ quả: mỗi lượt vẽ lại của `CayClient` là một lượt tìm lại, và một lượt Escape vừa bấm bị
   * lượt vẽ kế tiếp mở lại.
   */
  const timNguoiOnDinh = useCallback(async (tuKhoa: string) => timNguoi(tuKhoa), []);

  const sauKhiGhi = useCallback(
    async (res: { ok: true; value: unknown } | { ok: false; error: { message: string } }): Promise<
      string | null
    > => {
      if (!res.ok) return res.error.message;
      /**
       * Làm mới người ĐANG BÀY LÚC NÀY, không phải người đang bày lúc bấm.
       *
       * Bản trước đóng gói `chonId` vào closure, nên một lượt ghi bắt đầu khi đang chọn A mà
       * người vận hành bấm sang B giữa chừng thì lúc nó về, nó kéo `dangMuon` NGƯỢC về A. Lượt
       * nạp của B đang bay bị chính phép chốt hiệu lực loại đi, hồ sơ A về đích, rồi tầng vẽ
       * thấy `chonId = B` mà `hoSo.personId = A` nên bày ra câu "Chọn một người trên cây…" —
       * trong khi thẻ B vẫn đeo nhãn "đang chọn". Không còn lượt nào đang bay để tự gỡ.
       *
       * Đọc `dangMuon` lúc RESOLVE thì mũi tên chỉ đi tới, không bao giờ lùi.
       */
      if (dangMuon.current) napHoSo(dangMuon.current, true);
      // Số trên thanh việc do layout dựng — server action đã revalidate, còn đây làm mới cây.
      router.refresh();
      return null;
    },
    [napHoSo, router],
  );

  /**
   * Tên mốc: từ canvas, và nếu mốc không có trên hình (chọn qua chip quan hệ một người ngoài bán
   * kính đang bày) thì từ hồ sơ đang mở — kẻo biểu mẫu chỉ còn *"chưa biết nối vào ai"* trong khi
   * `mocId` vẫn gửi đi (code review 6-10; cùng lỗ ở cả hai bề mặt).
   */
  const mocHoTen = them?.mocId
    ? (nut.find((n) => n.id === them.mocId)?.the.hoTen ??
      (hoSo?.personId === them.mocId ? hoSo.hoTen : null))
    : null;

  /**
   * Tên người đang chọn lấy từ CANVAS, không từ `hoSo`.
   *
   * Canvas đã có sẵn tên từ lúc trang dựng, nên nó đúng NGAY — không có khoảng chờ nào để lệch.
   * `hoSo` thì về sau một lượt gọi máy chủ, và panel duyệt vào phả không được phép có dù một
   * khung hình nào in tên người này bên cạnh một nút trao quyền cho người kia.
   */
  const tenDangChon = chonId ? (nut.find((n) => n.id === chonId)?.the.hoTen ?? null) : null;

  /**
   * Chốt lần cuối ở tầng vẽ: chỉ bày hồ sơ NẾU nó đúng là của người đang chọn. `napHoSo` đã chặn
   * lượt cũ rồi, nhưng phép suy này rẻ và nó biến "cột phải bày nhầm người" thành chuyện không
   * biểu diễn được, thay vì chuyện phải nhớ chặn ở mọi lối.
   */
  const hoSoHienHanh = hoSo && hoSo.personId === chonId ? hoSo : null;

  /**
   * Đóng biểu mẫu thêm người thì GỠ `?them` khỏi đường dẫn.
   *
   * Không gỡ thì URL còn nói "đang thêm" trong khi màn thì không, và bấm lại nút ở thanh việc là
   * điều hướng tới chính đường dẫn đang đứng — trình duyệt không đi đâu cả, nút thành nút trơ.
   */
  const dongThem = useCallback(() => {
    setThem(null);
    // Biểu mẫu đóng thì nó sạch trở lại — không để cờ bẩn của lượt trước bám sang lượt sau.
    setBanThem(false);
    /**
     * DỌN cả câu hỏi lẫn cờ chờ (sửa 26/08 sau code review). Bản trước chỉ dọn `banThem`, mà nút
     * *Thôi* nối thẳng vào đây chứ không đi qua nhánh `Esc` — nên: gõ tên → `Esc` (hiện câu hỏi)
     * → đổi ý, bấm *Thôi* → câu hỏi treo lại trên canvas trỏ vào một biểu mẫu không còn, VÀ cờ
     * `hoiBo` vẫn bật. Biểu mẫu MỞ LẦN SAU bị `Esc` bỏ NGAY, mất trắng chữ, không một câu hỏi —
     * đúng nguyên văn cái tội `phim-canvas.ts` thề đã sửa.
     */
    setHoiBo(null);
    noiPhim(null);
    /**
     * CHỈ điều hướng khi `?them` thật sự đang ở trên đường dẫn.
     *
     * Lối thường gặp — chọn một người rồi bấm "Thêm người quanh đây" — không hề đụng URL, nên
     * `router.replace` ở đây là một lượt đi server đầy đủ trên một route `force-dynamic`: chạy
     * lại `getNeighborhood`, `listPendingAttachments`, và cả `getClanOverview()` của layout trên
     * TOÀN dòng họ. Canvas trắng ra sau tấm skeleton, và `ban-kinh=2` bị ghim vào thanh địa chỉ
     * mà không ai xin. Chính file này (đầu trang) lấy đó làm lý do để KHÔNG đưa người đang chọn
     * vào URL — rồi lại tự làm đúng điều ấy ở lối đóng biểu mẫu.
     */
    if (moThemNgay) {
      router.replace(`/admin/cay?neo=${encodeURIComponent(neoId)}&ban-kinh=${banKinh}`);
    }
  }, [router, neoId, banKinh, moThemNgay, noiPhim]);

  /**
   * ── Phím tắt nhập nhanh (story 6-9) ──────────────────────────────────────────────────────
   *
   * Nghe ở CỬA SỔ, không ở vỏ canvas: ghi xong một người thì trang dời tâm sang người mới và
   * dựng lại, focus rơi về `body` — nghe ở vỏ thì "gõ một mạch" đứt ngay ở người thứ hai.
   *
   * Phép quyết định nằm trọn ở `phim-canvas.ts` (module thuần, có test). Ở đây chỉ đọc DOM rồi
   * thi hành, và KHÔNG `preventDefault` khi phím không phải việc của mình.
   */
  useEffect(() => {
    function nghe(e: KeyboardEvent) {
      const dich = e.target as HTMLElement | null;

      /**
       * ── BỘ GÕ TIẾNG VIỆT ĐI TRƯỚC MỌI THỨ (sửa 26/08 sau code review) ─────────────────────
       *
       * Đây là bàn nhập liệu TIẾNG VIỆT. Gõ Telex `Nguyeen`, chuỗi `Nguyên` đang soạn còn gạch
       * chân; bấm `Esc` để huỷ chuỗi ấy là thao tác chuẩn của IME. Không chốt ở đây thì cú `Esc`
       * nhắm vào một dấu gõ hỏng lại nuốt cả người đang nhập.
       *
       * `Enter` vốn an toàn nhờ `dangGoTrongO` chặn `INPUT`; `Escape` thì CỐ Ý đi vòng qua hàng
       * rào ấy (xem ngay dưới), nên nó là cửa duy nhất IME lọt vào được.
       *
       * `keyCode === 229` là lối cũ cho trình duyệt/IME không đặt `isComposing` — giữ cả hai.
       */
      if (e.isComposing || e.keyCode === 229) return;

      /**
       * `Escape` xử TRƯỚC, và KHÔNG đi qua `dangGoTrongO`: trong một ô nhập, `Enter` là *gửi*
       * còn `Esc` là *thôi* — đó là luật chung của mọi app canvas.
       */
      const raEsc = hanhDongEsc({
        phim: e.key,
        lap: e.repeat,
        dangMo: them !== null,
        // Do CHÍNH biểu mẫu báo ra (`onDoiBan`), nên nó phủ mọi ô — kể cả xuất xứ, thứ không
        // chảy ngược lên đây. Bản trước chỉ suy từ họ tên, và gõ mỗi xuất xứ rồi Esc là mất trắng.
        daGo: banThem,
        dangHoi: hoiBo === 'dong',
      });
      if (raEsc.loai !== 'bo-qua') {
        e.preventDefault();
        if (raEsc.loai === 'hoi') {
          setHoiBo('dong');
          noiPhim('Bỏ những gì vừa gõ? Ấn Esc lần nữa để bỏ.');
          return;
        }
        dongThem();
        return;
      }
      // `Esc` khi không có biểu mẫu nào mở là lối tắt câu cảnh báo đang treo — lối thoát bằng
      // bàn phím duy nhất mà bản trước không có. KHÔNG `preventDefault`: phím vẫn thuộc về trang.
      if (e.key === 'Escape') {
        noiPhim(null);
        setHoiBo(null);
        return;
      }

      /**
       * ── MỐC ĐỌC TỪ CHÍNH SỰ KIỆN, KHÔNG TỪ CLOSURE (sửa 26/08 sau code review) ────────────
       *
       * `@xyflow/system` khai `elementSelectionKeys = ['Enter',' ','Escape']` và gắn `onKeyDown`
       * lên MỖI thẻ node (`tabIndex=0`). `Enter` trên thẻ node đang focus gọi `handleNodeClick`
       * → `onChon(B)` — nhưng đó là một handler React uỷ nhiệm ở `document`, chạy TRƯỚC listener
       * cửa sổ này, và `setChonId(B)` chỉ *xếp lịch* một lượt vẽ. Closure ở đây vẫn giữ `A`.
       *
       * Hậu quả đo được: đi bằng `Tab` tới thẻ B rồi gõ `Enter` ⇒ thẻ B sáng lên, còn biểu mẫu
       * ghi *"là con của A"*. Một phím, hai việc, hai người khác nhau — trên một cuốn phả mà
       * AD-4 không cho xoá. Và đúng người dùng bàn phím là đối tượng mà cả quyết định "không
       * chiếm `Tab`" sinh ra để phục vụ.
       *
       * Thẻ node mang `data-id` của React Flow, nên sự kiện tự nói ra nó thuộc về ai.
       */
      const idTuSuKien =
        (dich?.closest('.react-flow__node') as HTMLElement | null)?.dataset.id ?? null;
      const mocDang = idTuSuKien ?? chonId;
      const nodeDang = nut.find((n) => n.id === mocDang);

      const ra = hanhDongPhim({
        phim: e.key,
        shift: e.shiftKey,
        boTro: e.ctrlKey || e.metaKey || e.altKey,
        lap: e.repeat,
        o: dich ? { the: dich.tagName, contentEditable: dich.isContentEditable } : null,
        chonId: mocDang,
        chaCuaChon: nodeDang?.chaId ?? null,
        // `laGocManh` (`isFragmentRoot` của core) là thứ DUY NHẤT phân biệt "chưa ai truy ra đời
        // trên" với "cha nằm ngoài bán kính đang xem". Xem `phim-canvas.ts § cha-ngoai-vung`.
        laGocManh: nodeDang?.the.laGocManh ?? false,
        mocDangMo: them?.mocId ?? null,
        daGo: banThem,
        dangHoi: hoiBo === 'thay',
      });
      if (ra.loai === 'bo-qua') return;
      e.preventDefault();

      if (ra.loai === 'hoi-thay') {
        setHoiBo('thay');
        noiPhim('Biểu mẫu đang có chữ chưa ghi. Ấn Enter lần nữa để bỏ và mở biểu mẫu mới.');
        return;
      }
      if (ra.loai === 'thieu-cha') {
        setHoiBo(null);
        noiPhim('Chưa biết cha của người này, nên chưa thêm anh em được.');
        return;
      }
      if (ra.loai === 'cha-ngoai-vung') {
        setHoiBo(null);
        noiPhim('Cha của người này chưa hiện trên hình — nới bán kính rồi thử lại.');
        return;
      }

      setHoiBo(null);
      noiPhim(null);
      // Biểu mẫu mới thì cờ bẩn của biểu mẫu cũ phải rơi theo — `Than` dựng lại rỗng, mà cờ ở
      // lại thì `Esc` ngay sau đó hỏi "bỏ những gì vừa gõ?" về một biểu mẫu chưa ai đụng vào.
      setBanThem(false);
      setThem({ mocId: ra.mocId, huong: 'con', hoTen: '' });
    }
    window.addEventListener('keydown', nghe);
    return () => window.removeEventListener('keydown', nghe);
  }, [chonId, nut, them, hoiBo, banThem, dongThem, noiPhim]);

  // Cùng phép cắm node mờ mà canvas dùng — gọi lại ở đây CHỈ để biết có phải nói câu cảnh báo
  // "mốc đã có cha" hay không. Một nguồn sự thật, hai chỗ đọc.
  const daThayCanhCu = them
    ? camNutTam(
        nut.map((n) => ({ id: n.id, chaId: n.chaId })),
        them.mocId,
        them.huong,
      ).daThayCanhCu
    : false;

  return (
    /**
     * `h-full`, KHÔNG phải một phép trừ đoán.
     *
     * Bản trước viết `h-[calc(100dvh-10rem)]`, và `10rem` thì phụ thuộc `html { font-size }` —
     * dự án này đặt 17px (`app/globals.css`), nên nó ra 170px trong khi chrome thật cần ~188px.
     * Màn cây vì thế luôn thừa một thanh cuộn và đáy cụm nút bị cắt. Sửa con số là đổi một phép
     * đoán sai lấy một phép đoán khác: nó lại sai vào ngày ai đó thêm một dòng vào đầu trang.
     *
     * `app/admin/layout.tsx` nay dựng khối nội dung thành một cột co giãn, nên chiều cao có thật
     * và đo được — không còn gì để trừ.
     */
    <div className="relative flex h-full min-h-[420px] gap-4">
      {/*
        Câu trả lời cho một phím tắt không dùng được. Đứng NGAY TRÊN canvas, không phải một
        băng-rôn ở đầu trang: người vận hành vừa gõ phím ở đây thì câu trả lời phải ở đây.

        BA thứ sửa 26/08 sau code review, cả ba chỉ thấy được khi nghĩ tới màn thật:

        1. `role="status"` LUÔN nằm trong DOM, chỉ đổi nội dung con. Live region chèn cùng lúc
           với chữ là lỗi kinh điển — NVDA/JAWS/VoiceOver thường im. AC 3 hứa "nói một câu"; bản
           trước không nói với người dùng trình đọc màn hình.
        2. `key={lan}` để cùng một câu gõ hai lần vẫn được đọc lại. Đặt lại đúng chuỗi cũ thì
           React bail-out và vùng live không hề đổi.
        3. `top-16` + `pointer-events-none`. Bản trước `top-0 z-20` nằm ĐÈ lên thanh công cụ
           (`top-3 z-10`, cao 44px) và không tắt `pointer-events`, nên nó nuốt cú bấm vào chính
           *Thêm người quanh đây* — sàn chạm 44px còn nguyên trong CSS mà không bấm được.
      */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center"
      >
        {loiPhim ? (
          <p
            key={loiPhim.lan}
            className="max-w-[70ch] rounded-md border-l-4 border-destructive bg-canh-bao-nen px-3 py-1.5 text-[17px]"
          >
            {loiPhim.chu}
          </p>
        ) : null}
      </div>
      <KhungCayAdmin
        neoId={neoId}
        banKinh={banKinh}
        canKiet={canKiet}
        nut={nut}
        chonId={chonId}
        onChon={chon}
        onDoiNeo={doiNeo}
        onDoiBanKinh={doiBanKinh}
        themVao={them}
        onMoThem={() => chonId && setThem({ mocId: chonId, huong: 'con', hoTen: '' })}
      />
      {them ? (
        <aside
          className="w-[360px] shrink-0 overflow-y-auto border-l border-ban-vien bg-ban-o"
          aria-label="Thêm người vào phả"
        >
          <BieuMauThemNguoi
            beMat="B"
            khoa={them.mocId ?? '__roi__'}
            tenMoc={mocHoTen}
            huong={them.huong}
            onDoiHuong={(h) => setThem((cu) => (cu ? { ...cu, huong: h } : cu))}
            onDoiTen={(t) => setThem((cu) => (cu ? { ...cu, hoTen: t } : cu))}
            onDoiBan={setBanThem}
            daThayCanhCu={daThayCanhCu}
            onDong={dongThem}
            onGui={async (d) => {
              const res = await themNguoi({
                hoTen: d.hoTen,
                ...(d.gioiTinh ? { gioiTinh: d.gioiTinh } : {}),
                namSinh: d.namSinh,
                namMat: d.namMat,
                ghiChu: d.ghiChu,
                xuatXu: d.xuatXu,
                ...(them.mocId ? { mocId: them.mocId } : {}),
                huong: them.huong,
              });
              if (!res.ok) return res.error.message;
              // Ghi xong thì DỜI TÂM sang người vừa tạo — người vận hành thấy ngay chỗ mình vừa
              // ghi vào, thay vì phải tự đi tìm trên một cây vừa đổi hình.
              dongThem();
              router.push(`/admin/cay?neo=${encodeURIComponent(res.value.personId)}`);
              return null;
            }}
          />
        </aside>
      ) : (
        <aside
          className="flex w-[360px] shrink-0 flex-col overflow-y-auto border-l border-ban-vien bg-ban-o"
          aria-label="Người đang chọn"
        >
          {/* Panel duyệt đứng TRÊN chồng khẳng định, KHÔNG thay thế nó: người duyệt cần đọc chính
              các khẳng định về người ấy để quyết có nhận hay không. */}
          {chonId && xinVaoPha[chonId] ? (
            <section className="border-b border-ban-vien px-5 py-5">
              <h2 className="text-[19px] font-semibold text-destructive">
                Có người xin nhận chỗ này
              </h2>
              <p className="mt-1 max-w-[42ch] text-[17px] text-muted-foreground">
                <strong>{xinVaoPha[chonId].taiKhoan}</strong> đang nhận là{' '}
                {tenDangChon ?? 'người này'}, xin từ {xinVaoPha[chonId].luc}. Nhận là trao quyền
                ghi và mở bán kính riêng tư quanh chỗ này.
              </p>
              <ThaoTacXinVaoPha
                khoa={xinVaoPha[chonId].attachmentId}
                vaiCuaMinh={vaiCuaMinh}
                onNhan={async (vai) => {
                  const res = await nhanVaoPha(xinVaoPha[chonId].attachmentId, vai);
                  if (!res.ok) return res.error.message;
                  router.refresh();
                  return null;
                }}
                onTuChoi={async (lyDo) => {
                  const res = await tuChoiVaoPha(xinVaoPha[chonId].attachmentId, lyDo);
                  if (!res.ok) return res.error.message;
                  router.refresh();
                  return null;
                }}
              />
            </section>
          ) : null}
          <CotKhangDinh
            beMat="B"
            hoSo={hoSoHienHanh}
            dangTai={dangTai}
            onNangTang={async (id) => sauKhiGhi(await nangTang(id))}
            /**
             * Ghi chú đi thẳng vào `revision` và Ở LẠI ĐÓ (AD-4) — `rejectAssertionOp` xoá cứng
             * hàng khẳng định, nên câu này là lời giải thích DUY NHẤT sống sót. Bản trước gắn
             * cứng "Loại khi giải mâu thuẫn", viết khi nút "Loại" chỉ mọc trên chồng mâu thuẫn;
             * story 6-1 cho nó mọc trên chồng NỐI TIẾP, thứ không bao giờ mâu thuẫn. Nên nơi gọi
             * phải nói đúng việc vừa làm.
             */
            onLoai={async (id, ghiChu) => {
              const res = await loaiKhangDinh(id, ghiChu);
              /**
               * Gỡ một quan hệ có thể vừa cắt người ở đầu kia ra khỏi vùng lân cận — vùng ấy đi
               * THEO CẠNH. `?giu=` giữ họ lại đúng một lượt, với dữ liệu thẻ thật (xem
               * `page.tsx § Giữ người vừa bị tách`), để người vận hành không mất dấu thứ mình
               * vừa động vào và nối lại được nếu gỡ nhầm.
               */
              if (res.ok && res.value.doiTuongId) {
                router.replace(
                  `/admin/cay?neo=${encodeURIComponent(neoId)}&ban-kinh=${banKinh}` +
                    `&giu=${encodeURIComponent(res.value.doiTuongId)}`,
                );
              }
              return sauKhiGhi(res);
            }}
            onGhiThem={async (loai, giaTri, xuatXu) => {
              if (!chonId) return 'Chưa chọn ai trên cây.';
              // Nạp lại chồng NGAY sau khi ghi: giá trị mới có thể vừa biến một chồng `don` thành
              // chồng MÂU THUẪN, và người vừa ghi phải thấy hệ quả của chính việc mình làm — chứ
              // không phát hiện ra ở lần mở màn sau.
              return sauKhiGhi(await ghiThemKhangDinh(chonId, loai, giaTri, xuatXu));
            }}
            onGhiNoi={async (placeId, vai, xuatXu) => {
              if (!chonId) return 'Chưa chọn ai trên cây.';
              return sauKhiGhi(await ghiThemNoi(chonId, placeId, vai, xuatXu));
            }}
            onGhiQuanHe={async (a) => {
              if (!chonId) return 'Chưa chọn ai trên cây.';
              // Nạp lại chồng NGAY (thấy quan hệ mới trong cột phải) — và `ghiThemQuanHe` đã
              // `revalidatePath('/admin','layout')` nên canvas vẽ lại với cạnh mới, số "Mảnh chưa
              // nối" trên thanh việc cũng theo.
              const res = await ghiThemQuanHe({ personId: chonId, ...a });
              if (res.ok && res.value.alreadyLinked) {
                // Không phải lỗi, cũng không phải "vừa ghi xong". Cặp này đã là vợ chồng trong
                // phả rồi — nói thẳng thay vì đóng biểu mẫu như thể vừa ghi một khẳng định mới.
                return 'Hai người này đã là vợ chồng trong phả — không ghi thêm gì.';
              }
              /**
               * Hướng "là con của" ghi khẳng định lên NGƯỜI KIA (`subject` là con). Hồ sơ chỉ nạp
               * hàng của chính mình, nên chồng đang mở không có dòng nào mới và người vận hành
               * không thấy gì — kể cả nút gỡ, thứ chỉ tồn tại trên panel người kia.
               *
               * Dời chỗ đứng sang họ, đúng nếp 5-4: xác nhận bằng HỆ QUẢ, và lối gỡ nằm ngay đó.
               */
              if (res.ok && a.loai === 'parent-child' && a.huong === 'con') {
                chon(a.nguoiKiaId);
                return null;
              }
              return sauKhiGhi(res);
            }}
            onTimNguoi={timNguoiOnDinh}
            /* Chip quan hệ dời tâm canvas — cùng lối "Đặt làm tâm" đã có, không dựng đường thứ hai. */
            /**
             * `chon`, KHÔNG `doiNeo` — sửa 26/08 sau lượt dùng thật.
             *
             * Bấm một chip quan hệ là muốn XEM người ấy, không phải muốn đổi chỗ đứng. Nối vào
             * `doiNeo` thì cả canvas nhảy đi và người vận hành mất phương hướng — đúng luật story
             * 5-2 đã chốt: *chọn một người thì canvas ĐỨNG YÊN*. Dời tâm vẫn có đường riêng, là
             * nút "Đặt làm tâm" trên thanh công cụ, và nó phải là một hành động có chủ ý.
             */
            onMoNguoi={chon}
            onTimNoi={async (ten, donViCha) => {
              const res = await timNoi(ten, donViCha);
              /**
               * NÉM, không quy về rỗng. Rỗng ở bộ chọn có nghĩa xác định — *"chưa có nơi nào
               * giống, mời tạo mới"* — và một lượt đọc hỏng không biết điều đó. Quy nó về rỗng là
               * mời người nhập tạo một nơi CÓ THỂ đã tồn tại, trên một danh mục chưa có đường
               * gộp. Cùng luật đã sửa cho `timNguoi` hôm nay; ở đây hậu quả là một lượt ghi.
               */
              if (!res.ok) throw new Error(res.error.message);
              return res.value.map((u) => ({
                placeId: u.placeId,
                nhan: u.nhan,
                muc: u.muc,
                vi: u.vi,
              }));
            }}
            onTaoNoi={async (ten, donViCha) => {
              const res = await taoNoi(ten, donViCha);
              if (res.ok) return { placeId: res.value.placeId, nhan: res.value.nhan };
              /**
               * TRÙNG KHÍT không phải một lỗi của người nhập — họ vừa gõ ra một nơi ĐÃ CÓ trong
               * danh mục, tức là gõ đúng. `addPlace` trả kèm id nơi ấy trong `error.detail` chính
               * để đây nối thẳng vào; báo đỏ rồi bắt gõ lại là đuổi họ khỏi một việc đã xong.
               */
              const daCo = res.error.detail?.placeId;
              const nhan = res.error.detail?.nhan;
              if (res.error.code === 'conflict' && typeof daCo === 'string' && typeof nhan === 'string') {
                return { placeId: daCo, nhan };
              }
              return res.error.message;
            }}
          />
        </aside>
      )}
    </div>
  );
}
