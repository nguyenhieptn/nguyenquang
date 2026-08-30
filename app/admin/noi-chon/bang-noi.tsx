'use client';

/**
 * BẢNG NƠI CHỐN — mỗi hàng sửa được tại chỗ và gộp được vào nơi khác; khu "Đã gộp" tách lại được
 * (story 6-4, FR-65 *"trùng thì gộp được, gộp nhầm thì tách được"*).
 *
 * ── Hình ─────────────────────────────────────────────────────────────────────────────────
 * Cùng nếp `app/admin/hop-nhat/thao-tac-de-xuat.tsx`: GỘP là nút son duy nhất (nó "chốt"), đứng
 * sau một ô *đã đọc kỹ*; Tách lại và Sửa là nút phụ. Lỗi nằm NGAY DƯỚI hàng (chàm mực), không băng-rôn
 * đầu trang — người vận hành đang nhìn hàng nào thì câu trả lời ở hàng ấy.
 *
 * ── Máy gợi ý trùng tên, không tự gộp ────────────────────────────────────────────────────
 * Cùng tên khác đơn vị cha có thể là hai nơi THẬT (Quang Trung ở Định Hoá và ở Vũng Tàu — chính ví
 * dụ của FR-65). Nên nhóm trùng tên chỉ là một dấu bên cạnh hàng; không nút nào tích sẵn (FR-48).
 *
 * `docs/build-contract.md § Phân tầng`: file này KHÔNG import `@/core/*`; kiểu dữ liệu nhận từ
 * trang qua props, hàm ghi là server action của chính màn.
 */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { gopNoi, suaNoi, tachNoi } from './actions';

export type HangNoi = { placeId: string; name: string; parentUnit: string; nhan: string };
export type HangDaGop = HangNoi & { thang: HangNoi };

/** Dịch mã lỗi của core ra câu cho người vận hành — cùng hình `hop-nhat/loi.ts`. */
function loiRaCau(loi: { code: string; message: string; detail?: Record<string, unknown> }): string {
  switch (loi.code) {
    case 'forbidden':
      return 'Chỉ quản trị và đầu mối chi sửa được danh mục nơi.';
    case 'unattached':
      return 'Tài khoản chưa gắn vào người nào trong phả — gắn xong mới thao tác được.';
    case 'not-found':
      return 'Không thấy nơi này nữa — có thể vừa được người khác gộp. Tải lại trang.';
    default:
      return loi.message;
  }
}

type ThongBao = { loai: 'xong' | 'loi'; cau: string };

function DongThongBao({ tb }: { tb: ThongBao | null }) {
  if (!tb) return null;
  return (
    <p
      aria-live="polite"
      className={
        tb.loai === 'loi'
          ? 'mt-2 max-w-[70ch] border-l-4 border-destructive bg-canh-bao-nen px-3 py-2 text-[17px]'
          : 'mt-2 max-w-[70ch] text-[17px]'
      }
    >
      {tb.cau}
    </p>
  );
}

const O = 'min-h-11 w-full rounded-md border border-ban-vien bg-ban-o px-3 text-[17px]';

