'use client';

/**
 * LUỒNG NHẬN CHỖ — tìm tên mình, chọn đúng người, xin nhận; client component vì đây là một
 * cuộc hội thoại nhiều lượt (tìm → chọn → xác nhận → chờ) trên MỘT màn.
 *
 * Kế thừa prototype `KhaiMinhLaAi` + `ChuaGan` (8fd4af1^:app/uiworkshop/dang-nhap/page.tsx),
 * thay ô tĩnh bằng tìm kiếm thật qua server action → core/tree.searchPersons.
 *
 * ── Kết quả tìm theo đúng khuôn "Không tìm thấy" (EXPERIENCE.md § State Patterns) ──
 * Luôn bày người gần giống TRƯỚC, kèm **đời + chi** để phân biệt hai người trùng tên —
 * trong một dòng họ, trùng tên là chuyện thường. Đường "không ai cả" dẫn sang /tim (luồng
 * tự khai thêm mình vào phả trước), không phải một ngõ cụt.
 *
 * ── Ai ghi tên này vào — hiện TRƯỚC khi bấm ──
 * Người sắp nhận chỗ phải biết ai đã ghi tên ấy (FR-39/FR-55): đó là thứ quyết định họ sẽ
 * thấy gì sau khi được xác nhận. Dòng ghi công mang son — son của "đã chốt", đúng nghĩa gốc.
 *
 * ── Trạng thái CHỜ là trạng thái ổn, không phải lỗi ──
 * AD-8: yêu cầu nằm 'pending' tới khi một người trong họ bảo lãnh. Màn chờ ấm, không xin lỗi,
 * và nói rõ: trong lúc chờ, xem phả vẫn đủ như trước (FR-11). Mở lại màn khi lời nhận chỗ còn
 * đang chờ: server đọc getMyAttachment và truyền `choSan` — vào thẳng màn chờ, không tìm lại.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { ChamTinCay } from '@/components/pha/tin-cay';
import type { SearchHit } from '@/core/tree';
import { nhanChoTrongPha, timChinhMinh } from './actions';

/** Mã lỗi core → lời bề mặt A. KHÔNG hiện message gốc — vài message của core mang từ kỹ thuật. */
const LOI_TIM: Partial<Record<string, string>> = {
  invalid: 'Gõ ít nhất hai chữ của tên rồi tìm lại.',
};
const LOI_NHAN: Partial<Record<string, string>> = {
  conflict:
    'Chỗ này chưa nhận được — tài khoản đã có chỗ trong phả, hoặc bản ghi này vừa được gộp với một bản khác. Mở trang chủ xem lại.',
  'not-found': 'Không còn thấy người này trong phả — tìm lại một lượt.',
};
const LOI_CHUNG = 'Chưa gửi được — thử lại, hoặc quay lại sau ít phút.';

/**
 * Thời gian tương đối tiếng Việt cho dòng ghi công (FR-39) — cùng cách đọc với dòng ghi công
 * trên trang chủ: đếm theo NGÀY LỊCH, không theo 24 giờ tròn ("hôm qua" là chuyện của tờ lịch).
 * Bản sao nhỏ tại chỗ: dòng ghi công trên trang chủ ở trong một màn khác, và một cái mốc thời
 * gian không đáng để đẻ ra một mô-đun dùng chung. Chuỗi ISO trần thì KHÔNG được lên bề mặt A —
 * "2026-08-21T09:12:44.512Z" là giọng kỹ thuật (DESIGN.md § Do's and Don'ts).
 */
function thoiGianTuongDoi(luc: string, bayGio = new Date()): string {
  const at = new Date(luc);
  if (Number.isNaN(at.getTime())) return '';
  const ngayCua = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const chenh = Math.round((ngayCua(bayGio) - ngayCua(at)) / 86_400_000);
  if (chenh <= 0) return 'hôm nay';
  if (chenh === 1) return 'hôm qua';
  if (chenh < 30) return `${chenh} ngày trước`;
  if (chenh < 365) return `${Math.floor(chenh / 30)} tháng trước`;
  return `${Math.floor(chenh / 365)} năm trước`;
}

