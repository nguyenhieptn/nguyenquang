/**
 * THÊM VÀO PHẢ — bước 3 / 4: nối vào ai.
 *
 * Hai nhánh, cùng một câu việc — tìm cho người mới MỘT CHỖ trên cây:
 *   · Tự khai (qh=minh): "Ai trong họ là người thân gần nhất?" — tìm (core/tree
 *     searchPersons, so khớp không dấu AD-16, đã lọc bán kính riêng tư), chọn một người,
 *     rồi nói người ấy là gì của mình. Khách CHƯA đăng nhập vẫn đi được bước này —
 *     Luồng 1: "Tới đây mới cần xác thực" là ở bước GHI, không phải bước xem.
 *   · Thêm người thân: node của MÌNH là mốc (cần đã gắn); anh/chị/em nối qua bố mẹ chung,
 *     tra từ đường huyết thống của mình.
 *
 * Chưa đăng nhập / chưa gắn ở nhánh hai KHÔNG phải màn lỗi (EXPERIENCE § Chưa gắn node:
 * "mọi hành động ghi dẫn về luồng gắn node") — là lời mời inline, đường đi để sẵn.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { resolveSession } from '@/core/identity';
import { getAncestryPath, searchPersons, type PersonCard } from '@/core/tree';
import { CauHoi, KhoiCham, KhungThem, Nhip, OChonDuong, TheNguoi, metaThe } from '../_chung/khuon';
import { dinhDangLuc, docTrangThai, duongBuoc, nhanQuanHe, type TrangThai } from '../_chung/luong';

export const metadata: Metadata = { title: 'Thêm vào phả — nối' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const t = docTrangThai(sp);
  // Chưa có tên thì chưa tới lượt màn này — về đầu luồng, không dựng màn lỗi.
  if (!t || !t.ten) redirect('/them');
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';

  return (
    <KhungThem>
      <section>
        <Nhip so={3} />
        {t.qh === 'minh' ? <NoiTuKhai t={t} q={q} /> : <NoiNguoiThan t={t} />}
      </section>
    </KhungThem>
  );
}

/* ══ NHÁNH TỰ KHAI — tìm người thân gần nhất rồi nói quan hệ ══════════════════════════ */

