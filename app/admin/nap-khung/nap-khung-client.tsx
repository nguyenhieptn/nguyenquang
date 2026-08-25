'use client';

/**
 * NẠP KHUNG + XEM TRƯỚC SO KHỚP + GHI — một trang, ba pha (FR-51, FR-48, FR-63, FR-39).
 *
 * Port từ hai prototype đã duyệt ở commit 8fd4af1^ (`uiworkshop/nap-khung` và
 * `uiworkshop/xem-truoc-so-khop`) — JSX/bố cục/class giữ nguyên, mock thay bằng core
 * qua server actions. Vì sao MỘT trang: xem ghi chú đầu `actions.ts` (không có chỗ lưu
 * tệp tạm server-side, CSV quá to cho cookie — văn bản tệp sống trong state client).
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Component Patterns › Bảng xem trước so khớp (ba trạng thái, cảnh báo
 *     chèn trong dòng, KHÔNG cái nào chọn sẵn cho dòng nghi trùng, bộ lọc)
 *   · EXPERIENCE.md § Bề mặt B — "Cảnh báo không có màn riêng" (bộ lọc Cần xem lại)
 *   · EXPERIENCE.md § Key Flows — Luồng 2 (cao trào bước 8 mượn màn bề mặt A: ca-toc)
 *   · DESIGN.md § Colors › Bề mặt B (khung trần; dữ liệu phả vẫn serif-phả) · cảnh báo chàm
 *
 * ĐÂY LÀ CHỖ DUY NHẤT CHẶN ĐƯỢC BẢN TRÙNG RẺ TIỀN: dòng nghi trùng chưa chọn hướng xử lý
 * thì nút ghi đứng yên — thà bắt dừng lại còn hơn cho trôi (FR-48: bot gợi ý, không tự quyết).
 */
import { Fragment, useActionState, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SeedCommitResult, SeedDecision, SeedDecisions } from '@/core/seed';
import type { Result } from '@/core/types';
import { ghiVaoPha, xemTruoc, type DongXemTruoc, type KetQuaXemTruoc } from './actions';

type Loc = 'tat-ca' | 'nguoi-moi' | 'khop' | 'can-xem-lai';

const MOI_LOC: readonly Loc[] = ['tat-ca', 'nguoi-moi', 'khop', 'can-xem-lai'];

/**
 * BỘ LỌC SOI VÀO URL — `?loc=can-xem-lai` (EXPERIENCE.md § Bề mặt B, "Cảnh báo không có màn
 * riêng"). Spec đặt cho "Bảng cảnh báo" một địa chỉ chứ không đặt cho nó một màn: cùng route,
 * cùng bảng, lọc lại. Không có địa chỉ thì không chỉ trỏ được cho người khác, và F5 mất chỗ
 * đang đứng.
 *
 * `history.replaceState` chứ không `router.push`: luồng nạp khung sống trọn trong state client
 * (văn bản tệp không rời trình duyệt — xem ghi chú đầu file), nên điều hướng thật sẽ NÉM MẤT cả
 * bảng xem trước. Đổi bộ lọc cũng không đáng một mục lịch sử riêng: nút Back phải quay về chỗ
 * trước khi nạp tệp, không phải lùi qua từng lần bấm chip.
 */
function docLocTuUrl(): Loc {
  if (typeof window === 'undefined') return 'tat-ca';
  const tham = new URLSearchParams(window.location.search).get('loc');
  return MOI_LOC.find((l) => l === tham) ?? 'tat-ca';
}

function soiLocVaoUrl(loc: Loc): void {
  if (typeof window === 'undefined') return;
  const dia = new URL(window.location.href);
  // 'tat-ca' là mặc định — để nó ra khỏi URL, đường dẫn trần vẫn là đường dẫn đúng.
  if (loc === 'tat-ca') dia.searchParams.delete('loc');
  else dia.searchParams.set('loc', loc);
  window.history.replaceState(null, '', `${dia.pathname}${dia.search}`);
}

// ── Chữ dùng chung ───────────────────────────────────────────────────────────

function nhanNam(d: Pick<DongXemTruoc, 'namSinh' | 'namMat'>): string {
  if (d.namSinh && d.namMat) return `${d.namSinh}–${d.namMat}`;
  if (d.namMat) return `mất ${d.namMat}`;
  if (d.namSinh) return `sinh ${d.namSinh}`;
  return 'chưa biết năm';
}

function nhanGioiTinh(g: DongXemTruoc['gioiTinh']): string | null {
  if (g === 'nam') return 'nam';
  if (g === 'nu') return 'nữ';
  if (g === 'khac') return 'khác';
  return null;
}

const canXemLai = (d: DongXemTruoc): boolean => d.phanLoai === 'nghi-trung' || d.canhBao.length > 0;

/**
 * Quyết định mặc định cho một dòng:
 *   · nghi trùng → KHÔNG CÓ — bot gợi ý, không tự quyết (FR-48); người vận hành phải chọn.
 *   · dòng mang cảnh báo → bỏ qua (chưa tích) — ghi hàng loạt không được cuốn theo một dòng
 *     chưa ai nhìn tới (nếp của prototype: checkbox chỉ tích sẵn cho dòng sạch).
 *   · khớp người có sẵn → nối vào đúng ứng viên duy nhất.
 *   · người mới → tạo mới.
 */
