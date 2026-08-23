/**
 * /gia-pha/ca-toc — TẦNG 1 của ba tầng zoom (Tộc → Chi → Người).
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture — Cây ba tầng
 *   · EXPERIENCE.md § Responsive & Platform — hai bộ mặt của cùng một màn
 *   · DESIGN.md § Brand & Style, § Colors (son khan hiếm), § Elevation & Depth (không đổ bóng)
 *
 * FR: FR-15 · FR-63 (gốc tạm) · FR-48 (mảnh chưa nối) · FR-3 (số còn ở tồn nghi)
 *
 * VÌ SAO TẦNG NÀY VẼ CHI CHỨ KHÔNG VẼ NGƯỜI — con số, không phải khẩu vị:
 * Q1 chốt dưới 300 người, 5–7 đời → đời rộng nhất khoảng 120 người. Sàn chữ 17px buộc một ô tên
 * rộng ~140px, tức ~16.800px bề ngang. Vẽ hết người trong một màn thì chữ phải xuống dưới sàn
 * 15px — vi phạm chính § Accessibility Floor. Cây toàn tộc trọn vẹn là hiện vật của BẢN IN
 * (FR-33). 5–7 khối chi thì vừa màn ở CẢ HAI khung, và chữ luôn đủ lớn.
 *
 * ── HAI BỘ MẶT ──────────────────────────────────────────────────────────────────────────────
 * ĐIỆN THOẠI — khối chi xếp chồng, không nhánh nối. Trên màn hẹp, nhánh nối chỉ tổ chiếm chỗ.
 * MÁY — khối chi đứng HÀNG NGANG và có NHÁNH NỐI THẬT xuống từ gốc tạm, nên nó đọc ra hình cây
 *   chứ không phải danh sách. Đây là điều màn hẹp không làm được, và là lý do bản máy tồn tại.
 *   Đề từ dòng họ cũng chỉ mở hết cỡ ở đây — nơi có chỗ cho nó thở.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { KHUNG, RONG } from '@/components/pha/khung';
import { ThanhDieuHuong, tenPhaTuThongTin } from '@/components/pha/thanh-dieu-huong';
// Bản máy đi qua CỔNG TẢI ĐỘNG, không import thẳng — xem đầu file cay-tai-dong.tsx.
import { CayCaTocTaiDong } from '@/components/pha/cay-tai-dong';
import { getClanInfo, resolveViewer, type ClanSettings } from '@/core/identity';
import { getAncestryPath, getClanOverview } from '@/core/tree';
import { tenChi } from '../_chia-se/chuyen-doi';
import { PhaTrong } from '../_chia-se/pha-trong';

export default async function Page() {
  const [viewer, tongQuan, thongTinPha] = await Promise.all([
    resolveViewer(),
    getClanOverview(),
    getClanInfo(),
  ]);
  if (!viewer) redirect('/dang-nhap');
  // AD-14: danh tính dòng họ (tên + đề từ) đọc từ `clan.settings`, không nằm trong mã.
  const caiDat: ClanSettings = thongTinPha.ok ? thongTinPha.value.settings : {};
  const tenPha = tenPhaTuThongTin(thongTinPha.ok ? thongTinPha.value : null);
  if (!tongQuan.ok) {
    if (tongQuan.error.code === 'unauthenticated') redirect('/dang-nhap');
    return <PhaTrong tenPha={tenPha} />; // 'forbidden' → vắng lặng, không băng-rôn lỗi
  }
  const { mainFragment, branches, unconnectedFragments } = tongQuan.value;
  if (!mainFragment) return <PhaTrong tenPha={tenPha} />;

  // Chi của mình tô son giữa các chi khác — cao trào của Luồng 3 (bước 2). Đầu chi = tổ tiên
  // đứng ngay dưới gốc tạm trên đường huyết thống của chính mình.
  let chiCuaMinhId: string | undefined;
  if (viewer.personId) {
    const duong = await getAncestryPath(viewer.personId);
    if (duong.ok && duong.value.reachesMainRoot && duong.value.steps.length >= 2)
      chiCuaMinhId = duong.value.steps[duong.value.steps.length - 2].personId;
  }

  const khoiChi = branches.map((b) => ({
    id: b.headPersonId,
    ten: tenChi(b.branchCode).replace(/^chi/, 'Chi'),
    nguoiDungDau: b.headName,
    soNguoi: b.personCount,
    soTonNghi: b.tentativeCount,
    href: `/gia-pha/chi/${b.headPersonId}`,
  }));
  const manhRoi = unconnectedFragments.map((m) => ({
    id: m.rootPersonId,
    nhan: `Nhánh cụ ${m.rootName}`,
    soNguoi: m.personCount,
    href: `/gia-pha/chi/${m.rootPersonId}`,
  }));
  const tongNguoi =
    mainFragment.personCount + unconnectedFragments.reduce((s, m) => s + m.personCount, 0);
  const tongTonNghi =
    mainFragment.tentativeCount + unconnectedFragments.reduce((s, m) => s + m.tentativeCount, 0);

  return (
    <>
      <main className="flex-1 pb-28 pt-7 md:pb-8 md:pt-24">
        <div className={KHUNG}>
          {/* ── Đề từ. Trên máy mở hết cỡ; chữ Hán đặt bằng `--font-han-nom` (stack CJK hệ
              thống), KHÔNG bằng `--font-pha` — serif Latin không phủ CJK nên trình duyệt tự
              rơi về một font tuỳ máy. NFR-9 là điều kiện của cả khối, không phải của riêng
              dòng phiên âm: thiếu phiên âm thì chữ Hán KHÔNG hiện — đề từ không đọc được ra
              tiếng thì là hoa văn, không phải câu chữ của dòng họ.
              Tên họ + đề từ đọc từ clan.settings qua getClanInfo (AD-14) — phả chưa khai đề từ
              thì khối đề từ vắng, không bịa. */}
          <header className="mb-6 md:mb-6 md:border-b md:border-border md:pb-5 md:text-center">
            <p className="text-[15px] uppercase tracking-[0.16em] text-muted-foreground">
              {tenPha}
            </p>
            {caiDat.motto && caiDat.mottoPhonetic && (
              <>
                <p className="mt-2 font-[family-name:var(--font-han-nom)] text-[23px] text-primary md:mt-2 md:text-[32px]">
                  {caiDat.motto}
                </p>
                <p className="text-[15px] italic text-muted-foreground md:mt-1 md:text-[17px]">
                  {caiDat.mottoPhonetic}
                </p>
              </>
            )}
            <h1 className="mt-4 font-[family-name:var(--font-pha)] text-[23px] md:mt-4 md:text-[26px]">
              Cả tộc
            </h1>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {tongNguoi} người đã được ghi · {khoiChi.length} chi · {tongTonNghi} người còn tồn
              nghi
              {manhRoi.length > 0 && ` · ${manhRoi.length} mảnh chưa nối`}
            </p>
          </header>
        </div>

        {/* ══ BẢN MÁY — cùng một khung nhìn cây với tầng 2 ═════════════════ */}
        <div className={`${RONG} hidden md:block`}>
          <CayCaTocTaiDong
            goc={{ id: mainFragment.rootPersonId, hoTen: mainFragment.rootName }}
            khoiChi={khoiChi}
            manhRoi={manhRoi}
            chiCuaMinhId={chiCuaMinhId}
            // Cây là NỘI DUNG CHÍNH của màn: cho nó phần còn lại của khung nhìn thay vì một hộp
            // cao bằng nhau trên mọi máy. Số trừ đi là chỗ của măng-sét + đầu trang + dòng chú.
            chieuCao="h-[clamp(460px,calc(100dvh-25rem),900px)]"
          />
          {/* MỘT dòng chú thích, không phải hai khối. Hai đoạn cũ ăn ~120px ngay dưới cây —
              đúng chỗ mắt vừa rời cây và cần thấy tiếp phần dưới của cây. */}
          <p className="mt-2 max-w-3xl text-[15px] text-muted-foreground">
            Kéo để di chuyển · chụm hoặc dùng nút + − để phóng to.
            {manhRoi.length > 0 &&
              ' Mảnh chưa nối nằm tách hẳn sang một bên, kéo tới mới thấy — chưa ai tìm ra chỗ nối. Đó không phải lỗi: nối được một mảnh là việc quý nhất ai cũng làm được.'}
          </p>
        </div>

        {/* ══ BẢN ĐIỆN THOẠI — khối chi xếp chồng, một nét dọc ═══════════════ */}
        <div className={`${KHUNG} md:hidden`}>
          {/* Gốc tạm. FR-63: nói rõ đây KHÔNG phải khẳng định đã là Thuỷ tổ. */}
          <Card className="gap-0 border-dashed py-4">
            <CardBody className="px-4 text-center">
              <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                {mainFragment.rootName}
              </p>
              <p className="mt-1 text-[15px] text-muted-foreground">
                cụ xa nhất hiện biết · đời 1
              </p>
            </CardBody>
          </Card>

          <div className="flex justify-center" aria-hidden>
            <span className="h-6 w-px bg-border" />
          </div>

          <ul className="space-y-3">
            {khoiChi.map((chi) => {
              const laChiCuaToi = chi.id === chiCuaMinhId;
              return (
                <li key={chi.id}>
                  <Link href={chi.href} className="block">
                    <Card
                      className={['gap-0 py-4', laChiCuaToi ? 'ring-2 ring-primary' : ''].join(
                        ' ',
                      )}
                    >
                      <CardBody className="px-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                            {chi.ten}
                          </p>
                          {laChiCuaToi && (
                            <span className="shrink-0 text-[15px] font-semibold text-primary">
                              chi của mình
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[15px] text-muted-foreground">
                          {chi.nguoiDungDau}
                        </p>

                        {/* Hai con số người duyệt chọn đo một chi. Không thêm con số thứ ba —
                            bảng chỉ số càng dài thì càng không ai đọc. */}
                        <dl className="mt-3 flex gap-6">
                          <div>
                            <dt className="text-[15px] text-muted-foreground">đã ghi</dt>
                            <dd className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                              {chi.soNguoi} người
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[15px] text-muted-foreground">còn tồn nghi</dt>
                            <dd className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                              {chi.soTonNghi} người
                            </dd>
                          </div>
                        </dl>
                      </CardBody>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* FR-48: mảnh chưa nối vẽ TÁCH HẲN — không nối vào gốc tạm bằng nét nào. */}
          {manhRoi.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
                Chưa nối được vào đâu
              </h2>
              <ul className="space-y-3">
                {manhRoi.map((m) => (
                  <li key={m.id}>
                    <Link href={m.href} className="block">
                      <Card
                        className="van-ton-nghi gap-0 border-dashed py-4"
                        style={{ borderColor: 'var(--color-tin-ton-nghi)' }}
                      >
                        <CardBody className="px-4">
                          <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                            {m.nhan}
                          </p>
                          <p className="mt-0.5 text-[15px] text-muted-foreground">
                            {m.soNguoi} người · chưa ai tìm ra chỗ nối
                          </p>
                        </CardBody>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[15px] text-muted-foreground">
                Mảnh rời không phải lỗi. Đó là phần dòng họ còn nhớ nhưng chưa nối lại được — và
                nối được một mảnh là việc quý nhất ai cũng làm được.
              </p>
            </section>
          )}
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" tenPha={tenPha} />
    </>
  );
}
