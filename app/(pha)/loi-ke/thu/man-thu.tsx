'use client';

/**
 * MÀN THU LỜI KỂ — promote từ prototype uiworkshop/thu-loi-ke (FR-47, FR-49).
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Interaction Primitives — "một nút to, một trạng thái đang ghi, một nút
 *     dừng. Không dạng sóng, không cắt ghép — thu là việc bây giờ, bóc tách là việc sau"
 *   · EXPERIENCE.md § IA — "Đồng thuận nằm TRONG luồng thu, không phải màn riêng" (FR-49)
 *   · DESIGN.md § Nút (chính = son; phụ = viền, nền trong suốt) · § Elevation (không bóng)
 *
 * ── VÌ SAO MÀN NÀY KHÔNG ĐƯỢC PHỨC TẠP (giữ từ prototype) ──────────────────────────────────
 * Người cầm điện thoại ở đây thường là con cháu, nhưng người đang nói là cụ 84 tuổi ngồi đối
 * diện — và cụ sẽ ngừng kể ngay khi thấy người kia loay hoay với máy. Mỗi nút thêm vào màn này
 * là một lần ngắt mạch câu chuyện. Đó là lý do § Interaction Primitives cấm dạng sóng và cắt
 * ghép: không phải vì khó làm, mà vì chúng mời người ta nghịch máy giữa lúc phải nghe.
 *
 * ── VÌ SAO ĐỒNG THUẬN NẰM TRONG LUỒNG, KHÔNG PHẢI MÀN RIÊNG ─────────────────────────────────
 * FR-49 chỉ có nghĩa nếu người kể ĐANG CÒN NGỒI ĐÓ khi câu hỏi được hỏi. Tách ra thành một màn
 * cài đặt là hỏi sau khi cụ đã về — và lúc ấy người trả lời là con cháu, không phải người có
 * quyền trả lời. Nên câu hỏi đồng thuận đứng ngay sau nút dừng, trước khi bản thu được lưu.
 *
 * ── DỮ LIỆU KHÔNG TÁI TẠO ĐƯỢC ──────────────────────────────────────────────────────────────
 * Bản thu giữ trong bộ nhớ trình duyệt cho tới khi máy chủ xác nhận đã nhận (201). Gửi trượt —
 * mạng rơi, phiên hết, chưa gắn node — thì blob KHÔNG bị bỏ: màn bày lý do và một nút gửi lại.
 * Kỹ thuật thu: MediaRecorder audio/webm, rơi về audio/mp4 cho Safari (feature-detect bằng
 * MediaRecorder.isTypeSupported), đúng danh sách RECORDING_MIMES core nhận.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Mic, Square } from 'lucide-react';
import type { CoreErrorCode } from '@/core/types';
import { doDai, homNayISO, mmss } from '../dinh-dang';
import { ChonNguoi, type NguoiDaChon } from './chon-nguoi';

type Buoc = 'san-sang' | 'dang-thu' | 'xem-lai' | 'dang-gui' | 'da-luu';

type BanThu = { blob: Blob; mime: string; giay: number };

type LoiGui =
  | { loai: 'mang' } // fetch ném lỗi — mạng rơi giữa chừng
  | { loai: 'core'; code: CoreErrorCode; message: string };

type MucTiepCan = 'public' | 'admin' | 'sealed';

/** YYYY-MM-DD của ngày mai — niêm phong tới hôm nay là đã mở, chọn thế là vô nghĩa. */
function ngayMaiISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const thang = String(d.getMonth() + 1).padStart(2, '0');
  const ngay = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${thang}-${ngay}`;
}

/** Ba lựa chọn đồng thuận (FR-49) — lời giải thích ấm, người kể tự chọn. */
const LUA_CHON_TIEP_CAN: { muc: MucTiepCan; ten: string; giaiThich: string }[] = [
  {
    muc: 'public',
    ten: 'Cả họ cùng nghe',
    giaiThich: 'hiện trong sổ lời kể chung, ai trong họ cũng mở nghe được',
  },
  {
    muc: 'admin',
    ten: 'Chỉ người trông coi phả',
    giaiThich: 'dùng để đối chiếu khi ghi phả, không mở cho cả họ',
  },
  {
    muc: 'sealed',
    ten: 'Niêm phong tới ngày…',
    giaiThich: 'chọn một ngày mở — trước ngày ấy không ai mở sớm được, kể cả người trông coi phả',
  },
];

export function ManThu({
  /** "Nói về những ai" chọn sẵn — từ ?ve= của trang một người, server đã tra tên. */
  noiVeSan = [],
}: {
  noiVeSan?: NguoiDaChon[];
}) {
  const [buoc, setBuoc] = useState<Buoc>('san-sang');
  const [giay, setGiay] = useState(0);
  const [banThu, setBanThu] = useState<BanThu | null>(null);
  const [urlNgheLai, setUrlNgheLai] = useState<string | null>(null);
  const [loiMic, setLoiMic] = useState<string | null>(null);
  const [loiGui, setLoiGui] = useState<LoiGui | null>(null);

  // ── Thông tin đi kèm bản thu ────────────────────────────────────────────────
  const [nguoiKe, setNguoiKe] = useState<NguoiDaChon[]>([]); // chọn một
  const [tenNguoiKeNgoai, setTenNguoiKeNgoai] = useState(''); // người kể chưa có trong phả
  const [noiVe, setNoiVe] = useState<NguoiDaChon[]>(noiVeSan); // chọn nhiều
  const [tieuDe, setTieuDe] = useState('');
  const [ngayThu, setNgayThu] = useState(homNayISO());
  const [tiepCan, setTiepCan] = useState<MucTiepCan | null>(null); // KHÔNG chọn sẵn — FR-49
  const [ngayMoNiemPhong, setNgayMoNiemPhong] = useState('');

  const mayThuRef = useRef<MediaRecorder | null>(null);
  const manhRef = useRef<Blob[]>([]);
  const dongHoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const giayRef = useRef(0);

  // Dọn khi rời màn: tắt micro, dừng đồng hồ, thả URL nghe lại.
  useEffect(() => {
    return () => {
      if (dongHoRef.current) clearInterval(dongHoRef.current);
      const may = mayThuRef.current;
      if (may && may.state !== 'inactive') may.stop();
      may?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(() => {
    return () => {
      if (urlNgheLai) URL.revokeObjectURL(urlNgheLai);
    };
  }, [urlNgheLai]);

  // ── Thu ─────────────────────────────────────────────────────────────────────

  const batDauThu = async () => {
    setLoiMic(null);
    if (typeof MediaRecorder === 'undefined') {
      setLoiMic('Trình duyệt này chưa thu tiếng được. Mở bằng trình duyệt khác trên máy rồi thử lại.');
      return;
    }
    let luong: MediaStream;
    try {
      luong = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setLoiMic('Chưa mở được micro. Cho phép trang này dùng micro trong trình duyệt rồi bấm thu lần nữa.');
      return;
    }
    // audio/webm (Opus) là chuẩn chung; Safari không nhận thì rơi về audio/mp4 — đúng hai định
    // dạng đầu trong RECORDING_MIMES của core/media.
    const kieu = (['audio/webm', 'audio/mp4'] as const).find((k) =>
      MediaRecorder.isTypeSupported?.(k),
    );
    const may = kieu ? new MediaRecorder(luong, { mimeType: kieu }) : new MediaRecorder(luong);
    manhRef.current = [];
    may.ondataavailable = (e) => {
      if (e.data.size > 0) manhRef.current.push(e.data);
    };
    may.onstop = () => {
      luong.getTracks().forEach((t) => t.stop());
      if (dongHoRef.current) clearInterval(dongHoRef.current);
      // mimeType thật của máy thu có thể kèm ";codecs=opus" — core nhận đúng phần gốc.
      const mime = (may.mimeType || kieu || 'audio/webm').split(';')[0];
      const blob = new Blob(manhRef.current, { type: mime });
      setBanThu({ blob, mime, giay: giayRef.current });
      setUrlNgheLai(URL.createObjectURL(blob));
      setBuoc('xem-lai');
    };
    mayThuRef.current = may;
    giayRef.current = 0;
    setGiay(0);
    // Cắt mảnh mỗi giây: dừng lúc nào cũng không mất phần đã nói.
    may.start(1000);
    dongHoRef.current = setInterval(() => {
      giayRef.current += 1;
      setGiay(giayRef.current);
    }, 1000);
    setBuoc('dang-thu');
  };

  const dungThu = () => {
    const may = mayThuRef.current;
    if (may && may.state !== 'inactive') may.stop(); // onstop lo phần còn lại
  };

  const thuLaiTuDau = () => {
    // Bản thu là thứ không tái tạo được — hỏi lại bằng lời trước khi bỏ.
    if (!window.confirm('Bỏ bản vừa thu và thu lại từ đầu? Bản này sẽ mất hẳn.')) return;
    if (urlNgheLai) URL.revokeObjectURL(urlNgheLai);
    setBanThu(null);
    setUrlNgheLai(null);
    setLoiGui(null);
    setBuoc('san-sang');
  };

  // ── Gửi vào phả ─────────────────────────────────────────────────────────────

  const duLieuHopLe =
    tiepCan !== null && (tiepCan !== 'sealed' || ngayMoNiemPhong !== '') && ngayThu !== '';

  const guiVaoPha = async () => {
    if (!banThu || !duLieuHopLe || tiepCan === null) return;
    setLoiGui(null);
    setBuoc('dang-gui');

    // TODO(core): chưa có chỗ riêng cho TÊN người kể ngoài phả (SaveRecordingInput chỉ có
    // toldByPersonId). Tạm gửi tên ấy trong tiêu đề để không mất thông tin — khi core thêm
    // trường toldByName thì tách ra.
    const tenNgoai = nguoiKe.length === 0 ? tenNguoiKeNgoai.trim() : '';
    const tieuDeGui = tenNgoai
      ? tieuDe.trim()
        ? `${tenNgoai} kể — ${tieuDe.trim()}`
        : `${tenNgoai} kể`
      : tieuDe.trim();

    const duoi = banThu.mime.split('/')[1] ?? 'webm';
    const fd = new FormData();
    fd.append('file', banThu.blob, `loi-ke.${duoi}`);
    fd.append('mime', banThu.mime);
    fd.append('title', tieuDeGui);
    if (nguoiKe[0]) fd.append('toldByPersonId', nguoiKe[0].personId);
    for (const n of noiVe) fd.append('subjectPersonIds', n.personId);
    fd.append('recordedOn', ngayThu);
    if (banThu.giay > 0) fd.append('durationSeconds', String(banThu.giay));
    fd.append('accessTier', tiepCan);
    if (tiepCan === 'sealed') fd.append('sealedUntil', ngayMoNiemPhong);

    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd });
      const kq = (await res.json()) as
        | { ok: true; value: { recordingId: string } }
        | { ok: false; error: { code: CoreErrorCode; message: string } };
      if (kq.ok) {
        setBuoc('da-luu');
        return;
      }
      setLoiGui({ loai: 'core', code: kq.error.code, message: kq.error.message });
      setBuoc('xem-lai');
    } catch {
      // Mạng rơi — blob vẫn trong bộ nhớ, chỉ cần bấm gửi lại.
      setLoiGui({ loai: 'mang' });
      setBuoc('xem-lai');
    }
  };

  // ── Bốn màn của một luồng ──────────────────────────────────────────────────

  if (buoc === 'san-sang') {
    return (
      <section>
        <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Thu lời kể</h1>
        <p className="mt-2 text-[17px]">
          Cứ để các cụ kể tự nhiên. Không cần đúng thứ tự, không cần đầy đủ — nghe được câu nào
          là dòng họ giữ được câu ấy.
        </p>

        {/* Nút to hơn mọi nút khác trong sản phẩm. Vùng chạm 44px là sàn; ở đây người bấm thường
            đang vừa cầm máy vừa nhìn người đối diện, nên nút phải bấm trúng mà không cần nhìn. */}
        <button
          type="button"
          onClick={batDauThu}
          className="mt-7 flex min-h-24 w-full items-center justify-center gap-3 rounded-lg bg-primary px-6 text-primary-foreground"
        >
          <Mic size={28} strokeWidth={2} aria-hidden />
          <span className="text-[19px] font-semibold">Bắt đầu thu</span>
        </button>

        {loiMic && (
          <p className="mt-4 border-l-4 border-destructive bg-canh-bao-nen p-3.5 text-[17px]">
            {loiMic}
          </p>
        )}

        <p className="mt-4 text-[17px] text-muted-foreground">
          Thu xong sẽ hỏi một câu: ai được nghe bản này. Người kể tự chọn.
        </p>
      </section>
    );
  }

  if (buoc === 'dang-thu') {
    return (
      <section>
        {/* ĐANG GHI — đúng ba thứ: biết là đang ghi, biết đã bao lâu, dừng được.
            Đồng hồ chạy là thứ duy nhất động trên màn. Không dạng sóng: dạng sóng đẹp nhưng nó
            kéo mắt người cầm máy xuống màn hình đúng lúc phải nhìn người đang kể. */}
        <div className="flex items-center gap-2.5">
          <span className="size-3 animate-pulse rounded-full bg-primary" aria-hidden />
          {/* Trạng thái không bao giờ mã hoá chỉ bằng màu — chấm son đi kèm chữ. */}
          <p className="text-[17px] font-semibold" role="status">
            Đang thu
          </p>
        </div>

        <p className="mt-6 font-mono text-[44px] tabular-nums leading-none">{mmss(giay)}</p>
        <p className="mt-2 text-[17px] text-muted-foreground">Micro đang mở — cứ để câu chuyện chạy.</p>

        <button
          type="button"
          onClick={dungThu}
          className="mt-7 flex min-h-24 w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-6"
        >
          <Square size={26} strokeWidth={2} aria-hidden />
          <span className="text-[19px] font-semibold">Dừng và lưu</span>
        </button>

        <p className="mt-4 text-[17px] text-muted-foreground">
          Dừng giữa chừng không mất gì. Kể tiếp thì thu thêm bản nữa.
        </p>
      </section>
    );
  }

  if (buoc === 'da-luu') {
    return (
      <section>
        <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Đã lưu vào phả</h1>
        <p className="mt-2 text-[17px]">
          Bản thu {banThu ? doDai(banThu.giay) : ''} đã nằm trong sổ lời kể của dòng họ, đúng theo
          mức người kể đã chọn. Đổi ý lúc nào cũng được, kể cả về sau.
        </p>
        <Link
          href="/loi-ke"
          className="mt-7 flex min-h-14 w-full items-center justify-center rounded-md bg-primary px-6 text-[17px] font-semibold text-primary-foreground"
        >
          Mở sổ lời kể
        </Link>
        <button
          type="button"
          onClick={() => {
            if (urlNgheLai) URL.revokeObjectURL(urlNgheLai);
            setBanThu(null);
            setUrlNgheLai(null);
            setNguoiKe([]);
            setTenNguoiKeNgoai('');
            setNoiVe([]);
            setTieuDe('');
            setNgayThu(homNayISO());
            setTiepCan(null);
            setNgayMoNiemPhong('');
            setBuoc('san-sang');
          }}
          className="mt-3 flex min-h-14 w-full items-center justify-center rounded-md border border-border bg-transparent px-6 text-[17px] font-semibold"
        >
          Thu bản mới
        </button>
      </section>
    );
  }

  // 'xem-lai' và 'dang-gui' chung một màn — lúc gửi chỉ khoá nút và bày dòng "đang gửi…".
  const dangGui = buoc === 'dang-gui';
  return (
    <section aria-busy={dangGui}>
      <p className="text-[15px] uppercase tracking-wider text-muted-foreground">
        Đã thu {banThu ? doDai(banThu.giay) : ''}
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-pha)] text-[23px]">Nghe lại và ghi vào sổ</h1>

      {urlNgheLai && <audio controls src={urlNgheLai} className="mt-4 w-full" preload="metadata" />}

      <div className="mt-7 grid gap-6">
        <div>
          <ChonNguoi
            nhan="Ai kể?"
            goiY="Tìm người kể trong phả — kết quả kèm đời và chi để khỏi nhầm người trùng tên."
            chonMot
            daChon={nguoiKe}
            onDoi={setNguoiKe}
          />
          {nguoiKe.length === 0 && (
            <div className="mt-2.5">
              <label htmlFor="ten-nguoi-ke-ngoai" className="block text-[15px] text-muted-foreground">
                Người kể chưa có trong phả? Ghi tên vào đây là đủ.
              </label>
              <input
                id="ten-nguoi-ke-ngoai"
                type="text"
                value={tenNguoiKeNgoai}
                onChange={(e) => setTenNguoiKeNgoai(e.target.value)}
                placeholder="Tên người kể"
                autoComplete="off"
                className="mt-1.5 h-12 w-full rounded-md border border-input bg-card px-3.5 text-[17px]"
              />
            </div>
          )}
        </div>

        <ChonNguoi
          nhan="Nói về những ai?"
          goiY="Chọn những người được nhắc tới — lời kể sẽ hiện trên trang của họ."
          daChon={noiVe}
          onDoi={setNoiVe}
        />

        <div>
          <label htmlFor="tieu-de" className="block text-[17px] font-semibold">
            Chuyện kể về điều gì?
          </label>
          <p className="mt-0.5 text-[15px] text-muted-foreground">
            Một dòng ngắn để sau này tìm lại — bỏ trống cũng được.
          </p>
          <input
            id="tieu-de"
            type="text"
            value={tieuDe}
            onChange={(e) => setTieuDe(e.target.value)}
            placeholder="Hồi đói Ất Dậu, chuyện ông nội đi phu…"
            autoComplete="off"
            className="mt-2.5 h-12 w-full rounded-md border border-input bg-card px-3.5 text-[17px]"
          />
        </div>

        <div>
          <label htmlFor="ngay-thu" className="block text-[17px] font-semibold">
            Thu ngày
          </label>
          <input
            id="ngay-thu"
            type="date"
            value={ngayThu}
            max={homNayISO()}
            onChange={(e) => setNgayThu(e.target.value)}
            className="mt-2.5 h-12 w-full rounded-md border border-input bg-card px-3.5 text-[17px]"
          />
        </div>

        {/* ── ĐỒNG THUẬN (FR-49) — trong luồng, hỏi khi người kể còn ngồi đó ──────────
            KHÔNG cái nào được chọn sẵn. Chọn sẵn "cả họ nghe được" là quyết hộ người vừa kể một
            chuyện có thể chưa từng kể cho ai; chọn sẵn "niêm phong" là chôn một chuyện lẽ ra dòng
            họ nên biết. Cả hai đều là quyết định của người kể, và đây là lần họ được hỏi. */}
        <fieldset>
          <legend className="font-[family-name:var(--font-pha)] text-[21px]">
            Ai được nghe lời kể này?
          </legend>
          <p className="mt-1 text-[17px]">Hỏi người vừa kể, không tự quyết.</p>
          <div className="mt-4 grid gap-2.5">
            {LUA_CHON_TIEP_CAN.map((lc) => (
              <label
                key={lc.muc}
                className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-md border bg-card px-4 py-3.5 ${
                  tiepCan === lc.muc ? 'border-foreground' : 'border-input'
                }`}
              >
                <input
                  type="radio"
                  name="tiep-can"
                  value={lc.muc}
                  checked={tiepCan === lc.muc}
                  onChange={() => setTiepCan(lc.muc)}
                  className="mt-1 size-5 shrink-0 accent-foreground"
                />
                <span>
                  <span className="block text-[17px] font-semibold">{lc.ten}</span>
                  <span className="block text-[15px] text-muted-foreground">{lc.giaiThich}</span>
                </span>
              </label>
            ))}
          </div>
          {tiepCan === 'sealed' && (
            <div className="mt-3">
              <label htmlFor="ngay-mo" className="block text-[17px] font-semibold">
                Mở vào ngày
              </label>
              <input
                id="ngay-mo"
                type="date"
                value={ngayMoNiemPhong}
                min={ngayMaiISO()}
                onChange={(e) => setNgayMoNiemPhong(e.target.value)}
                className="mt-2.5 h-12 w-full rounded-md border border-input bg-card px-3.5 text-[17px]"
              />
            </div>
          )}
          <p className="mt-4 text-[17px] text-muted-foreground">
            Đổi ý lúc nào cũng được, kể cả về sau.
          </p>
        </fieldset>
      </div>

      {/* ── Gửi trượt: bản thu KHÔNG mất — nói rõ vì sao và mở đường gửi lại ───────── */}
      {loiGui && (
        <div className="mt-6 border-l-4 border-destructive bg-canh-bao-nen p-4">
          {loiGui.loai === 'mang' && (
            <p className="text-[17px]">
              Mạng đang chập chờn nên bản thu chưa tới nơi. Bản thu vẫn nằm trên máy này — đợi
              mạng ổn rồi bấm gửi lại là được.
            </p>
          )}
          {loiGui.loai === 'core' && loiGui.code === 'unauthenticated' && (
            <p className="text-[17px]">
              Phiên đã hết trong lúc thu. Bản thu vẫn nằm trên máy này — mở{' '}
              <Link href="/dang-nhap" target="_blank" className="underline underline-offset-4">
                trang đăng nhập ở thẻ mới
              </Link>
              , đăng nhập xong quay lại đây bấm gửi lại.
            </p>
          )}
          {loiGui.loai === 'core' && loiGui.code === 'unattached' && (
            // Chưa gắn node → dẫn về luồng gắn node, không phải màn lỗi (EXPERIENCE § State).
            <p className="text-[17px]">
              Tài khoản chưa nối vào người nào trong phả nên chưa ghi vào sổ được. Bản thu vẫn
              nằm trên máy này — mở{' '}
              <Link href="/gan-node" target="_blank" className="underline underline-offset-4">
                bước gắn mình vào phả ở thẻ mới
              </Link>
              , xong quay lại đây bấm gửi lại.
            </p>
          )}
          {loiGui.loai === 'core' &&
            loiGui.code !== 'unauthenticated' &&
            loiGui.code !== 'unattached' && <p className="text-[17px]">{loiGui.message}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={guiVaoPha}
        disabled={dangGui || !duLieuHopLe}
        className="mt-6 flex min-h-14 w-full items-center justify-center rounded-md bg-primary px-6 text-[17px] font-semibold text-primary-foreground disabled:opacity-50"
      >
        {dangGui ? 'Đang gửi vào phả…' : 'Lưu vào phả'}
      </button>
      {!duLieuHopLe && !dangGui && (
        <p className="mt-2 text-[15px] text-muted-foreground">
          {tiepCan === null
            ? 'Chọn ai được nghe rồi mới lưu được — người kể chọn, không ai chọn hộ.'
            : 'Niêm phong cần một ngày mở — chọn ngày rồi lưu.'}
        </p>
      )}

      <button
        type="button"
        onClick={thuLaiTuDau}
        disabled={dangGui}
        className="mt-3 flex min-h-14 w-full items-center justify-center rounded-md border border-border bg-transparent px-6 text-[17px] disabled:opacity-50"
      >
        Bỏ bản này, thu lại từ đầu
      </button>
    </section>
  );
}
