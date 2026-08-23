/**
 * TÌM NGƯỜI THÂN + KHÔNG TÌM THẤY — /tim (story 2-4, FR-11 · FR-48 · NFR-9).
 *
 * Promote từ hai prototype đã duyệt: `uiworkshop/tim-nguoi-than` + `uiworkshop/khong-tim-thay`
 * (git 8fd4af1^). Hai màn xưởng gộp làm một route vì ngoài xưởng chúng chưa bao giờ là hai
 * trang: "không tìm thấy" là điều `/tim?q=…` trả về khi phả chưa có ai mang tên ấy.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § State Patterns — "Không tìm thấy" là MÀN QUAN TRỌNG NHẤT của Đợt 1:
 *     ngày ra mắt, phần lớn người gõ tên bố sẽ không thấy gì. Đây là trạng thái MẶC ĐỊNH trong
 *     nhiều tháng đầu, không phải trạng thái lỗi. Nó quyết định người ta ở lại hay đóng máy.
 *   · EXPERIENCE.md § Key Flows — Luồng 1, bước 2 (gõ tên bố) · bước 3 (chỗ dễ hỏng nhất)
 *     · bước 6 (gõ tên anh trai, thấy đúng một người)
 *   · EXPERIENCE.md § Responsive — màn tìm CỐ TÌNH KHÔNG nới rộng: một cột `DOC`.
 *   · DESIGN.md § Nút (chính = son, phụ = viền) · § Components (dòng ghi công, node tồn nghi)
 *
 * ── VÌ SAO MÀN NÀY ĐỨNG TRƯỚC MÀN "THÊM" ────────────────────────────────────────────────────
 * Không phải để tra cứu. Tìm là **thao tác chặn trùng**: mọi đường vào việc thêm người đều bắt
 * buộc đi qua đây trước, vì gỡ hai bản trùng ra khỏi nhau (FR-48) tốn gấp nhiều lần so với chặn
 * một lần gõ. Người dùng nghĩ mình đang tìm; hệ thống đang chặn.
 *
 * ── TÌM LÀ GET, KHÔNG PHẢI ACTION ───────────────────────────────────────────────────────────
 * Kết quả tìm phải chia sẻ được bằng đường dẫn (FR-11 — người ta tới bằng link nghe được ở
 * buổi họp họ). `next/form` với `action="/tim"` submit thành `?q=…`: URL là trạng thái, đọc
 * không cần đăng nhập (khách xem qua bán kính riêng tư của khách — core tự lo, AD-24).
 *
 * ── LUẬT CỦA TRẠNG THÁI KHÔNG-TÌM-THẤY ──────────────────────────────────────────────────────
 * Luôn bày người GẦN GIỐNG trước, rồi mới cho tạo (§ State Patterns). Kèm đời + chi để phân
 * biệt hai người trùng tên. Nút tạo là hành động PHỤ đặt dưới khi còn ứng viên để chặn nhầm;
 * chỉ khi không còn gì để chặn (ca rỗng thật) nó mới thành hành động chính. KHÔNG icon buồn,
 * KHÔNG xin lỗi — không có gì hỏng cả.
 */
import type { Metadata } from 'next';
import Form from 'next/form';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DOC } from '@/components/pha/khung';
import { ChamTinCay } from '@/components/pha/tin-cay';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';
import { TuaMuc } from '@/components/pha/vach';
import { getClanOverview, searchPersons, type SearchHit } from '@/core/tree';

export const metadata: Metadata = { title: 'Tìm người thân' };

/** Đường sang màn thêm (story 2-3/2-5), mang theo tên vừa gõ để khỏi gõ lại. */
const duongThem = (ten: string) => `/them?ten=${encodeURIComponent(ten)}`;

/**
 * NHÃN CHI để hiển thị cạnh số đời — "chi Hai", không phải mã chi "1.3.2" (quy ước lấy từ
 * prototype đã duyệt). Chi của một người là nhánh xuất phát từ đời 2, tức đoạn ĐẦU của mã chi
 * core tính ra (AD-5 — không lưu, tính lúc đọc).
 */
