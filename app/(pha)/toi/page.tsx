/**
 * TÔI (story 2-9 — FR-64, FR-55) — tài khoản, chỗ của mình trong phả, và quyền của người sống.
 * Promote từ prototype `uiworkshop/toi` (commit 8fd4af1^), thay mock bằng core thật.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Tài khoản ≠ người trong phả — người có tài khoản nhưng CHƯA nhận chỗ là
 *     một trạng thái THƯỜNG TRỰC, không phải bước chuyển tiếp; màn này xử nó như trạng thái.
 *   · EXPERIENCE.md § State Patterns — "Vừa được thêm bởi người khác (FR-55)": thông báo LƯU SẴN
 *     trên node, hiện ra khi người đó đăng nhập và gắn được vào chỗ của mình, kèm BA đường —
 *     sửa · ẩn khỏi phần công khai (vẫn giữ liên kết phả hệ) · từ chối xuất hiện trong bản in.
 *
 * ── VÌ SAO THÔNG BÁO FR-55 LÀ THỨ ĐẦU TIÊN TRÊN MÀN ─────────────────────────────────────────
 * Vì nó là thứ duy nhất trên màn này có NGƯỜI KHÁC làm chủ động. Mọi mục còn lại là việc mình
 * tự làm bất cứ lúc nào; còn việc ai đó đã ghi về mình thì đã xảy ra rồi, và lần đăng nhập đầu
 * là cơ hội đầu tiên — có khi là duy nhất — để người ấy được biết.
 *
 * ⚠️ GIỚI HẠN ĐÃ CHẤP NHẬN, MANG THEO — cơ chế này là KÉO. Người không bao giờ mở web thì không
 * bao giờ biết mình đã bị đưa vào phả (PRD §12 tự thú). Đừng hiểu ngầm FR-55 đã xong.
 *
 * ⚠️ TODO(core):
 *   · Thông báo added-to-tree mang payload {fullName, byAccountId} — không có API đổi
 *     byAccountId ra tên người. "Ai ghi" lấy từ attributionFor (dòng ghi công tạo node) —
 *     đúng trong mọi ca thêm-mới; nếu về sau có ca gắn thông báo mà không tạo node, cần API tên.
 *   · Chưa có API "mình đã ghi được gì" (nhật ký lọc theo tài khoản) — ô ấy của prototype
 *     chưa dựng lại được, chờ core.
 * (hiddenFromPublic/refusePrint giờ đọc thật qua getMyPersonFlags; trạng thái chờ xác nhận
 *  đọc qua getMyAttachment — hai nợ cũ đã trả.)
 */
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';
import {
  getMyAttachment,
  getMyNotifications,
  getMyPersonFlags,
  resolveSession,
  type NotificationItem,
} from '@/core/identity';
import { getAncestryPath, type PersonCard } from '@/core/tree';
import { attributionFor } from '@/core/audit';
import { anKhoiCongKhai, daXemThongBao, tuChoiBanIn } from './actions';
import { NutQuyen } from './quyen-hien-thi';
import { TaiKhoan } from './tai-khoan';

// ── Định dạng ────────────────────────────────────────────────────────────────

function ngayHienThi(khi: string | Date): string {
  const d = khi instanceof Date ? khi : new Date(khi);
  if (Number.isNaN(d.getTime())) return String(khi);
  const dau = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const lech = Math.round((dau(new Date()) - dau(d)) / 86_400_000);
  if (lech <= 0) return 'hôm nay';
  if (lech === 1) return 'hôm qua';
  return d.toLocaleDateString('vi-VN');
}