async function NoiTuKhai({ t, q }: { t: TrangThai; q: string }) {
  // Đã chọn người → hỏi nốt: người ấy là gì của mình. Vẫn là câu "nối vào ai" — chọn và
  // gọi tên quan hệ là hai nửa của một câu trả lời, không phải hai câu hỏi.
  if (t.moc) return <ChonQuanHeVoiMoc t={t} q={q} />;

  const ket = q ? await searchPersons(q) : null;

  return (
    <>
      <CauHoi>Ai trong họ là người thân gần nhất?</CauHoi>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Chọn một người đã có trên phả để nối mình vào — bố, con, vợ chồng hay anh chị em
        của mình đều được.
      </p>

      {/* Ô tìm thật — cùng khuôn với OTim của trang chủ, ở đây là form GET giữ nguyên
          trạng thái các bước trước trong hidden fields. */}
      <form action="/them/noi" method="get" className="mt-5">
        <input type="hidden" name="qh" value={t.qh} />
        <input type="hidden" name="ten" value={t.ten ?? ''} />
        {t.ns && <input type="hidden" name="ns" value={t.ns} />}
        {t.gt && <input type="hidden" name="gt" value={t.gt} />}
        <label className="block rounded-md border border-input bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
          <span className="text-[15px] text-muted-foreground">Tìm người thân</span>
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Gõ tên người cần tìm"
            className="mt-0.5 block w-full bg-transparent font-[family-name:var(--font-pha)] text-[17px] outline-none placeholder:text-muted-foreground"
          />
        </label>
        <Button type="submit" variant="outline" className="mt-2.5 h-12 w-full text-[17px]">
          Tìm trong phả
        </Button>
      </form>

      {ket && !ket.ok && (
        // Đọc không được (phả chưa mở) — nói ngắn, không banner lỗi.
        <p className="mt-5 text-[15px] text-muted-foreground">
          Chưa mở được phả để tìm. Thử lại sau một lát.
        </p>
      )}

      {ket?.ok && ket.value.length === 0 && (
        <p className="mt-5 text-[17px] text-muted-foreground">
          Chưa tìm thấy tên này trong phả. Thử gõ ngắn hơn — chỉ tên, không cần họ đệm —
          hoặc tìm một người thân khác của mình.
        </p>
      )}

      {ket?.ok && ket.value.length > 0 && (
        <ul className="mt-5 grid gap-2.5">
          {ket.value.map((h) => (
            <li key={h.personId}>
              {/* Kèm ĐỜI + CHI để phân biệt người trùng tên — trong một dòng họ, trùng tên
                  là chuyện thường (EXPERIENCE § Không tìm thấy). Tồn nghi = nét đứt + vân,
                  KHÔNG opacity. */}
              <Link
                href={duongBuoc('/them/noi', { ...t, moc: h.personId, tenMoc: h.fullName }, { q })}
                className={`block rounded-md border px-4 py-3 transition-colors duration-150 ease-out hover:border-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  h.confidence === 'ton-nghi'
                    ? 'van-ton-nghi border-dashed'
                    : 'border-border bg-card'
                }`}
                style={
                  h.confidence === 'ton-nghi'
                    ? { borderColor: 'var(--color-tin-ton-nghi)' }
                    : undefined
                }
              >
                <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold leading-snug">
                  {h.fullName}
                  {h.similar && (
                    <span className="ml-2 text-[15px] font-normal text-muted-foreground">
                      · gần giống
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[15px] text-muted-foreground">{metaThe(h)}</p>
                {h.attribution && (
                  <p className="mt-1.5 text-[15px] italic text-primary">
                    {h.attribution.byName} ghi · {dinhDangLuc(h.attribution.at)}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

async function ChonQuanHeVoiMoc({ t, q }: { t: TrangThai; q: string }) {
  // Anh/chị/em cần BỐ MẸ CHUNG: tra bậc trên của mốc từ đường huyết thống (AD-5, tính lúc
  // đọc). steps[0] là chính mốc, steps[1] là bậc sinh thành gần nhất đã ghi.
  const duong = await getAncestryPath(t.moc!);
  const cha: PersonCard | undefined = duong.ok ? duong.value.steps[1] : undefined;
  const mocCard: PersonCard | undefined = duong.ok ? duong.value.steps[0] : undefined;
  const tenMoc = mocCard?.fullName ?? t.tenMoc ?? 'Người đã chọn';

  return (
    <>
      <CauHoi>{tenMoc} là gì của mình?</CauHoi>

      <div className="mt-5">
        <TheNguoi
          ten={tenMoc}
          meta={mocCard ? metaThe(mocCard) : undefined}
          tonNghi={mocCard?.confidence === 'ton-nghi'}
        />
      </div>

      <div className="mt-5 grid gap-2.5">
        <OChonDuong href={duongBuoc('/them/xac-nhan', { ...t, tenMoc, ct: 'bo-me' })}>
          Bố hoặc mẹ của mình
        </OChonDuong>
        <OChonDuong href={duongBuoc('/them/xac-nhan', { ...t, tenMoc, ct: 'con' })}>
          Con của mình
        </OChonDuong>
        <OChonDuong href={duongBuoc('/them/xac-nhan', { ...t, tenMoc, ct: 'vo-chong' })}>
          Vợ hoặc chồng của mình
        </OChonDuong>
        {cha ? (
          // Anh chị em = CON CỦA CÙNG BỐ MẸ: mốc thật của phép nối là bậc sinh thành,
          // nên đổi mốc sang người ấy ngay tại đây — màn xác nhận chỉ việc đọc lại.
          <OChonDuong
            href={duongBuoc('/them/xac-nhan', {
              ...t,
              ct: 'bo-me',
              moc: cha.personId,
              tenMoc: cha.fullName,
            })}
            phu={`cùng bố mẹ — nối làm con của ${cha.fullName}`}
          >
            Anh, chị hoặc em của mình
          </OChonDuong>
        ) : (
          <p className="rounded-md border border-dashed border-input px-4 py-3 text-[15px] text-muted-foreground">
            Anh, chị hoặc em của mình — chưa nối được lối này: trên phả chưa ghi bố mẹ của{' '}
            {tenMoc}. Chọn một cách nối khác, hoặc lui lại chọn người thân khác.
          </p>
        )}
      </div>

      <Link
        href={duongBuoc('/them/noi', { ...t, moc: undefined, tenMoc: undefined }, { q })}
        className="mt-5 inline-block py-2.5 text-[17px] underline decoration-border underline-offset-4 hover:decoration-foreground"
      >
        Chọn người khác
      </Link>
    </>
  );
}

/* ══ NHÁNH THÊM NGƯỜI THÂN — node của mình là mốc ═════════════════════════════════════ */

async function NoiNguoiThan({ t }: { t: TrangThai }) {
  const session = await resolveSession();

  // Chưa đăng nhập: lời mời, không phải lỗi. `tiep` đưa về đúng chỗ đang dở sau khi vào.
  if (!session) {
    const tiep = encodeURIComponent(duongBuoc('/them/noi', t));
    return (
      <>
        <CauHoi>Nối vào chỗ của mình trên phả</CauHoi>
        <p className="mt-2 text-[17px] text-muted-foreground">
          Người mới sẽ được ghi là {nhanQuanHe(t)}, nên trước hết cần đăng nhập để phả biết
          &ldquo;mình&rdquo; là ai. Phần vừa khai vẫn còn nguyên, vào xong là tiếp ngay.
        </p>
        <div className="mt-6 grid gap-2.5">
          <Button asChild className="h-12 w-full text-[17px]">
            <Link href={`/dang-nhap?tiep=${tiep}`}>Đăng nhập</Link>
          </Button>
        </div>
      </>
    );
  }

  // Có tài khoản nhưng CHƯA GẮN với ai trên phả — trạng thái thường trực, không phải lỗi
  // (EXPERIENCE § Chưa gắn node). Mời đi nhận chỗ, kèm lối tự khai cho người chưa có tên.
  if (!session.personId) {
    const tiep = encodeURIComponent(duongBuoc('/them/noi', t));
    return (
      <>
        <CauHoi>Chưa có chỗ của mình trên phả</CauHoi>
        <p className="mt-2 text-[17px] text-muted-foreground">
          Thêm người thân là nối vào chính chỗ của mình trên cây, nên cần nhận chỗ ấy trước —
          một người trong họ sẽ xác nhận.
        </p>
        <div className="mt-6 grid gap-2.5">
          <Button asChild className="h-12 w-full text-[17px]">
            <Link href={`/gan-node?tiep=${tiep}`}>Nhận chỗ của mình trên phả</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 w-full text-[17px]">
            <Link href={duongBuoc('/them/ten', { qh: 'minh' })}>
              Chưa có tên trên phả — ghi chính mình trước
            </Link>
          </Button>
        </div>
      </>
    );
  }

  const duong = await getAncestryPath(session.personId);
  const minhCard: PersonCard | undefined = duong.ok ? duong.value.steps[0] : undefined;

  // Anh/chị/em: nối qua BỐ MẸ CHUNG — bậc trên của chính mình trên đường huyết thống.
  if (t.qh === 'anh-chi-em') {
    const cha: PersonCard | undefined = duong.ok ? duong.value.steps[1] : undefined;
    if (!cha) {
      return (
        <>
          <CauHoi>Nối qua bố mẹ — mà phả chưa ghi</CauHoi>
          <p className="mt-2 text-[17px] text-muted-foreground">
            Anh chị em đứng cạnh nhau trên cây vì cùng một bậc sinh thành. Trên phả chưa ghi
            bố mẹ của mình, nên chưa có chỗ để nối. Thêm bố trước — vài phút — rồi thêm anh
            chị em sau.
          </p>
          <div className="mt-6 grid gap-2.5">
            <Button asChild className="h-12 w-full text-[17px]">
              <Link href={duongBuoc('/them/ten', { qh: 'bo' })}>Thêm bố vào phả trước</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full text-[17px]">
              <Link href="/them">Chọn quan hệ khác</Link>
            </Button>
          </div>
        </>
      );
    }
    return (
      <>
        <CauHoi>Nối vào ai?</CauHoi>
        <p className="mt-2 text-[17px] text-muted-foreground">
          Anh chị em cùng bố mẹ — người mới sẽ được nối làm con của:
        </p>
        <div className="mt-5">
          <TheNguoi ten={cha.fullName} meta={metaThe(cha)} tonNghi={cha.confidence === 'ton-nghi'} />
        </div>
        <Button asChild className="mt-6 h-12 w-full text-[17px]">
          <Link href={duongBuoc('/them/xac-nhan', { ...t, moc: cha.personId, tenMoc: cha.fullName })}>
            Tiếp
          </Link>
        </Button>
      </>
    );
  }

  // Bố/Mẹ/Vợ chồng/Con: mốc là chính mình. Nếu đường huyết thống đọc không được (hiếm),
  // vẫn đi tiếp bằng id trong phiên — câu tóm tắt sẽ gọi mốc là "mình".
  const tenMinh = minhCard?.fullName ?? 'mình';
  return (
    <>
      <CauHoi>Nối vào ai?</CauHoi>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Người mới sẽ được ghi là {nhanQuanHe(t)}, nối vào chỗ này trên cây:
      </p>
      <div className="mt-5">
        {minhCard ? (
          <TheNguoi
            ten={minhCard.fullName}
            meta={metaThe(minhCard)}
            tonNghi={minhCard.confidence === 'ton-nghi'}
            nhanMinh
          />
        ) : (
          <KhoiCham>
            Chưa đọc lại được chỗ của mình trên cây — vẫn ghi tiếp được, phả nối đúng chỗ.
          </KhoiCham>
        )}
      </div>
      <Button asChild className="mt-6 h-12 w-full text-[17px]">
        <Link
          href={duongBuoc('/them/xac-nhan', { ...t, moc: session.personId, tenMoc: tenMinh })}
        >
          Tiếp
        </Link>
      </Button>
    </>
  );
}