const SO_CHI = ['Nhất', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín'];
function nhanChi(branchCode: string | null): string | null {
  if (!branchCode) return null;
  const dau = Number(branchCode.split('.')[0]);
  if (!Number.isInteger(dau) || dau < 1) return null;
  return `chi ${SO_CHI[dau - 1] ?? dau}`;
}

/** "hôm nay" / "hôm qua" / "N ngày trước" / ngày đủ — cho dòng ghi công (FR-39). */
function nhanNgay(iso: string): string {
  const luc = new Date(iso);
  if (Number.isNaN(luc.getTime())) return '';
  const nay = new Date();
  const mot = 86_400_000;
  const ngay = Math.round(
    (new Date(nay.getFullYear(), nay.getMonth(), nay.getDate()).getTime() -
      new Date(luc.getFullYear(), luc.getMonth(), luc.getDate()).getTime()) /
      mot,
  );
  if (ngay <= 0) return 'hôm nay';
  if (ngay === 1) return 'hôm qua';
  if (ngay < 30) return `${ngay} ngày trước`;
  return luc.toLocaleDateString('vi-VN');
}

/** Tổng người trong phả — cho câu mở đầu và ca rỗng thật. Hỏng thì im lặng bỏ câu, không băng-rôn. */
async function tongNguoiTrongPha(): Promise<number | null> {
  const tq = await getClanOverview();
  if (!tq.ok) {
    if (tq.error.code === 'unauthenticated') redirect('/dang-nhap');
    return null;
  }
  const { mainFragment, unconnectedFragments } = tq.value;
  return (
    (mainFragment?.personCount ?? 0) +
    unconnectedFragments.reduce((s, m) => s + m.personCount, 0)
  );
}

/**
 * Ô TÌM — form GET thật, giữ nguyên vỏ của `components/pha/o-tim.tsx` (ghi chú promote trong
 * file ấy dặn đúng điều này: "thay phần trong bằng <input> thật và giữ nguyên vỏ").
 * Nút "Tìm" nằm TRONG ô: mọi hành động có nút thấy được (§ Interaction Primitives — Enter trên
 * bàn phím là cử chỉ ẩn với người ít dùng máy), và vùng chạm h-11 = 44px chạm sàn Accessibility.
 */
function OTimThat({ tuKhoa }: { tuKhoa?: string }) {
  return (
    <Form action="/tim">
      <div className="rounded-md border border-input bg-card px-4 py-3 transition-colors duration-150 ease-out focus-within:border-muted-foreground md:px-5 md:py-4">
        <label htmlFor="q" className="text-[15px] text-muted-foreground">
          Tìm người thân
        </label>
        <div className="mt-0.5 flex items-center gap-3">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={tuKhoa}
            placeholder="Gõ tên — không cần dấu"
            // Autofocus CHỈ ở màn chưa gõ gì: đây là việc duy nhất của màn ấy. Có kết quả rồi
            // thì tiêu điểm để yên cho danh sách — focus nhảy về ô là mất chỗ đang đọc.
            autoFocus={!tuKhoa}
            autoComplete="off"
            enterKeyHint="search"
            className="h-11 w-full min-w-0 flex-1 bg-transparent font-[family-name:var(--font-pha)] text-[17px] outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" className="h-11 shrink-0 px-5 text-[17px]">
            Tìm
          </Button>
        </div>
      </div>
    </Form>
  );
}

/**
 * Một kết quả. ĐỜI + CHI là bắt buộc, ngang hàng với tên — không phải siêu dữ liệu trang trí:
 * trong một dòng họ trùng tên là chuyện thường, và chọn nhầm một người ở đây thành một liên kết
 * cha–con sai, hỏng phả của cả một chi.
 *
 * Cả thẻ là MỘT liên kết sang trang người ấy — chạm mở, không menu ngữ cảnh, không nhấn-giữ.
 * Tồn nghi = nét đứt + vân chéo, chữ ĐẬM NGANG node thường (DESIGN.md Don't #1: không opacity).
 */
function KetQua({ nguoi }: { nguoi: SearchHit }) {
  const tonNghi = nguoi.tier === 'tentative';
  const meta = [
    nguoi.generation !== null ? `đời ${nguoi.generation}` : null,
    nhanChi(nguoi.branchCode),
    nguoi.lifespan || null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Link
      href={`/nguoi/${nguoi.personId}`}
      className={`block rounded-md border bg-card px-4 py-3.5 transition-colors duration-150 ease-out hover:border-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        tonNghi ? 'van-ton-nghi border-dashed border-tin-ton-nghi' : 'border-border'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
          {nguoi.fullName}
        </p>
        {/* Chip tin cậy: chấm màu + CHỮ — không bao giờ chỉ màu (FR-2, in đen trắng vẫn đọc). */}
        <span className="shrink-0">
          <ChamTinCay muc={nguoi.confidence} />
        </span>
      </div>
      {meta && <p className="mt-0.5 text-[15px] text-muted-foreground">{meta}</p>}
      {/* Dòng ghi công (FR-39) — tên người đóng góp nằm TRÊN phả, không chỉ trong nhật ký. */}
      {nguoi.attribution && (
        <p className="mt-1.5 text-[15px] italic text-primary">
          {nguoi.attribution.byName} ghi · {nhanNgay(nguoi.attribution.at)}
        </p>
      )}
    </Link>
  );
}

function DanhSach({ hits }: { hits: SearchHit[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {hits.map((n) => (
        <li key={n.personId}>
          <KetQua nguoi={n} />
        </li>
      ))}
    </ul>
  );
}

/** Màn chưa gõ gì — bước 2 của Luồng 1 còn trống. */
function GoTen({ tong }: { tong: number | null }) {
  return (
    <section>
      {/* NFR-9 nói ra thành lời: người gõ không dấu trên điện thoại phải biết là vẫn tìm được,
          nếu không họ tự kết luận "phả không có" ngay ở lần gõ đầu. */}
      <p className="mt-3 text-[15px] text-muted-foreground">
        Gõ có dấu hay không dấu đều tìm được. Tên đọc gần giống cũng hiện ra.
      </p>

      <h1 className="mt-7 font-[family-name:var(--font-pha)] text-[23px]">Tìm trước khi thêm</h1>
      <p className="mt-2 text-[17px]">
        {tong !== null && tong > 0 ? `Phả đang có ${tong} người. ` : ''}
        Tìm một lượt rồi hãy thêm — thêm trùng thì về sau phải gỡ ra, mà gỡ khó hơn nhiều.
      </p>
    </section>
  );
}

/** Có kết quả đúng tên. Nhiều người trùng tên là ca thường, không phải ca hiếm. */
function CoKetQua({
  dungTen,
  ganGiong,
  tuKhoa,
}: {
  dungTen: SearchHit[];
  ganGiong: SearchHit[];
  tuKhoa: string;
}) {
  return (
    <section>
      <h1 className="mt-7 font-[family-name:var(--font-pha)] text-[23px]">
        {dungTen.length === 1 ? 'Thấy một người' : `Thấy ${dungTen.length} người`}
      </h1>
      {dungTen.length > 1 && (
        <p className="mt-2 text-[17px]">
          Trong họ, trùng tên là chuyện thường. Xem đời và chi để biết là ai.
        </p>
      )}
      <DanhSach hits={dungTen} />

      {/* Khớp mờ (NFR-9 — đồng âm, cận âm) tách nhóm riêng: trộn vào là nói dối về độ khớp. */}
      {ganGiong.length > 0 && (
        <>
          <TuaMuc className="mt-9">Gần giống</TuaMuc>
          <DanhSach hits={ganGiong} />
        </>
      )}

      {/* Cửa tạo vẫn phải mở ngay tại đây — nhưng là hành động PHỤ: còn cả danh sách để chặn nhầm. */}
      <Button asChild variant="outline" className="mt-6 h-12 w-full text-[17px]">
        <Link href={duongThem(tuKhoa)}>Không ai trong số này — thêm vào phả</Link>
      </Button>
    </section>
  );
}

/**
 * KHÔNG TÌM THẤY, có người gần giống — ca thường của nhiều tháng đầu, và là chỗ dễ hỏng nhất
 * của Luồng 1 (bước 3): nếu đây là một ô rỗng thay vì một cửa tạo, Khánh đóng máy ở đây và
 * không bao giờ tới cao trào ở bước 7.
 */
function KhongThayCoUngVien({ ganGiong, tuKhoa }: { ganGiong: SearchHit[]; tuKhoa: string }) {
  return (
    <section>
      <h1 className="mt-7 font-[family-name:var(--font-pha)] text-[23px]">
        Chưa tìm thấy “{tuKhoa}”
      </h1>
      <p className="mt-2 text-[17px]">Có phải một trong những người này?</p>
      <DanhSach hits={ganGiong} />

      {/* Nút tạo là hành động PHỤ, đặt dưới — chặn bản trùng tại nguồn rẻ hơn nhiều so với gỡ
          sau bằng FR-48. */}
      <Button asChild variant="outline" className="mt-5 h-12 w-full text-[17px]">
        <Link href={duongThem(tuKhoa)}>Không ai cả — thêm vào phả</Link>
      </Button>
    </section>
  );
}

/** Ca rỗng thật: không ứng viên nào. Ở đây tạo mới thành hành động CHÍNH — không còn gì để chặn nhầm. */
function KhongThayTrong({ tuKhoa, tong }: { tuKhoa: string; tong: number | null }) {
  return (
    <section>
      <h1 className="mt-7 font-[family-name:var(--font-pha)] text-[23px]">
        Chưa tìm thấy “{tuKhoa}”
      </h1>
      <p className="mt-2 text-[17px]">
        Chưa ai trong phả mang tên này, cũng chưa có tên nào gần giống.
      </p>
      {tong !== null && tong > 0 && (
        <p className="mt-2 text-[17px] text-muted-foreground">
          Phả mới có {tong} người. Phần lớn dòng họ chưa được ghi — thêm được ai là phả dài thêm
          người ấy.
        </p>
      )}
      <Button asChild className="mt-5 h-12 w-full text-[17px]">
        <Link href={duongThem(tuKhoa)}>Thêm “{tuKhoa}” vào phả</Link>
      </Button>
    </section>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const tuKhoa = (Array.isArray(q) ? q[0] : q)?.trim() ?? '';

  let than: React.ReactNode;
  if (!tuKhoa) {
    than = <GoTen tong={await tongNguoiTrongPha()} />;
  } else {
    const ketQua = await searchPersons(tuKhoa);
    if (!ketQua.ok && ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
    // 'forbidden' và các lỗi đọc khác = vắng lặng, không băng-rôn lỗi: màn không-tìm-thấy đã là
    // một trạng thái tử tế, và cái ngoài bán kính riêng tư thì VẮNG chứ không "bị che" (AD-13).
    const hits = ketQua.ok ? ketQua.value : [];
    const dungTen = hits.filter((h) => !h.similar);
    const ganGiong = hits.filter((h) => h.similar);
    than =
      dungTen.length > 0 ? (
        <CoKetQua dungTen={dungTen} ganGiong={ganGiong} tuKhoa={tuKhoa} />
      ) : ganGiong.length > 0 ? (
        <KhongThayCoUngVien ganGiong={ganGiong} tuKhoa={tuKhoa} />
      ) : (
        <KhongThayTrong tuKhoa={tuKhoa} tong={await tongNguoiTrongPha()} />
      );
  }

  return (
    <>
      {/* Cố tình KHÔNG nới rộng trên máy (EXPERIENCE.md § Responsive): danh sách kết quả kéo
          ngang 1280px là khó đọc chứ không phải sang. Một cột DOC. */}
      <main className={`${DOC} pb-28 pt-7 md:pb-16 md:pt-28`}>
        <OTimThat tuKhoa={tuKhoa || undefined} />
        {than}
      </main>
      <ThanhDieuHuong hienTai="them" />
    </>
  );
}