/** Dòng ngữ cảnh đời + chi + năm — cái phân biệt hai người trùng tên. */
function dongNguCanh(h: SearchHit): string {
  return [
    h.generation != null ? `đời ${h.generation}` : null,
    h.branchCode ? `chi ${h.branchCode}` : null,
    h.lifespan || null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Khối cảnh báo chàm — viền trái đặc + chữ, không bao giờ chỉ màu (DESIGN.md § Colors). */
function KhoiLoi({ loi }: { loi: string }) {
  return (
    <div role="alert" className="rounded-md border-l-4 border-destructive bg-canh-bao-nen px-4 py-3">
      <p className="text-[15px] text-foreground">{loi}</p>
    </div>
  );
}

/** Người đang chờ xác nhận — đủ cho màn chờ, dù đến từ lượt tìm này hay từ lời xin trước. */
export type NguoiDangCho = { fullName: string; nguCanh: string };

export function NhanCho({
  /** Lời nhận chỗ đang 'pending' từ trước (server đọc getMyAttachment) — mở thẳng màn chờ. */
  choSan = null,
  /**
   * Chỗ đang dở của luồng thêm (`?tiep=`, trang server đã lọc chỉ còn đường nội bộ). Chỉ dùng
   * cho đường quay về màn đăng nhập: phiên rơi giữa chừng thì vào lại xong vẫn về đúng chỗ ấy.
   */
  tiep,
}: {
  choSan?: NguoiDangCho | null;
  tiep?: string;
}) {
  const router = useRouter();
  const duongDangNhap = tiep ? `/dang-nhap?tiep=${encodeURIComponent(tiep)}` : '/dang-nhap';
  const [tuKhoa, setTuKhoa] = useState('');
  const [dangTim, setDangTim] = useState(false);
  const [daTim, setDaTim] = useState(false);
  const [ketQua, setKetQua] = useState<SearchHit[]>([]);
  const [chonId, setChonId] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  /** Người đang chờ xác nhận — khác null nghĩa là đang ở màn chờ. */
  const [dangCho, setDangCho] = useState<NguoiDangCho | null>(choSan);

  async function tim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const chuoi = tuKhoa.trim();
    if (!chuoi || dangTim) return;
    setDangTim(true);
    setLoi(null);
    setChonId(null);
    try {
      const kq = await timChinhMinh(chuoi);
      if (!kq.ok) {
        if (kq.error.code === 'unauthenticated') {
          router.push(duongDangNhap);
          return;
        }
        setLoi(LOI_TIM[kq.error.code] ?? LOI_CHUNG);
        return;
      }
      setKetQua(kq.value);
      setDaTim(true);
    } catch {
      setLoi(LOI_CHUNG);
    } finally {
      setDangTim(false);
    }
  }

  async function nhan(nguoi: SearchHit) {
    if (dangGui) return;
    setDangGui(true);
    setLoi(null);
    try {
      const kq = await nhanChoTrongPha(nguoi.personId);
      if (!kq.ok) {
        if (kq.error.code === 'unauthenticated') {
          router.push(duongDangNhap);
          return;
        }
        setLoi(LOI_NHAN[kq.error.code] ?? LOI_CHUNG);
        return;
      }
      setDangCho({ fullName: nguoi.fullName, nguCanh: dongNguCanh(nguoi) });
    } catch {
      setLoi(LOI_CHUNG);
    } finally {
      setDangGui(false);
    }
  }

  /* ── MÀN CHỜ — trạng thái ổn lâu dài, ấm, không xin lỗi ─────────────────────────────── */
  if (dangCho) {
    return (
      <section aria-live="polite">
        <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Đã gửi lời nhận chỗ</h1>
        <div className="mt-5 rounded-md border border-border bg-card px-4 py-3">
          <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
            {dangCho.fullName}
          </p>
          {dangCho.nguCanh && (
            <p className="mt-0.5 text-[15px] text-muted-foreground">{dangCho.nguCanh}</p>
          )}
        </div>
        <p className="mt-4 text-[17px]">
          Chờ một người trong họ xác nhận — thường là trưởng chi hoặc ban tu phả, có thể mất vài
          ngày. Không cần làm gì thêm; xác nhận xong là chỗ này thành chỗ của mình.
        </p>
        <p className="mt-3 text-[17px]">
          Trong lúc chờ, xem phả và tìm người vẫn đủ như trước.
        </p>
        <Button asChild variant="outline" className="mt-5 h-12 w-full text-[17px]">
          <Link href="/">Xem phả trong lúc chờ</Link>
        </Button>
      </section>
    );
  }

  /* ── MÀN TÌM + CHỌN ─────────────────────────────────────────────────────────────────── */
  return (
    <section>
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Mình là ai trong họ?</h1>
      <p className="mt-2 text-[17px]">
        Trả lời được thì phả nối được người mình ghi vào đúng nhánh, và ghi được ngay.
      </p>

      {/* Ô tìm — cùng vỏ với OTim (components/pha/o-tim.tsx), ruột là input thật đúng như
          ghi chú promote trong chính file ấy. Gõ có dấu hay không dấu đều tìm được (NFR-9). */}
      <form onSubmit={tim} className="mt-6">
        <label
          htmlFor="tim-ten-minh"
          className="block rounded-md border border-input bg-card px-4 py-3 focus-within:border-ring md:px-5 md:py-4"
        >
          <span className="block text-[15px] text-muted-foreground">Tìm tên mình trong phả</span>
          <input
            id="tim-ten-minh"
            type="search"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Gõ tên — không dấu cũng tìm được"
            autoComplete="off"
            className="mt-0.5 block w-full bg-transparent font-[family-name:var(--font-pha)] text-[17px] text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground"
          />
        </label>
        {/* Nút tìm là viền, không son: son để dành cho hành động chốt của màn — "Đây là mình". */}
        <Button
          type="submit"
          variant="outline"
          disabled={dangTim || !tuKhoa.trim()}
          className="mt-3 h-12 w-full text-[17px]"
        >
          {dangTim ? 'Đang tìm…' : 'Tìm trong phả'}
        </Button>
      </form>

      {loi && (
        <div className="mt-4">
          <KhoiLoi loi={loi} />
        </div>
      )}

      {/* ── Kết quả — khuôn "Không tìm thấy": người gần giống trước, rồi mới tới cửa tạo ── */}
      {daTim && (
        <div className="mt-7" aria-live="polite">
          {ketQua.length > 0 ? (
            <>
              <h2 className="text-[17px] font-semibold">Có phải một trong những người này?</h2>
              <ul className="mt-3 grid gap-3">
                {ketQua.map((h) => {
                  const dangChon = chonId === h.personId;
                  const tonNghi = h.tier === 'tentative';
                  const nguCanh = dongNguCanh(h);
                  const ruot = (
                    <>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                          {h.fullName}
                        </p>
                        <ChamTinCay muc={h.confidence} />
                      </div>
                      <p className="mt-0.5 text-[15px] text-muted-foreground">
                        {nguCanh || 'chưa rõ đời và chi'}
                        {h.similar && ' · tên gần giống'}
                      </p>
                      {/* Ai ghi tên này vào — phải thấy TRƯỚC khi bấm (FR-39/FR-55). */}
                      {h.attribution && (
                        <p className="mt-1 text-[15px] italic text-primary">
                          {h.attribution.byName} ghi · {thoiGianTuongDoi(h.attribution.at)}
                        </p>
                      )}
                    </>
                  );
                  // Tồn nghi: nét đứt + vân chéo, chữ đậm NGANG node thường — không opacity
                  // (DESIGN.md § Do's and Don'ts). Thẻ đang chọn: viền mực + chữ "đang chọn",
                  // không mã hoá lựa chọn chỉ bằng màu.
                  const khungThe = [
                    'w-full rounded-md px-4 py-3 text-left',
                    tonNghi
                      ? 'border border-dashed border-tin-ton-nghi bg-card van-ton-nghi'
                      : 'border border-border bg-card',
                    dangChon ? 'border-foreground' : '',
                  ].join(' ');
                  return (
                    <li key={h.personId}>
                      {dangChon ? (
                        <div className={khungThe}>
                          {ruot}
                          <p className="mt-2 text-[15px] font-semibold text-foreground">
                            Đang chọn
                          </p>
                          <p className="mt-2 text-[15px] text-muted-foreground">
                            Nhận chỗ này thì cần một người trong họ xác nhận, hoặc ban tu phả
                            duyệt.
                          </p>
                          <Button
                            type="button"
                            disabled={dangGui}
                            onClick={() => nhan(h)}
                            className="mt-3 h-12 w-full text-[17px]"
                          >
                            {dangGui ? 'Đang gửi…' : 'Đây là mình'}
                          </Button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setChonId(h.personId)} className={khungThe}>
                          {ruot}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-[17px]">
              Chưa tìm thấy tên này — gõ có dấu hay không dấu đều đã thử. Có thể tên mình chưa
              được ghi vào phả.
            </p>
          )}
        </div>
      )}

      {/* ── Hai đường còn lại — luôn bày, kể cả trước khi tìm (prototype giữ nguyên) ────── */}
      <div className="mt-7 grid gap-3">
        <Card className="gap-0 py-4">
          <CardBody className="px-4">
            <p className="text-[17px] font-semibold">Mình chưa có trong phả</p>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Khai bốn câu là xong, rồi nhận luôn chỗ vừa khai.
            </p>
            <Button asChild variant="outline" className="mt-3 h-12 w-full text-[17px]">
              <Link href="/tim">Tự khai chỗ của mình</Link>
            </Button>
          </CardBody>
        </Card>

        {/* Đường thứ ba KHÔNG phải "ghi mà không cần nhận chỗ" — spine chốt ngược lại: chưa
            nhận chỗ thì chỉ xem được phần công khai, và mọi hành động ghi dẫn về đúng luồng
            này chứ không dẫn tới một màn lỗi (§ State Patterns › Chưa gắn node). */}
        <Card className="gap-0 py-4">
          <CardBody className="px-4">
            <p className="text-[17px] font-semibold">Chưa muốn khai gì lúc này</p>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Xem phả, tìm người thì vẫn đủ như trước. Lúc nào muốn ghi thêm ai vào phả thì quay
              lại đây — phả cần biết người ghi là ai trong họ, vì tên người ghi sẽ nằm luôn cạnh
              người được ghi.
            </p>
            <Button asChild variant="outline" className="mt-3 h-12 w-full text-[17px]">
              <Link href="/">Để sau, xem tiếp</Link>
            </Button>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