function dongMeta(the: PersonCard): string {
  return [
    the.generation !== null ? `đời ${the.generation}` : null,
    the.branchCode ? `chi ${the.branchCode}` : null,
    the.lifespan || null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function TieuDeMuc({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-7 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function Khung({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className={`${DOC} pb-28 pt-7 md:pb-16 md:pt-28`}>{children}</main>
      <ThanhDieuHuong hienTai="toi" />
    </>
  );
}

// ── Ba trạng thái của màn ────────────────────────────────────────────────────

/** Chưa đăng nhập — mời, không chặn: xem cây thì vẫn không cần tài khoản (FR-11). */
function ChuaDangNhap() {
  return (
    <Khung>
      <h1 className="font-[family-name:var(--font-pha)] text-[27px] leading-tight">
        Chưa đăng nhập
      </h1>
      <p className="mt-2 text-[17px]">
        Đăng nhập để thấy chỗ của mình trong phả, và để phần về mình thì mình quyết.
      </p>
      <div className="mt-5 grid gap-2.5">
        <Button asChild className="h-12 w-full text-[17px]">
          <Link href="/dang-nhap">Đăng nhập</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 w-full text-[17px]">
          <Link href="/gia-pha">Xem gia phả — không cần đăng nhập</Link>
        </Button>
      </div>
    </Khung>
  );
}

/** Có tài khoản, chưa nhận chỗ — trạng thái THƯỜNG TRỰC, không phải màn lỗi. */
function ChuaNhanCho() {
  return (
    <Khung>
      <h1 className="font-[family-name:var(--font-pha)] text-[27px] leading-tight">
        Tài khoản đã có, chỗ trong phả thì chưa nhận
      </h1>
      <p className="mt-2 text-[17px]">
        Ai trong họ cũng có một chỗ trên phả. Nhận chỗ để những điều mình ghi mang tên mình,
        và để phần về mình thì mình quyết.
      </p>
      <div className="mt-5 grid gap-2.5">
        <Button asChild className="h-12 w-full text-[17px]">
          <Link href="/gan-node">Nhận chỗ của mình trong phả</Link>
        </Button>
      </div>
      <TieuDeMuc>Tài khoản</TieuDeMuc>
      <TaiKhoan />
    </Khung>
  );
}

/** Đã xin nhận chỗ, đang chờ bảo lãnh (AD-8) — trạng thái ỔN, ấm, không xin lỗi. */
function DangChoXacNhan({ tenNguoi }: { tenNguoi: string }) {
  return (
    <Khung>
      <h1 className="font-[family-name:var(--font-pha)] text-[27px] leading-tight">
        Đã gửi lời nhận chỗ
      </h1>
      <div className="mt-5 rounded-md border border-border bg-card px-4 py-3">
        <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">{tenNguoi}</p>
      </div>
      <p className="mt-4 text-[17px]">
        Chờ một người trong họ xác nhận — thường là trưởng chi hoặc ban tu phả, có thể mất vài
        ngày. Không cần làm gì thêm; xác nhận xong là chỗ này thành chỗ của mình.
      </p>
      <p className="mt-3 text-[17px]">Trong lúc chờ, xem phả và tìm người vẫn đủ như trước.</p>
      <TieuDeMuc>Tài khoản</TieuDeMuc>
      <TaiKhoan />
    </Khung>
  );
}

// ── Trang ────────────────────────────────────────────────────────────────────

export default async function Page() {
  const session = await resolveSession();
  if (!session) return <ChuaDangNhap />;
  if (!session.personId) {
    // Chưa có chỗ — nhưng có thể ĐÃ xin và đang chờ bảo lãnh (AD-8): trạng thái chờ phải
    // hiện ra thay cho lời mời đi tìm, kẻo người ta tưởng lời nhận chỗ đã rơi mất.
    const ganKet = await getMyAttachment();
    if (ganKet.ok && ganKet.value && ganKet.value.status === 'pending')
      return <DangChoXacNhan tenNguoi={ganKet.value.personName} />;
    return <ChuaNhanCho />;
  }

  const personId = session.personId;
  const [duong, thongBao, ghiCong, coQuyen] = await Promise.all([
    getAncestryPath(personId),
    getMyNotifications(),
    attributionFor([personId]),
    // FR-55: trạng thái thật của hai quyền — nút không còn phải đoán mặc định.
    getMyPersonFlags(),
  ]);
  const quyen = coQuyen.ok ? coQuyen.value : { hiddenFromPublic: false, refusePrint: false };

  const the = duong.ok ? duong.value.steps[0] : null;
  const cacThongBao: NotificationItem[] = thongBao.ok ? thongBao.value : [];
  const chuaXem = cacThongBao.filter((t) => t.seenAt === null);
  const vuaDuocThem = chuaXem.filter((t) => t.kind === 'added-to-tree');
  const vuaDuocSua = chuaXem.filter((t) => t.kind === 'record-changed');
  const nguoiGhi = ghiCong.ok ? ghiCong.value[personId] : undefined;

  /* ══ LẦN ĐẦU GẶP CHỖ CỦA MÌNH — thông báo FR-55 bật ra, thay cả màn ═══════
     Ba đường bày ngang nhau, cùng cỡ — "từ chối in" không được nhỏ hơn "sửa". */
  if (vuaDuocThem.length > 0) {
    return (
      <Khung>
        <section>
          <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
            Phả đã có tên mình từ trước
          </h1>
          <p className="mt-2 text-[17px]">
            {nguoiGhi
              ? `${nguoiGhi.byName} ghi vào ${ngayHienThi(nguoiGhi.at)}, khi chưa hỏi được. `
              : 'Được ghi vào khi chưa hỏi được. '}
            Từ giờ, phần về mình thì mình quyết.
          </p>

          {the && (
            <Card className="mt-5 gap-0 py-4">
              <CardBody className="px-4">
                <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold">
                  {the.fullName}
                </p>
                {dongMeta(the) && (
                  <p className="mt-0.5 text-[15px] text-muted-foreground">{dongMeta(the)}</p>
                )}
                {/* Prototype kể ra HẾT những gì đã ghi; core chưa có danh sách khẳng định
                    của một người (TODO đầu file) — đường xem trọn nằm ở trang của mình. */}
                <Link
                  href={`/nguoi/${personId}`}
                  className="mt-2 inline-block py-2.5 text-[17px] underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Xem hết phần ghi về mình
                </Link>
              </CardBody>
            </Card>
          )}

          {/* BA ĐƯỜNG, ngang nhau — cùng chiều cao, cùng bề ngang. */}
          <div className="mt-5 grid gap-2.5">
            <Button asChild className="h-12 w-full text-[17px]">
              <Link href={`/nguoi/${personId}`}>Sửa lại cho đúng</Link>
            </Button>
            <NutQuyen
              hanhDong={anKhoiCongKhai}
              nhanBat="Ẩn khỏi phần cả họ xem được"
              nhanTat="Hiện lại với cả họ"
              batBanDau={quyen.hiddenFromPublic}
            />
            <NutQuyen
              hanhDong={tuChoiBanIn}
              nhanBat="Không in tên mình trong bản in"
              nhanTat="Cho in tên mình trở lại"
              batBanDau={quyen.refusePrint}
            />
          </div>

          {/* Nói rõ hệ quả của "ẩn": liên kết phả hệ GIỮ NGUYÊN. Không nói thì người ta sợ
              ẩn mình đi là làm đứt nhánh con cháu, và không dám dùng quyền của mình. */}
          <p className="mt-4 text-[17px] text-muted-foreground">
            Ẩn thì tên không hiện với cả họ, nhưng nhánh vẫn liền: con cháu vẫn nối được ngược
            lên các cụ qua chỗ của mình.
          </p>

          <form action={daXemThongBao}>
            {chuaXem.map((t) => (
              <input key={t.id} type="hidden" name="id" value={t.id} />
            ))}
            <Button type="submit" variant="outline" className="mt-5 h-12 w-full text-[17px]">
              Để nguyên như đang ghi
            </Button>
          </form>
        </section>
      </Khung>
    );
  }

  /* ══ THƯỜNG NGÀY — đã nhận chỗ ═══════════════════════════════════════════ */
  return (
    <Khung>
      <section>
        {the ? (
          <>
            <h1 className="font-[family-name:var(--font-pha)] text-[27px] leading-tight">
              {the.fullName}
            </h1>
            {dongMeta(the) && (
              <p className="mt-1 text-[17px] text-muted-foreground">{dongMeta(the)}</p>
            )}

            <Card className="mt-5 gap-0 py-4">
              <CardBody className="px-4">
                <p className="text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
                  Chỗ của mình trong phả
                </p>
                {duong.ok && duong.value.steps.length > 1 ? (
                  <p className="mt-1.5 font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                    {duong.value.steps.length} đời tới {duong.value.fragmentRootName}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[17px]">
                    Chưa nối được lên đời trên — ai biết thì nối giúp.
                  </p>
                )}
                {duong.ok && !duong.value.reachesMainRoot && (
                  // FR-48: mảnh chưa nối nói thật là mảnh chưa nối, không vẽ liền.
                  <p className="mt-1 text-[15px] text-muted-foreground">
                    Nhánh này còn là một mảnh chưa nối được vào cây chính.
                  </p>
                )}
                {nguoiGhi && (
                  <p className="mt-1 text-[15px] italic text-primary">
                    {nguoiGhi.byName} ghi vào phả · {ngayHienThi(nguoiGhi.at)}
                  </p>
                )}
              </CardBody>
            </Card>
          </>
        ) : (
          <h1 className="font-[family-name:var(--font-pha)] text-[27px] leading-tight">
            Chỗ của mình trong phả
          </h1>
        )}

        {/* Có người vừa sửa phần ghi về mình (AD-15) — báo lặng lẽ, kèm đường xem. */}
        {vuaDuocSua.length > 0 && (
          <>
            <TieuDeMuc>Có gì mới</TieuDeMuc>
            <ul className="grid gap-2">
              {vuaDuocSua.map((t) => (
                <li key={t.id} className="text-[17px]">
                  Phần ghi về mình vừa được sửa
                  <span className="block text-[15px] text-muted-foreground">
                    {ngayHienThi(t.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
            <form action={daXemThongBao} className="mt-3">
              {vuaDuocSua.map((t) => (
                <input key={t.id} type="hidden" name="id" value={t.id} />
              ))}
              <Button type="submit" variant="outline" className="h-12 w-full text-[17px]">
                Đã xem
              </Button>
            </form>
          </>
        )}

        <TieuDeMuc>Phần về mình</TieuDeMuc>
        <div className="grid gap-2.5">
          <Button asChild variant="outline" className="h-12 w-full text-[17px]">
            <Link href={`/nguoi/${personId}`}>Sửa thông tin về mình</Link>
          </Button>
          <NutQuyen
            hanhDong={anKhoiCongKhai}
            nhanBat="Ẩn khỏi phần cả họ xem được"
            nhanTat="Hiện lại với cả họ"
            batBanDau={quyen.hiddenFromPublic}
          />
          <NutQuyen
            hanhDong={tuChoiBanIn}
            nhanBat="Không in tên mình trong bản in"
            nhanTat="Cho in tên mình trở lại"
            batBanDau={quyen.refusePrint}
          />
        </div>

        <TieuDeMuc>Tài khoản</TieuDeMuc>
        <TaiKhoan />
      </section>
    </Khung>
  );
}