function MotNoi({
  noi,
  khac,
  trungTen,
}: {
  noi: HangNoi;
  /** Mọi nơi sống KHÁC — ứng viên nơi thắng. */
  khac: HangNoi[];
  /** Nơi này có tên trùng với nơi khác (khác đơn vị cha) — chỉ là một dấu, không phải một lệnh. */
  trungTen: boolean;
}) {
  const router = useRouter();
  /** `undefined` = đóng; `'sua'` | `'gop'` = bảng đang mở. Hai bảng loại trừ nhau — một hàng một việc. */
  const [bang, setBang] = useState<'sua' | 'gop' | undefined>(undefined);
  const [ten, setTen] = useState(noi.name);
  const [cha, setCha] = useState(noi.parentUnit);
  const [thangId, setThangId] = useState('');
  const [daDocKy, setDaDocKy] = useState(false);
  const [tb, setTb] = useState<ThongBao | null>(null);
  const [dangChay, batDau] = useTransition();

  const dong = () => {
    setBang(undefined);
    setTb(null);
    setDaDocKy(false);
  };

  const ghiLai = () =>
    batDau(async () => {
      let r: Awaited<ReturnType<typeof suaNoi>>;
      try {
        r = await suaNoi(noi.placeId, ten, cha);
      } catch {
        setTb({ loai: 'loi', cau: 'Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.' });
        return;
      }
      if (r.ok) {
        setTb({ loai: 'xong', cau: `Đã ghi lại: ${r.value.nhan}.` });
        setBang(undefined);
        router.refresh();
      } else if (r.error.code === 'conflict' && typeof r.error.detail?.nhan === 'string') {
        // Trùng khít với nơi đã có: không phải lỗi gõ — là hai hàng cho một nơi. Chỉ sang Gộp.
        setTb({ loai: 'loi', cau: `${r.error.message} Dùng "Gộp vào…" ngay dưới hàng này.` });
      } else {
        setTb({ loai: 'loi', cau: loiRaCau(r.error) });
      }
    });

  const gop = () =>
    batDau(async () => {
      let r: Awaited<ReturnType<typeof gopNoi>>;
      try {
        r = await gopNoi(noi.placeId, thangId);
      } catch {
        setTb({ loai: 'loi', cau: 'Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.' });
        return;
      }
      if (r.ok) {
        setTb({
          loai: 'xong',
          cau: `Đã gộp vào ${r.value.nhanThang} — ${r.value.soKhangDinh} khẳng định đang trỏ vào nơi này nay đọc ra nơi ấy. Tách lại được ở khu "Đã gộp".`,
        });
        setBang(undefined);
        router.refresh();
      } else {
        setTb({ loai: 'loi', cau: loiRaCau(r.error) });
      }
    });

  return (
    <li className="rounded-md border border-ban-vien bg-ban-o px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="min-w-0 flex-1 text-[17px]">
          <span>{noi.name}</span>
          {noi.parentUnit ? (
            <span className="text-muted-foreground">, {noi.parentUnit}</span>
          ) : (
            /* Trống là hợp lệ (FR-65) — nhưng nói ra để người vận hành biết chỗ này còn mờ. */
            <span className="ml-2 text-[15px] text-muted-foreground">chưa ghi đơn vị cha</span>
          )}
          {trungTen ? (
            /* Dấu, không phải lệnh: cùng tên khác đơn vị cha có thể là hai nơi thật. */
            <span className="ml-2 border-l-2 border-destructive pl-1.5 text-[15px] text-muted-foreground">
              trùng tên với nơi khác — có thể là hai nơi thật
            </span>
          ) : null}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => (bang === 'sua' ? dong() : (setBang('sua'), setTb(null)))}
            aria-expanded={bang === 'sua'}
            className="h-11 text-[17px]"
          >
            Sửa
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => (bang === 'gop' ? dong() : (setBang('gop'), setTb(null)))}
            aria-expanded={bang === 'gop'}
            disabled={khac.length === 0}
            className="h-11 text-[17px]"
          >
            Gộp vào…
          </Button>
        </div>
      </div>

      {bang === 'sua' ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (ten.trim() && !dangChay) ghiLai();
          }}
          className="mt-3 grid gap-3 border-t border-ban-vien pt-3 md:grid-cols-2"
        >
          <label className="grid gap-1">
            <span className="text-[15px] font-semibold text-muted-foreground">Tên nơi ·</span>
            <input value={ten} onChange={(e) => setTen(e.target.value)} className={O} />
          </label>
          <label className="grid gap-1">
            <span className="text-[15px] font-semibold text-muted-foreground">Thuộc đơn vị nào</span>
            <input
              value={cha}
              onChange={(e) => setCha(e.target.value)}
              placeholder="Định Hoá, Thái Nguyên"
              className={`${O} placeholder:text-muted-foreground`}
            />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" variant="outline" disabled={dangChay || !ten.trim()} className="h-11 text-[17px]">
              {dangChay ? 'Đang ghi…' : 'Ghi lại'}
            </Button>
            <Button type="button" variant="ghost" onClick={dong} className="h-11 text-[17px]">
              Thôi
            </Button>
          </div>
          <p className="max-w-[70ch] text-[15px] text-muted-foreground md:col-span-2">
            Mọi khẳng định đang trỏ vào nơi này hiện tên mới ngay. Tên cũ nằm trong nhật ký.
          </p>
        </form>
      ) : null}

      {bang === 'gop' ? (
        <div className="mt-3 grid gap-3 border-t border-ban-vien pt-3">
          <label className="grid gap-1">
            <span className="text-[15px] font-semibold text-muted-foreground">
              Gộp <strong className="text-foreground">{noi.nhan}</strong> vào nơi nào ·
            </span>
            {/* Luôn bày KÈM đơn vị cha — hai "Quang Trung" trông giống hệt là đúng cái hỏng FR-65
                sinh ra để chặn. */}
            <select value={thangId} onChange={(e) => setThangId(e.target.value)} className={O}>
              <option value="">— chọn nơi thắng —</option>
              {khac.map((k) => (
                <option key={k.placeId} value={k.placeId}>
                  {k.nhan}
                </option>
              ))}
            </select>
          </label>
          <p className="max-w-[70ch] text-[15px] text-muted-foreground">
            Nơi này thành một tên cũ của nơi thắng: mọi khẳng định đang trỏ vào đây đọc ra nơi thắng,
            không ghi mới vào đây được nữa. Gộp nhầm thì tách lại, nguyên trạng trở về.
          </p>
          <label className="flex min-h-11 items-center gap-2 text-[17px]">
            <Checkbox
              checked={daDocKy}
              onCheckedChange={(v) => setDaDocKy(v === true)}
              aria-label="Đã đọc kỹ hai nơi"
            />
            Đã đọc kỹ — đây đúng là một nơi
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={gop}
              disabled={dangChay || !daDocKy || !thangId}
              className="h-11 text-[17px]"
            >
              {dangChay ? 'Đang gộp…' : 'Gộp — mọi khẳng định đọc ra nơi thắng'}
            </Button>
            <Button type="button" variant="ghost" onClick={dong} className="h-11 text-[17px]">
              Thôi
            </Button>
          </div>
        </div>
      ) : null}

      <DongThongBao tb={tb} />
    </li>
  );
}