function macDinhCua(d: DongXemTruoc): SeedDecision | null {
  if (d.phanLoai === 'nghi-trung') return null;
  if (d.canhBao.length > 0) return { action: 'skip' };
  if (d.phanLoai === 'khop-nguoi-co-san' && d.ungVien[0])
    return { action: 'link', personId: d.ungVien[0].personId };
  return { action: 'create' };
}

// ── Pha 1: nạp tệp (port từ uiworkshop/nap-khung) ────────────────────────────

/**
 * Các cột của file mẫu — chép đúng SEED_COLUMNS của core/seed/csv.ts, kèm mã cột thật
 * (bề mặt B được dùng từ kỹ thuật). Cột "để trống được" là cột QUAN TRỌNG NHẤT của bảng
 * này: một ô trống nói đúng sự thật, còn một con số điền tạm thì về sau không ai biết là đoán.
 */
const COT_MAU: { ma: string; ten: string; batBuoc: boolean; viDu: string; ghiChu?: string }[] = [
  { ma: 'ho_ten', ten: 'họ tên', batBuoc: true, viDu: 'Nguyễn Văn An' },
  { ma: 'gioi_tinh', ten: 'giới tính', batBuoc: false, viDu: 'nam', ghiChu: 'nam / nữ / khác' },
  { ma: 'nam_sinh', ten: 'năm sinh', batBuoc: false, viDu: '1900', ghiChu: 'số năm 4 chữ số' },
  { ma: 'nam_mat', ten: 'năm mất', batBuoc: false, viDu: '1972', ghiChu: 'để trống nếu còn sống' },
  {
    ma: 'ten_cha',
    ten: 'tên cha',
    batBuoc: false,
    viDu: 'Nguyễn Văn An',
    ghiChu: 'để trống nếu chưa truy được đời trên',
  },
  {
    ma: 'ten_vo_chong',
    ten: 'vợ/chồng của',
    batBuoc: false,
    viDu: 'Trần Thị Bốn',
    ghiChu: 'cột nối người kết hôn vào họ',
  },
  { ma: 'chi', ten: 'chi', batBuoc: false, viDu: 'Chi Nhất', ghiChu: 'nhãn chi hiện dùng' },
  {
    ma: 'ghi_chu',
    ten: 'ghi chú',
    batBuoc: false,
    viDu: 'Bia nhà thờ họ — ảnh chụp 03/2026',
    ghiChu: 'nguồn, xuất xứ của dòng',
  },
];

function KhoiLoiNap({ loi }: { loi: { code: string; message: string } }) {
  return (
    <div className="mt-4 border-l-4 border-destructive bg-canh-bao-nen px-5 py-4">
      {loi.code === 'invalid' ? (
        <>
          <p className="text-[17px] font-semibold text-destructive">Tệp chưa đọc được</p>
          {/* Thông điệp validate từ core, từng dòng kèm số dòng — bề mặt B được dùng từ kỹ thuật. */}
          <p className="mt-1 whitespace-pre-wrap font-mono text-[15px]">{loi.message}</p>
          <p className="mt-2 text-[17px] text-muted-foreground">
            Sửa trong tệp rồi chọn lại — chưa dòng nào được ghi vào phả.
          </p>
        </>
      ) : loi.code === 'unauthenticated' ? (
        <>
          <p className="text-[17px] font-semibold text-destructive">Phiên đăng nhập đã hết</p>
          <p className="mt-1 text-[17px]">
            <a href="/dang-nhap" className="inline-flex min-h-11 items-center underline">
              Đăng nhập lại
            </a>{' '}
            rồi nạp tệp một lần nữa.
          </p>
        </>
      ) : loi.code === 'forbidden' ? (
        <p className="text-[17px] font-semibold text-destructive">
          Việc này cần quyền duyệt của Ban tu phả.
        </p>
      ) : (
        <>
          <p className="text-[17px] font-semibold text-destructive">Chưa nạp được tệp</p>
          <p className="mt-1 font-mono text-[15px]">
            {loi.code} — {loi.message}
          </p>
        </>
      )}
    </div>
  );
}

