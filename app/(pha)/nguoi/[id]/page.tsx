/**
 * TRANG MỘT NGƯỜI (story 2-7 — FR-1, FR-2, FR-37, FR-39) — đích của mọi lần chạm vào một
 * node trên cây. Promote từ prototype `uiworkshop/trang-nguoi` (commit 8fd4af1^), thay mock
 * bằng core thật; JSX/bố cục/khẩu khí giữ nguyên chỗ nào còn đúng.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Component Patterns — Chip mức tin cậy ("chạm → panel giải nghĩa"; panel là
 *     chỗ DUY NHẤT FR-1 lộ ra với người thường — không nhét nguồn vào node)
 *   · EXPERIENCE.md § Accessibility Floor — bán kính riêng tư là chuyện DỮ LIỆU, không phải CSS:
 *     cái ngoài bán kính KHÔNG rời server (core đã lọc), nên trang ngoài bán kính chỉ đơn
 *     giản là NGẮN — không ô xám, không ổ khoá, không "3 mục bị ẩn".
 *   · DESIGN.md § Ba mức tin cậy không mã hoá chỉ bằng màu · § Components (dòng ghi công bắt buộc)
 *
 * ── MỨC TIN CẬY GẮN VÀO KHẲNG ĐỊNH, KHÔNG GẮN VÀO NGƯỜI ─────────────────────────────────────
 * Ràng buộc dễ vẽ sai nhất của màn: không có huy hiệu "TỒN NGHI" nào trên đầu trang — mức nằm
 * cạnh TỪNG dòng khẳng định, và mỗi dòng mang nguồn của chính nó (core/person.getPerson).
 *
 * ── BA MỨC NHÌN CỦA CORE (AD-13/AD-21) — trang chỉ BÀY, không tự che ────────────────────────
 *   · 'full'      — thẻ + quan hệ + danh sách khẳng định kèm nguồn (FR-1 trọn vẹn).
 *   · 'limited'   — ngoài bán kính: thẻ + quan hệ, mục khẳng định VẮNG LẶNG (không rời server).
 *   · 'anonymous' — người được giữ kín (FR-55) / vị thành niên: trang giữ chỗ trung tính,
 *     KHÔNG 404 — "được ẩn, không được xóa", liên kết phả hệ giữ nguyên.
 * Id đã gộp (AD-3): core trả người thắng kèm `redirectedFrom` — trang đưa URL về id chính thống.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';
import { coBanLamViec } from '@/lib/vai-quan-tri';
import type { PersonCard } from '@/core/tree';
import { getPerson, type PersonAssertion } from '@/core/person';
import { getPersonHistory } from '@/core/audit';
import { listRecordings, type RecordingMeta } from '@/core/media';
import { ChipGiaiNghia } from './chip-tin-cay';

// ── Định dạng ────────────────────────────────────────────────────────────────

/** ISO → "hôm nay" / "hôm qua" / "12/8/2026". Ngày là lời nói, không phải timestamp. */
function ngayHienThi(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dau = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const lech = Math.round((dau(new Date()) - dau(d)) / 86_400_000);
  if (lech <= 0) return 'hôm nay';
  if (lech === 1) return 'hôm qua';
  return d.toLocaleDateString('vi-VN');
}

function doDai(giay: number | null): string | null {
  if (giay === null || !Number.isFinite(giay)) return null;
  const phut = Math.round(giay / 60);
  if (phut < 1) return 'chưa đầy một phút';
  if (phut < 60) return `${phut} phút`;
  return `${Math.floor(phut / 60)} giờ ${phut % 60} phút`;
}