function MotNoiDaGop({ noi }: { noi: HangDaGop }) {
  const router = useRouter();
  const [tb, setTb] = useState<ThongBao | null>(null);
  const [dangChay, batDau] = useTransition();
  const tach = () =>
    batDau(async () => {
      let r: Awaited<ReturnType<typeof tachNoi>>;
      try {
        r = await tachNoi(noi.placeId);
      } catch {
        setTb({ loai: 'loi', cau: 'Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.' });
        return;
      }
      if (r.ok) {
        setTb({ loai: 'xong', cau: `Đã tách lại: ${r.value.nhan} đứng riêng như trước.` });
        router.refresh();
      } else {
        setTb({ loai: 'loi', cau: loiRaCau(r.error) });
      }
    });
  return (
    <li className="rounded-md border border-dashed border-ban-vien px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="min-w-0 flex-1 text-[17px]">
          <span className="text-muted-foreground line-through">{noi.nhan}</span>
          <span className="mx-2" aria-hidden>
            →
          </span>
          <span className="sr-only">nay đọc ra </span>
          <span>{noi.thang.nhan}</span>
        </p>
        <Button type="button" variant="outline" onClick={tach} disabled={dangChay} className="h-11 shrink-0 text-[17px]">
          {dangChay ? 'Đang tách…' : 'Tách lại'}
        </Button>
      </div>
      <DongThongBao tb={tb} />
    </li>
  );
}

export function BangNoi({
  noi,
  daGop,
  trungTenIds,
}: {
  noi: HangNoi[];
  daGop: HangDaGop[];
  /** Id của mọi nơi có tên trùng với nơi khác (tính ở trang, bằng phép gấp dấu của core). */
  trungTenIds: string[];
}) {
  const trung = new Set(trungTenIds);
  return (
    <>
      {noi.length === 0 ? (
        <p className="mt-6 max-w-[70ch] text-[17px] text-muted-foreground">
          Danh mục còn trống. Đó là một trạng thái đúng, không phải một việc còn thiếu.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {noi.map((n) => (
            <MotNoi
              key={n.placeId}
              noi={n}
              khac={noi.filter((k) => k.placeId !== n.placeId)}
              trungTen={trung.has(n.placeId)}
            />
          ))}
        </ul>
      )}

      {daGop.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[19px] font-semibold">Đã gộp</h2>
          <p className="mt-1 max-w-[70ch] text-[15px] text-muted-foreground">
            Tên cũ vẫn ở lại — mọi khẳng định từng trỏ vào nó nay đọc ra nơi thắng. Tách lại là nguyên
            trạng trở về, không mất gì.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {daGop.map((n) => (
              <MotNoiDaGop key={n.placeId} noi={n} />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