function PhaNapTep({
  formAction,
  dangXemTruoc,
  loi,
}: {
  formAction: (formData: FormData) => void;
  dangXemTruoc: boolean;
  loi: { code: string; message: string } | null;
}) {
  const [tenTepChon, setTenTepChon] = useState<string | null>(null);

  return (
    <div>
      <p className="max-w-[62ch] text-[17px]">
        Khung là phần đã biết trước khi có ai tự khai: các chi hiện có, người đứng đầu mỗi chi,
        những cụ đã biết tên.
      </p>
      {/* Câu này từ trang chỉ đường "Xem trước" cũ (đã xoá 24/08): thông tin không rơi mất,
          chỉ đổi chỗ về đúng nơi việc ấy xảy ra. */}
      <p className="mt-1.5 max-w-[62ch] text-[17px] text-muted-foreground">
        Bảng xem trước so khớp mở ra ngay trên trang này sau khi chọn tệp — cùng một chỗ, tệp
        không phải tải lên hai lần.
      </p>

      {/* FR-51 + FR-63 — hai lời hứa phải nói TRƯỚC khi người ta bỏ công điền, không phải sau
          khi đã ghi. Chúng là thứ khiến việc điền một khung còn thiếu không đáng sợ. */}
      <Card className="mt-5 border-ban-vien bg-ban-o py-4">
        <CardBody className="px-5">
          <ul className="space-y-2 text-[17px]">
            <li>
              Mọi dòng vào <strong>Tầng tồn nghi</strong> — ghi rồi vẫn sửa được, không có gì
              khoá lại.
            </li>
            <li>
              Người không truy được đời trên sẽ thành <strong>gốc tạm của một mảnh</strong>, và
              trên phả ghi rõ đó là <em>cụ xa nhất hiện biết</em> — không phải khẳng định đã là
              Thuỷ tổ.
            </li>
            <li className="text-muted-foreground">
              Chưa dòng nào được ghi vào phả cho tới khi bấm ghi ở bảng xem trước.
            </li>
          </ul>
        </CardBody>
      </Card>

      {/* ── Bước 1 — tải mẫu ──────────────────────────────────────────────── */}
      <h2 className="mt-10 text-[19px] font-semibold">1 · Tải file mẫu</h2>
      <p className="mt-1.5 max-w-[62ch] text-[17px] text-muted-foreground">
        Điền ngoài hệ thống, mỗi người một dòng. <strong>Để trống cột chưa biết.</strong> Khung là
        thứ chưa đầy đủ theo định nghĩa — một ô trống nói đúng sự thật, còn một con số điền tạm
        thì về sau không ai biết là đoán.
      </p>

      <div className="mt-4 overflow-hidden rounded-md border border-ban-vien bg-ban-o">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[15px]">Cột</TableHead>
              <TableHead className="text-[15px]">Bắt buộc</TableHead>
              <TableHead className="text-[15px]">Ví dụ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COT_MAU.map((c) => (
              <TableRow key={c.ma}>
                <TableCell className="text-[17px]">
                  {c.ten}
                  <span className="block font-mono text-[15px] text-muted-foreground">{c.ma}</span>
                </TableCell>
                <TableCell className="text-[17px]">
                  {c.batBuoc ? (
                    'bắt buộc'
                  ) : (
                    <span className="text-muted-foreground">để trống được</span>
                  )}
                </TableCell>
                <TableCell className="text-[17px]">
                  {/* Ví dụ là tên NGƯỜI trong phả ⇒ theo luật bề mặt A: serif-phả. */}
                  <span className="font-[family-name:var(--font-pha)]">{c.viDu}</span>
                  {c.ghiChu ? (
                    <span className="block text-[15px] text-muted-foreground">{c.ghiChu}</span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button asChild variant="outline" className="mt-4 h-11 text-[17px]">
        <a href="/admin/nap-khung/mau" download>
          Tải file mẫu
        </a>
      </Button>

      {/* ── Bước 2 — tải lên ──────────────────────────────────────────────── */}
      <h2 className="mt-10 text-[19px] font-semibold">2 · Tải file đã điền lên</h2>

      {loi ? <KhoiLoiNap loi={loi} /> : null}

      <form action={formAction}>
        <div className="mt-3 rounded-md border-2 border-dashed border-ban-vien bg-ban-o px-6 py-10 text-center">
          <p className="text-[17px]">Chọn tệp .csv đã điền theo mẫu ở trên</p>
          <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center">
            <input
              type="file"
              name="tep"
              required
              accept=".csv,text/csv"
              onChange={(e) => setTenTepChon(e.currentTarget.files?.[0]?.name ?? null)}
              className="text-[17px] file:mr-4 file:min-h-11 file:cursor-pointer file:rounded-md file:border file:border-solid file:border-ban-vien file:bg-ban-o file:px-4 file:text-[17px]"
            />
          </label>
        </div>

        {tenTepChon ? (
          <div className="mt-4 rounded-md border border-ban-vien bg-ban-o px-5 py-4">
            <p className="text-[17px]">
              <strong>{tenTepChon}</strong>
            </p>
            <div className="mt-4 flex items-center gap-4">
              {/* Hành động chính ⇒ son. Đây là chỗ duy nhất trên pha này dùng son. */}
              <Button type="submit" disabled={dangXemTruoc} className="h-11 text-[17px]">
                {dangXemTruoc ? 'Đang so khớp…' : 'Xem trước so khớp'}
              </Button>
            </div>
            <p className="mt-3 text-[15px] text-muted-foreground">
              Chưa dòng nào được ghi vào phả.
            </p>
          </div>
        ) : null}
      </form>
    </div>
  );
}

// ── Pha 2: bảng xem trước (port từ uiworkshop/xem-truoc-so-khop) ─────────────

/** Người đã có trong phả, vẽ theo luật BỀ MẶT A — đây là khẳng định về người thật. */
function TheUngVien({ ungVien }: { ungVien: DongXemTruoc['ungVien'][number] }) {
  return (
    <div className="rounded-md border border-border bg-card px-3.5 py-2.5">
      <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">{ungVien.name}</p>
      <p className="mt-0.5 text-[15px] text-muted-foreground">
        {ungVien.birthYear ? `sinh ${ungVien.birthYear}` : 'chưa biết năm sinh'}
      </p>
      {/* Preview của core cố ý không tính đời + chi (AD-5, giữ preview rẻ) — bù bằng lối mở
          trang người để đối chiếu tận nơi trước khi quyết. */}
      <a
        href={`/nguoi/${ungVien.personId}`}
        target="_blank"
        rel="noreferrer"
        className="mt-0.5 inline-flex min-h-11 items-center text-[15px] underline"
      >
        Mở trang người này
      </a>
    </div>
  );
}

function LuaChon({
  ten,
  dangChon,
  chon,
  nhan,
  phu,
}: {
  ten: string;
  dangChon: boolean;
  chon: () => void;
  nhan: string;
  phu?: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
      <input
        type="radio"
        name={ten}
        checked={dangChon}
        onChange={chon}
        className="mt-1 size-5 shrink-0 accent-foreground"
      />
      <span className="text-[17px]">
        {nhan}
        {phu ? <span className="block text-[15px] text-muted-foreground">{phu}</span> : null}
      </span>
    </label>
  );
}

/**
 * Khối cảnh báo — chàm mực, viền trái đặc, luôn kèm chữ nói rõ bot thấy gì (không mã hoá chỉ
 * bằng màu). Nằm NGAY DƯỚI dòng nó nói về — mọi thứ cần để quyết trong cùng một tầm mắt.
 * Với dòng nghi trùng, đây cũng là nơi CHỌN hướng xử lý — không cái nào chọn sẵn (FR-48).
 */
function KhoiCanhBao({
  dong,
  tatCa,
  quyetDinh,
  datQuyetDinh,
}: {
  dong: DongXemTruoc;
  tatCa: DongXemTruoc[];
  quyetDinh: SeedDecision | null;
  datQuyetDinh: (qd: SeedDecision) => void;
}) {
  const nghiTrung = dong.phanLoai === 'nghi-trung';
  const chaKhongThay = dong.canhBao.includes('father-not-found');
  const chaMoHo = dong.canhBao.includes('father-ambiguous');
  if (!nghiTrung && !chaKhongThay && !chaMoHo) return null;

  const tenNhom = `quyet-dinh-${dong.index}`;

  return (
    <div className="space-y-5 border-l-4 border-destructive bg-canh-bao-nen px-5 py-4">
      {nghiTrung ? (
        <div>
          <p className="text-[17px] font-semibold text-destructive">Có thể đã có trong phả</p>

          {/* Ứng viên là DÒNG KHÁC trong chính tệp — ca rất thường của file điền tay, khi hai
              người kể cùng nhắc tới một cụ. */}
          {dong.trungTrongTep.map((index) => {
            const khac = tatCa.find((d) => d.index === index);
            if (!khac) return null;
            return (
              <p key={index} className="mt-1 max-w-[70ch] text-[17px]">
                Dòng {khac.line} trong chính tệp này cũng là{' '}
                <span className="font-[family-name:var(--font-pha)]">{khac.hoTen}</span>,{' '}
                {nhanNam(khac)}. Nếu hai dòng là cùng một cụ: giữ một dòng ghi thành người mới và
                để lại dòng kia.
              </p>
            );
          })}

          {/* Ứng viên đã có trong phả — bày ra, chọn bằng đúng MỘT bộ radio bên dưới. */}
          {dong.ungVien.length > 0 ? (
            <>
              <p className="mt-1 max-w-[70ch] text-[17px]">
                Trong phả đang có {dong.ungVien.length} người trùng tên:
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {dong.ungVien.map((uv) => (
                  <div key={uv.personId} className="w-[300px]">
                    <TheUngVien ungVien={uv} />
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {/* KHÔNG cái nào được chọn sẵn — bot chọn sẵn là bot đã quyết hộ (FR-48). */}
          <div className="mt-3">
            {dong.ungVien.map((uv) => (
              <LuaChon
                key={uv.personId}
                ten={tenNhom}
                dangChon={quyetDinh?.action === 'link' && quyetDinh.personId === uv.personId}
                chon={() => datQuyetDinh({ action: 'link', personId: uv.personId })}
                nhan={`Là cùng cụ này — ${uv.name}`}
                phu="không tạo người mới, dòng này nối vào người đã có"
              />
            ))}
            <LuaChon
              ten={tenNhom}
              dangChon={quyetDinh?.action === 'create'}
              chon={() => datQuyetDinh({ action: 'create' })}
              nhan="Là người khác — ghi thành người mới"
            />
            <LuaChon
              ten={tenNhom}
              dangChon={quyetDinh?.action === 'skip'}
              chon={() => datQuyetDinh({ action: 'skip' })}
              nhan="Để lại dòng này"
              phu="không ghi trong đợt này, tệp không bị sửa"
            />
          </div>
        </div>
      ) : null}

      {/* Cha MƠ HỒ — khác hẳn cha không tìm thấy, và tệ hơn: người ấy CÓ trong tệp/trong phả,
          chỉ là có tới hai người cùng tên. Bộ nạp từ chối đoán (xem `resolveByName`), nên dòng
          này cũng vào phả mà không có cha. Nói thẳng ra, kẻo người vận hành thấy tên cha nằm
          ngay trong tệp rồi yên trí là đã nối. */}
      {chaMoHo ? (
        <div>
          <p className="text-[17px] font-semibold text-destructive">Có hai người cùng tên cha</p>
          <p className="mt-1 max-w-[70ch] text-[17px]">
            Dòng này khai cha là{' '}
            <span className="font-[family-name:var(--font-pha)]">{dong.tenCha}</span>, nhưng có
            hơn một người mang đúng tên ấy. Máy <strong>không đoán</strong> — nối nhầm cha là
            hỏng phả của cả một chi, còn thiếu một mối nối thì nối lại được.
          </p>
          <p className="mt-1 max-w-[70ch] text-[17px] text-muted-foreground">
            <span className="font-[family-name:var(--font-pha)]">{dong.hoTen}</span> vẫn ghi được,
            và sẽ đứng thành gốc tạm của một mảnh. Nối vào đúng người cha ở màn{' '}
            <strong>Mảnh chưa nối</strong> — ở đó nhìn được cả hai người cùng tên rồi mới chọn.
            {/* Câu này KHÔNG thừa. `macDinhCua` bỏ tích MỌI dòng có cảnh báo, nên lời hứa "vẫn
                ghi được" ở ngay trên sẽ thành lời nói dối nếu không chỉ luôn chỗ bấm: người vận
                hành đọc, bấm ghi, đứa con không được tạo, commit vẫn báo thành công, rồi họ sang
                màn "Mảnh chưa nối" tìm một mảnh chưa từng tồn tại. Khối `chaKhongThay` ngay dưới
                đã có câu này từ đầu; khối này bị sót. */}
            {!nghiTrung ? ' Tích chọn ở đầu dòng để vẫn ghi.' : ''}
          </p>
        </div>
      ) : null}

      {chaKhongThay ? (
        <div>
          <p className="text-[17px] font-semibold text-destructive">Không tìm thấy người cha</p>
          <p className="mt-1 max-w-[70ch] text-[17px]">
            Dòng này khai cha là{' '}
            <span className="font-[family-name:var(--font-pha)]">{dong.tenCha}</span>, nhưng không
            có ai tên ấy — cả trong tệp lẫn trong phả.
          </p>
          <p className="mt-1 max-w-[70ch] text-[17px] text-muted-foreground">
            Ghi vẫn được: <span className="font-[family-name:var(--font-pha)]">{dong.hoTen}</span>{' '}
            sẽ thành gốc tạm của một mảnh mới, ghi rõ là <em>cụ xa nhất hiện biết</em> của mảnh
            ấy. Nối vào cây chung được, sau — khi có ai truy ra đời trên.
            {!nghiTrung ? ' Tích chọn ở đầu dòng để vẫn ghi.' : ''}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function OSoKhop({ dong }: { dong: DongXemTruoc }) {
  if (dong.phanLoai === 'khop-nguoi-co-san' && dong.ungVien[0]) {
    const uv = dong.ungVien[0];
    return (
      <>
        <p className="text-[17px]">Khớp người có sẵn</p>
        <p className="mt-0.5 text-[15px] text-muted-foreground">
          <span className="font-[family-name:var(--font-pha)]">{uv.name}</span>
          {uv.birthYear ? ` · sinh ${uv.birthYear}` : ''}
        </p>
        <a
          href={`/nguoi/${uv.personId}`}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 inline-flex min-h-11 items-center text-[15px] underline"
        >
          Mở trang người này
        </a>
      </>
    );
  }
  if (dong.phanLoai === 'nghi-trung') {
    return (
      <>
        <p className="text-[17px] font-semibold text-destructive">Nghi trùng</p>
        <p className="mt-0.5 text-[15px] text-muted-foreground">chọn hướng xử lý ngay dưới dòng</p>
      </>
    );
  }
  return (
    <>
      <p className="text-[17px]">Người mới</p>
      <p className="mt-0.5 text-[15px] text-muted-foreground">chưa có ai trùng</p>
    </>
  );
}

function ChipLoc({
  dong,
  loc,
  datLoc,
}: {
  dong: DongXemTruoc[];
  loc: Loc;
  datLoc: (loc: Loc) => void;
}) {
  const muc: { key: Loc; nhan: string; so: number }[] = [
    { key: 'tat-ca', nhan: 'Tất cả', so: dong.length },
    { key: 'nguoi-moi', nhan: 'Người mới', so: dong.filter((d) => d.phanLoai === 'nguoi-moi').length },
    {
      key: 'khop',
      nhan: 'Khớp người có sẵn',
      so: dong.filter((d) => d.phanLoai === 'khop-nguoi-co-san').length,
    },
    // Mục cuối thay cho "màn bảng cảnh báo": cùng một bảng, cùng dữ liệu, lọc lại.
    { key: 'can-xem-lai', nhan: 'Cần xem lại', so: dong.filter(canXemLai).length },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {muc.map((m) => {
        const dangMo = m.key === loc;
        const canhBao = m.key === 'can-xem-lai' && m.so > 0;
        return (
          <button
            key={m.key}
            type="button"
            aria-pressed={dangMo}
            onClick={() => datLoc(m.key)}
            className={[
              'min-h-11 rounded-md border px-3.5 text-[17px]',
              dangMo ? 'border-foreground bg-ban-o font-semibold' : 'border-ban-vien bg-ban-o',
              canhBao && !dangMo ? 'text-destructive' : '',
            ].join(' ')}
          >
            {m.nhan} <span className="text-muted-foreground">({m.so})</span>
          </button>
        );
      })}
    </div>
  );
}

const NHAN_TRONG: Record<Loc, string> = {
  'tat-ca': 'Tệp không có dòng nào.',
  'nguoi-moi': 'Không dòng nào là người mới.',
  khop: 'Không dòng nào khớp người có sẵn.',
  'can-xem-lai': 'Không dòng nào cần xem lại.',
};

// ── Pha 3: cao trào — mượn màn bề mặt A (EXPERIENCE Luồng 2, bước 8) ─────────

function CaoTrao({ ketQua }: { ketQua: SeedCommitResult }) {
  return (
    <div className="py-16 text-center">
      {/* KHÔNG bảng báo cáo. Phần thưởng của việc gieo mồi là thứ dòng họ sắp nhìn thấy —
          một liên kết son mở thẳng cây cả tộc, đúng hình dạng người trong họ sẽ gặp. */}
      <a
        href="/gia-pha/ca-toc"
        className="inline-flex min-h-14 items-center rounded-md bg-primary px-8 font-[family-name:var(--font-pha)] text-[23px] text-primary-foreground"
      >
        Xem cây vừa thành hình
      </a>
      <p className="mx-auto mt-6 max-w-[62ch] text-[17px] text-muted-foreground">
        Đã ghi {ketQua.created} người mới
        {ketQua.linked > 0 ? ` · nối ${ketQua.linked} dòng vào người có sẵn` : ''}
        {ketQua.skipped > 0 ? ` · để lại ${ketQua.skipped} dòng` : ''}
        . Toàn bộ vào Tầng tồn nghi — sửa được về sau.
      </p>
      {/* <a> thường (không phải Link): tải lại TRỌN trang là cách duy nhất reset sạch pha nạp —
          tệp đã chọn, bản xem trước, kết quả. `<Link>` giữ component sống nên state ở lại, và
          người vận hành bấm "Nạp thêm một tệp khác" lại thấy kết quả của tệp trước. */}
      <p className="mt-10">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- cố ý, xem ngay trên */}
        <a
          href="/admin/nap-khung"
          className="inline-flex min-h-11 items-center text-[15px] text-muted-foreground underline"
        >
          Nạp thêm một tệp khác
        </a>
      </p>
    </div>
  );
}

// ── Bảng xem trước ───────────────────────────────────────────────────────────

function PhaXemTruoc({ ketQua, boTep }: { ketQua: KetQuaXemTruoc; boTep: () => void }) {
  const { dong, tenTep, vanBan } = ketQua;

  // Quyết định người vận hành đã đụng tay; dòng chưa đụng dùng mặc định của macDinhCua.
  const [daChon, setDaChon] = useState<Record<number, SeedDecision>>({});
  // Đọc lúc dựng (khối này chỉ dựng ở client, sau khi action trả bảng xem trước — không có
  // bản HTML từ server để lệch nhau), rồi mỗi lần đổi lại soi ngược ra URL.
  const [loc, setLoc] = useState<Loc>(docLocTuUrl);
  const [ketQuaGhi, setKetQuaGhi] = useState<Result<SeedCommitResult> | null>(null);
  /** Lượt ghi không tới nơi được — KHÁC một lượt ghi bị core từ chối. Xem chỗ `catch` dưới. */
  const [loiMang, setLoiMang] = useState(false);
  const [dangGhi, batDauGhi] = useTransition();

  const datLoc = (moi: Loc) => {
    setLoc(moi);
    soiLocVaoUrl(moi);
  };

  const quyetDinhCua = (d: DongXemTruoc): SeedDecision | null => daChon[d.index] ?? macDinhCua(d);
  const datQuyetDinh = (index: number, qd: SeedDecision) =>
    setDaChon((truoc) => ({ ...truoc, [index]: qd }));

  const chuaQuyet = dong.filter((d) => quyetDinhCua(d) === null);
  const seGhi = dong.filter((d) => {
    const qd = quyetDinhCua(d);
    return qd !== null && qd.action !== 'skip';
  });

  if (ketQuaGhi?.ok) return <CaoTrao ketQua={ketQuaGhi.value} />;

  const dongTheoLoc = dong.filter((d) => {
    if (loc === 'nguoi-moi') return d.phanLoai === 'nguoi-moi';
    if (loc === 'khop') return d.phanLoai === 'khop-nguoi-co-san';
    if (loc === 'can-xem-lai') return canXemLai(d);
    return true;
  });

  const ghi = () => {
    if (chuaQuyet.length > 0 || seGhi.length === 0) return;
    const quyetDinh: SeedDecisions = {};
    for (const d of dong) quyetDinh[d.index] = quyetDinhCua(d)!;
    setLoiMang(false);
    batDauGhi(async () => {
      try {
        setKetQuaGhi(await ghiVaoPha(vanBan, quyetDinh));
      } catch {
        /**
         * Ba file anh em đã bọc `try` sau code review 25/08, và lối này — lối ghi NẶNG NHẤT của
         * cả sản phẩm, cả một tệp người vào phả một lượt — bị bỏ sót.
         *
         * Không bọc thì reject đi ra `reportGlobalError`: `dangGhi` tự tắt, nút trở lại đọc "Ghi
         * 40 dòng vào phả", KHÔNG có lỗi nào hiện. Người vận hành bấm lần nữa. Nếu lượt đầu đã
         * tới máy chủ thì đó là hai lượt nạp trọn tệp vào một kho không có phép xoá (AD-4).
         */
        // State RIÊNG, không bịa một `CoreError`. Đứt mạng giữa chừng không phải một phán quyết
        // của core — nó là *"không biết lượt ghi ấy có tới nơi hay không"*, và câu ấy phải nói
        // được nguyên vẹn, kể cả phần "kiểm lại phả trước khi bấm lần nữa".
        setLoiMang(true);
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {/* `<h2>` chứ không `<h1>`: xem trước là một BƯỚC của màn Nạp khung, không phải một
              màn khác. `<h1>` do layout dựng, đúng một cái cho cả trang. */}
          <h2 className="text-[19px] font-semibold">Xem trước so khớp</h2>
          <p className="mt-1 text-[17px] text-muted-foreground">
            {tenTep} · {dong.length} dòng · mọi dòng ghi vào Tầng tồn nghi
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Son = đã chốt. Ghi vào phả đúng là hành động chốt, nên đây là chỗ son thuộc về. */}
          <Button
            type="button"
            onClick={ghi}
            disabled={dangGhi || chuaQuyet.length > 0 || seGhi.length === 0}
            className="h-11 text-[17px]"
          >
            {dangGhi ? 'Đang ghi…' : `Ghi ${seGhi.length} dòng vào phả`}
          </Button>
          {/*
            KHOÁ trong lúc ghi — ngược với nút "Thôi" của hai biểu mẫu bên cột phải, và có lý do.

            `ketQuaGhi` sống TRONG component này, còn `boTep` thì tháo nguyên component. Bấm nó
            giữa chừng thì lượt ghi vẫn chốt ở máy chủ nhưng `SeedCommitResult` — bản kê duy nhất
            nói dòng nào đã vào, dòng nào bị để lại — không bao giờ hiện ra. Người vận hành về
            màn chọn tệp mà không có cách nào biết tệp ấy đã nạp hay chưa.

            Ở đây khoá không đẻ ra bẫy: `useTransition` nhả `dangGhi` cả khi promise reject, khác
            hẳn `setDangGui(false)` viết tay của lỗi C6.
          */}
          <Button
            type="button"
            variant="ghost"
            disabled={dangGhi}
            onClick={boTep}
            className="h-11 text-[17px]"
          >
            Bỏ tệp này
          </Button>
        </div>
      </div>

      {loiMang ? (
        <p className="mt-3 max-w-[70ch] border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[17px]">
          Không gửi được lên máy chủ, và <strong>chưa biết lượt ghi có tới nơi hay không</strong>.
          Mở màn Cây gia phả kiểm xem tệp này đã vào phả chưa rồi hãy bấm lại — bấm lần nữa khi nó
          đã vào là nạp tệp hai lần, mà phả không có phép xoá.
        </p>
      ) : null}

      {/* Nghi trùng chưa quyết thì nút ghi đứng yên — nói rõ vì sao, và chỉ đường tới đúng chỗ. */}
      {chuaQuyet.length > 0 ? (
        <p className="mt-3 text-[17px] text-destructive">
          Còn {chuaQuyet.length} dòng nghi trùng chưa chọn hướng xử lý — chọn ở khối cảnh báo
          dưới từng dòng rồi mới ghi được.
        </p>
      ) : null}

      {ketQuaGhi && !ketQuaGhi.ok ? (
        <div className="mt-4 border-l-4 border-destructive bg-canh-bao-nen px-5 py-4">
          <p className="text-[17px] font-semibold text-destructive">Chưa ghi được</p>
          <p className="mt-1 whitespace-pre-wrap font-mono text-[15px]">
            {ketQuaGhi.error.code} — {ketQuaGhi.error.message}
          </p>
          <p className="mt-2 text-[17px] text-muted-foreground">
            Toàn bộ đợt ghi được hoàn lại — chưa dòng nào vào phả.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <ChipLoc dong={dong} loc={loc} datLoc={datLoc} />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-ban-vien bg-ban-o">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead className="w-14 text-[15px]">Dòng</TableHead>
              <TableHead className="text-[15px]">Người</TableHead>
              <TableHead className="text-[15px]">Nối vào</TableHead>
              <TableHead className="text-[15px]">So khớp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dongTheoLoc.map((d) => {
              const qd = quyetDinhCua(d);
              const nghiTrung = d.phanLoai === 'nghi-trung';
              return (
                // Cảnh báo là một HÀNG RIÊNG ngay dưới, không phải một cột: nó cần cả bề ngang
                // bảng để bày ứng viên, và nó thuộc về đúng dòng ấy chứ không phải màn khác.
                <Fragment key={d.index}>
                  <TableRow className="align-top">
                    <TableCell className="py-3">
                      {/* Dòng nghi trùng KHÔNG có ô tích — quyết định của nó nằm ở khối cảnh
                          báo, một dòng một chỗ quyết, không hai nơi giẫm nhau. */}
                      {!nghiTrung ? (
                        <Checkbox
                          checked={qd !== null && qd.action !== 'skip'}
                          onCheckedChange={(v) =>
                            datQuyetDinh(
                              d.index,
                              v === true
                                ? d.phanLoai === 'khop-nguoi-co-san' && d.ungVien[0]
                                  ? { action: 'link', personId: d.ungVien[0].personId }
                                  : { action: 'create' }
                                : { action: 'skip' },
                            )
                          }
                          aria-label={`Chọn dòng ${d.line}`}
                          className="size-5 after:-inset-x-3.5 after:-inset-y-3"
                        />
                      ) : null}
                    </TableCell>
                    <TableCell className="py-3 text-[17px] text-muted-foreground">
                      {d.line}
                    </TableCell>
                    <TableCell className="py-3">
                      {/* Tên người = khẳng định về người thật ⇒ luật bề mặt A: serif-phả. */}
                      <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                        {d.hoTen}
                      </p>
                      <p className="mt-0.5 text-[15px] text-muted-foreground">
                        {[nhanGioiTinh(d.gioiTinh), nhanNam(d)].filter(Boolean).join(' · ')}
                        {d.chi ? ` · ${d.chi}` : ''}
                      </p>
                      {d.ghiChu ? (
                        <p className="mt-0.5 text-[15px] text-muted-foreground">{d.ghiChu}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-3">
                      {d.tenCha ? (
                        <p className="text-[17px]">
                          <span className="text-muted-foreground">cha </span>
                          <span className="font-[family-name:var(--font-pha)]">{d.tenCha}</span>
                        </p>
                      ) : null}
                      {d.tenVoChong ? (
                        <p className="text-[17px]">
                          <span className="text-muted-foreground">vợ/chồng của </span>
                          <span className="font-[family-name:var(--font-pha)]">{d.tenVoChong}</span>
                        </p>
                      ) : null}
                      {!d.tenCha && !d.tenVoChong ? (
                        <p className="text-[17px] text-muted-foreground">chưa truy được đời trên</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-3">
                      <OSoKhop dong={d} />
                    </TableCell>
                  </TableRow>

                  {nghiTrung ||
                  d.canhBao.includes('father-not-found') ||
                  d.canhBao.includes('father-ambiguous') ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="p-0">
                        <KhoiCanhBao
                          dong={d}
                          tatCa={dong}
                          quyetDinh={daChon[d.index] ?? null}
                          datQuyetDinh={(quyet) => datQuyetDinh(d.index, quyet)}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>

        {dongTheoLoc.length === 0 ? (
          <p className="px-5 py-6 text-[17px] text-muted-foreground">{NHAN_TRONG[loc]}</p>
        ) : null}
      </div>
    </div>
  );
}

// ── Ghép ba pha ──────────────────────────────────────────────────────────────

export function NapKhungClient() {
  const [ketQua, guiTep, dangXemTruoc] = useActionState(xemTruoc, null);
  // "Bỏ tệp này" không xoá được state của useActionState — ghi nhớ nonce đã bỏ là đủ.
  const [nonceDaBo, setNonceDaBo] = useState<number | null>(null);

  const xemTruocDangMo = ketQua?.ok === true && ketQua.value.nonce !== nonceDaBo;

  if (xemTruocDangMo && ketQua?.ok) {
    return (
      <PhaXemTruoc
        key={ketQua.value.nonce}
        ketQua={ketQua.value}
        boTep={() => {
          // Bỏ tệp là rời khỏi bảng — bộ lọc của bảng cũ không được bám lại trên URL, kẻo
          // tệp sau vừa mở đã bị lọc sẵn bởi một lần bấm chip của tệp trước.
          soiLocVaoUrl('tat-ca');
          setNonceDaBo(ketQua.value.nonce);
        }}
      />
    );
  }

  return (
    <PhaNapTep
      formAction={guiTep}
      dangXemTruoc={dangXemTruoc}
      loi={ketQua && !ketQua.ok ? ketQua.error : null}
    />
  );
}