/** "đời 6 · chi 2.1 · 1941–2019" — chỉ ghép phần nào thật sự có. */
function dongMeta(the: PersonCard): string {
  return [
    the.generation !== null ? `đời ${the.generation}` : null,
    the.branchCode ? `chi ${the.branchCode}` : null,
    the.lifespan || null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Câu "dựa vào đâu" của MỘT khẳng định (FR-1) — từ source thật của core/person. Chữ bề mặt A:
 * không từ kỹ thuật, không xưng hô; nguồn nào thiếu mô tả thì nói ngắn, không bịa thêm.
 */
function cauNguon(a: PersonAssertion): string {
  const moTa = a.sourceDescription.trim();
  switch (a.sourceKind) {
    case 'self':
      return 'tự khai về mình';
    case 'told-by': {
      const goc = a.toldByName ? `theo lời ${a.toldByName} kể` : 'theo lời kể trong họ';
      return moTa ? `${goc} — ${moTa}` : goc;
    }
    case 'document':
      return moTa ? `đối chiếu giấy tờ: ${moTa}` : 'đối chiếu được giấy tờ';
    case 'recording':
      return 'từ một bản thu trong sổ lời kể';
    case 'seed-import':
      return moTa ? `chép từ bản phả trước: ${moTa}` : 'chép từ bản phả trước';
  }
}

function TieuDeMuc({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-7 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

// ── Quan hệ ──────────────────────────────────────────────────────────────────

/** Mỗi ô quan hệ là một đường sang trang người khác — đúng cách người ta thật sự đi trên phả. */
function OQuanHe({ nguoi }: { nguoi: PersonCard }) {
  const phai = nguoi.generation !== null ? `đời ${nguoi.generation}` : nguoi.lifespan;
  return (
    <Link
      href={`/nguoi/${nguoi.personId}`}
      className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="font-[family-name:var(--font-pha)] text-[17px]">{nguoi.fullName}</span>
      {phai && <span className="shrink-0 text-[15px] text-muted-foreground">{phai}</span>}
    </Link>
  );
}

function NhomQuanHe({ tua, cac }: { tua: string; cac: PersonCard[] }) {
  if (cac.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[15px] text-muted-foreground">{tua}</p>
      <div className="grid gap-2.5">
        {cac.map((n) => (
          <OQuanHe key={n.personId} nguoi={n} />
        ))}
      </div>
    </div>
  );
}

// ── Lời kể (FR-47/FR-49) ─────────────────────────────────────────────────────

const NHAN_TIEP_CAN: Record<RecordingMeta['accessTier'], string> = {
  public: 'Cả họ nghe được',
  admin: 'Chỉ ban tu phả nghe được',
  sealed: 'Niêm phong — không ai mở sớm được, kể cả ban tu phả',
};

// ── Trang ────────────────────────────────────────────────────────────────────

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Ba nguồn chạy song song; mỗi Result tự nói được phần của nó vắng hay có.
  const [hoSo, lichSu, loiKe] = await Promise.all([
    getPerson(id),
    getPersonHistory(id),
    listRecordings(), // khách chưa đăng nhập → err, mục lời kể vắng lặng
  ]);

  if (!hoSo.ok) {
    // 'unauthenticated' ở đây = chưa có phả nào để xem (chưa bootstrap) — mời đăng nhập.
    if (hoSo.error.code === 'unauthenticated') redirect('/dang-nhap');
    notFound();
  }
  // Id đã gộp (AD-3): core đã trả người thắng — đưa URL về id chính thống rồi render một lần.
  if (hoSo.value.redirectedFrom) redirect(`/nguoi/${hoSo.value.card.personId}`);

  const { card: the, relations: quanHe, visibility: mucNhin, assertions: khangDinh } = hoSo.value;
  const anDanh = mucNhin === 'anonymous';
  // NGOÀI BÁN KÍNH RIÊNG TƯ (FR-37) — trang MỎNG, không phải trang bị che: core nói thẳng
  // mức nhìn, và cái bị giữ lại không rời server.
  const ngoaiBanKinh = mucNhin === 'limited';
  // Gốc tạm (FR-63): đời 1 của mảnh và không còn đời trên. Người kết hôn vào họ không mang
  // số đời nên không bị nhận nhầm là gốc.
  const laGocTam = !anDanh && the.generation === 1 && quanHe.parents.length === 0;

  const coQuanHe =
    quanHe.parents.length + quanHe.partners.length + quanHe.children.length > 0;

  // Lời kể có nhắc tới người này. Bản đã rút lại (FR-49) không bày — rút là rút hẳn.
  // Trang ẩn danh cũng không bày: tựa đề lời kể có thể gọi thẳng tên đang được giữ kín.
  const loiKeVe =
    !anDanh && loiKe.ok
      ? loiKe.value.filter(
          (l) =>
            !l.withdrawn &&
            (l.subjectPersonIds.includes(the.personId) || l.toldByPersonId === the.personId),
        )
      : [];

  const meta = dongMeta(the);

  /* Khối Quan hệ dùng chung cho trang đầy đủ VÀ trang mỏng ngoài bán kính — mỗi ô là một
     đường sang trang người khác, đúng cách người ta thật sự đi trên phả. Người kết hôn vào họ
     giờ cũng có mặt: core/person trả cả vợ/chồng (partners), không chỉ nhánh huyết thống. */
  const khoiQuanHe = (
    <>
      <TieuDeMuc>Quan hệ</TieuDeMuc>
      {coQuanHe ? (
        <div className="grid gap-4">
          <NhomQuanHe tua="Cha mẹ" cac={quanHe.parents} />
          <NhomQuanHe tua="Vợ chồng" cac={quanHe.partners} />
          <NhomQuanHe tua="Con" cac={quanHe.children} />
        </div>
      ) : (
        <p className="text-[17px] text-muted-foreground">
          Chưa nối được với ai. Ai biết thì nối giúp — đây là việc quý nhất mà ai cũng làm
          được.
        </p>
      )}
    </>
  );

  return (
    <>
      <main className={`${DOC} pb-28 pt-7 md:pb-16 md:pt-28`}>
        <article>
          {/* ══ ĐẦU TRANG ═══════════════════════════════════════════════ */}
          <header>
            <h1 className="font-[family-name:var(--font-pha)] text-[27px] leading-tight">
              {the.fullName}
            </h1>
            {meta && <p className="mt-1 text-[17px] text-muted-foreground">{meta}</p>}

            {/* Dòng ghi công là BẮT BUỘC, không phải trang trí (DESIGN.md § Components):
                tên người đóng góp nằm TRÊN PHẢ, không chỉ trong nhật ký. */}
            {the.attribution && (
              <p className="mt-2 text-[15px] italic text-primary">
                {the.attribution.byName} ghi · {ngayHienThi(the.attribution.at)}
              </p>
            )}

            {/* FR-63: gốc tạm phải tự nói mình là gốc TẠM. Không có câu này thì "cụ xa nhất
                hiện biết" bị đọc thành "Thuỷ tổ" — một khẳng định chưa ai đưa ra. */}
            {laGocTam && (
              <p className="mt-3 text-[17px]">
                Cụ xa nhất dòng họ hiện biết. Chưa phải khẳng định đây là Thuỷ tổ — tìm được
                đời trên thì cụ dịch lên, và mọi số đời tự tính lại.
              </p>
            )}
          </header>

          {anDanh ? (
            /* ── NGƯỜI ĐƯỢC GIỮ KÍN — trang giữ chỗ trung tính, KHÔNG 404 ─────────────
               Cái được phép nói là LUẬT, vì luật áp cho tất cả và không tiết lộ gì về riêng
               người này. Liên kết phả hệ giữ nguyên — "được ẩn, không được xóa". */
            <p className="mt-5 text-[17px] text-muted-foreground">
              Tên người này không bày ra ở đây — người còn sống được giữ kín với người ngoài
              vòng ruột thịt. Chỗ đứng trong phả vẫn giữ nguyên, nhánh trên dưới vẫn liền.
            </p>
          ) : ngoaiBanKinh ? (
            /* ── NGOÀI BÁN KÍNH (FR-37) — trang MỎNG ──────────────────────────────────
               Không một ô xám nào, không "3 mục bị ẩn", không ổ khoá: cái ngoài bán kính
               không được gửi tới client, nên trang chỉ đơn giản là NGẮN. Mục khẳng định
               VẮNG LẶNG — không phải ô bị che. Cái được phép nói là LUẬT — luật áp cho tất
               cả và không tiết lộ gì về riêng người này; im lặng ở đây bị đọc thành "chắc
               là hỏng". */
            <>
              {khoiQuanHe}
              <p className="mt-7 text-[17px] text-muted-foreground">
                Người còn sống chỉ hiện tên, chỗ trên phả và năm sinh với người ngoài vòng
                ruột thịt. Phần còn lại chỉ người gần trong họ thấy — và thứ không hiện thì
                không rời khỏi phả.
              </p>
            </>
          ) : (
            <>
              {/* ══ PHẢ GHI GÌ, DỰA VÀO ĐÂU (FR-1, FR-2) ═══════════════════
                  Mức tin cậy nằm cạnh TỪNG dòng khẳng định — core/person trả trọn danh sách
                  đang sống, mỗi dòng kèm nguồn thật ("mức này là gì · ai khai · dựa vào đâu").
                  Tồn nghi = nét đứt + vân chéo, KHÔNG opacity. */}
              <TieuDeMuc>Phả ghi gì, dựa vào đâu</TieuDeMuc>
              {khangDinh && khangDinh.length > 0 ? (
                <ul className="grid gap-2.5">
                  {khangDinh.map((a) => (
                    <li
                      key={a.assertionId}
                      className={
                        a.confidence === 'ton-nghi'
                          ? 'van-ton-nghi rounded-md border border-dashed bg-card px-4 py-3.5'
                          : 'rounded-md border border-border bg-card px-4 py-3.5'
                      }
                      style={
                        a.confidence === 'ton-nghi'
                          ? { borderColor: 'var(--color-tin-ton-nghi)' }
                          : undefined
                      }
                    >
                      <p className="text-[17px]">{a.valueText}</p>
                      <div className="mt-1">
                        <ChipGiaiNghia
                          muc={a.confidence}
                          tang={a.tier}
                          nguoiKhai={a.createdByName}
                          luc={ngayHienThi(a.createdAt)}
                          nguon={cauNguon(a)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                /* Không còn khẳng định sống nào (hiếm — dữ liệu dựng tay): rơi về một dòng
                   tên từ giá trị chiếu, vẫn kèm chip — không bao giờ một mục trống trơn. */
                <div
                  className={
                    the.confidence === 'ton-nghi'
                      ? 'van-ton-nghi rounded-md border border-dashed bg-card px-4 py-3.5'
                      : 'rounded-md border border-border bg-card px-4 py-3.5'
                  }
                  style={
                    the.confidence === 'ton-nghi'
                      ? { borderColor: 'var(--color-tin-ton-nghi)' }
                      : undefined
                  }
                >
                  <p className="text-[17px]">
                    Tên ghi trong phả:{' '}
                    <span className="font-[family-name:var(--font-pha)] font-semibold">
                      {the.fullName}
                    </span>
                  </p>
                  <div className="mt-1">
                    <ChipGiaiNghia
                      muc={the.confidence}
                      tang={the.tier}
                      nguoiKhai={the.attribution?.byName ?? null}
                      luc={the.attribution ? ngayHienThi(the.attribution.at) : null}
                    />
                  </div>
                </div>
              )}

              {/* ══ QUAN HỆ ═════════════════════════════════════════════════ */}
              {khoiQuanHe}

              {/* ══ LỜI KỂ CÓ NHẮC TỚI (FR-47) — kèm mức đồng thuận của NGƯỜI KỂ (FR-49).
                  Nút nghe nằm ở mục Lời kể — màn ấy giữ máy nghe; ở đây chỉ bày sự tồn tại. */}
              {loiKeVe.length > 0 && (
                <>
                  <TieuDeMuc>Lời kể có nhắc tới</TieuDeMuc>
                  <ul className="grid gap-3">
                    {loiKeVe.map((l) => (
                      <li
                        key={l.recordingId}
                        className="rounded-md border border-border bg-card px-4 py-3.5"
                      >
                        <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                          {l.toldByName ? `${l.toldByName} kể` : l.title}
                        </p>
                        <p className="mt-0.5 text-[15px] text-muted-foreground">
                          {[
                            l.toldByName ? l.title : null,
                            doDai(l.durationSeconds),
                            `thu ngày ${ngayHienThi(l.recordedOn)}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <p className="mt-1.5 text-[15px]">
                          {l.statusLabel ?? NHAN_TIEP_CAN[l.accessTier]}
                        </p>
                        {l.playable && (
                          <Button
                            asChild
                            variant="outline"
                            className="mt-3 h-12 w-full text-[17px]"
                          >
                            <Link href="/loi-ke">Nghe ở mục Lời kể</Link>
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* ══ AI ĐÃ GHI GÌ (FR-39) — mục "Lịch sử" ════════════════════
                  err('forbidden') ⇒ mục KHÔNG XUẤT HIỆN — vắng lặng, không phải ô bị che:
                  nhật ký giữ cả giá trị đã rút, nên chỉ ai thấy trọn người này mới được đọc. */}
              {lichSu.ok && lichSu.value.length > 0 && (
                <>
                  <TieuDeMuc>Ai đã ghi gì</TieuDeMuc>
                  <ul className="grid gap-2">
                    {lichSu.value.map((m, i) => (
                      <li key={i} className="flex flex-wrap gap-x-2 text-[17px]">
                        <span>{m.summary}</span>
                        <span className="text-muted-foreground">
                          — {m.byName} · {ngayHienThi(m.at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* ══ HAI HÀNH ĐỘNG + ĐƯỜNG VỀ CÂY ════════════════════════════
                  Chưa gắn được vào phả thì các màn đích tự dẫn về luồng nhận chỗ —
                  không màn lỗi nào ở đây (EXPERIENCE.md § Chưa gắn node). */}
              <div className="mt-7 grid gap-2.5">
                <Button asChild className="h-12 w-full text-[17px]">
                  <Link href="/them">Thêm người thân của người này</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 w-full text-[17px]">
                  <Link href={`/loi-ke?ve=${the.personId}`}>Kể về người này</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 w-full text-[17px]">
                  <Link href="/gia-pha">Xem trên cây</Link>
                </Button>
              </div>
            </>
          )}
        </article>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" banLamViec={await coBanLamViec()} />
    </>
  );
}
