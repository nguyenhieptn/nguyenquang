/**
 * /gia-pha/duong-cua-toi — TẦNG 3: đường huyết thống từ cụ xa nhất hiện biết xuống mình.
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Component Patterns — node người, chip mức tin cậy
 *   · EXPERIENCE.md § Responsive — "Hai màn cố tình KHÔNG nới rộng": một đường huyết thống dọc
 *     không cần bề ngang. MỘT CỘT ở mọi khung — đây là quyết định, không phải thiếu sót.
 *   · EXPERIENCE.md § Accessibility Floor — mã hoá trạng thái không bao giờ chỉ bằng màu
 *   · DESIGN.md § Colors (ba mức tin cậy), § Do's and Don'ts (cấm làm mờ tồn nghi)
 *
 * FR: FR-13 (đường về cụ) · FR-63 (gốc dẫn xuất) · FR-2 (ba mức) · FR-39 (ghi công) · FR-48
 *
 * Vẽ dọc: PRD đòi "mở lên thấy chính mình trước, rồi đi ngược lên" — trục dọc là trục cuộn tự
 * nhiên, cụ ở trên và mình ở dưới cùng: ngón tay đi lên là đi về phía tổ tiên.
 *
 * Vợ/chồng đứng CHUNG THẺ với người mang huyết thống. `getAncestryPath` chưa trả người bạn đời
 * nên trang mượn `getBranchView` của cả mảnh để tra — TODO(core/tree): partners ngay trên
 * AncestryPath thì đỡ một lần dựng cây.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { ChamTinCay, type MucTinCay } from '@/components/pha/tin-cay';
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong, tenPhaTuThongTin } from '@/components/pha/thanh-dieu-huong';
import { coBanLamViec } from '@/lib/vai-quan-tri';
import { getClanInfo, resolveViewer } from '@/core/identity';
import { getAncestryPath, getBranchView, getClanOverview, type PersonCard } from '@/core/tree';
import { dongViTri, nhanNgay } from '../_chia-se/chuyen-doi';

/** Chú giải tại chỗ cho từ phả học, lần đầu nó xuất hiện (DESIGN.md § Do's). */
const GIAI_NGHIA: { muc: MucTinCay; loi: string }[] = [
  { muc: 'chac-chan', loi: 'Có giấy tờ, bia mộ, hoặc phả cũ chép lại.' },
  { muc: 'theo-loi-ke', loi: 'Người trong họ kể lại, chưa có vật chứng.' },
  { muc: 'ton-nghi', loi: 'Còn ngờ, chưa ai xác nhận. Ghi lại để không quên.' },
];

function DongPhu({ n }: { n: PersonCard }) {
  if (!n.lifespan) return null;
  return <p className="mt-0.5 text-[15px] text-muted-foreground">{n.lifespan}</p>;
}

/** Chưa có chỗ trong phả: lời mời, KHÔNG phải màn lỗi (EXPERIENCE § Chưa gắn node). */
async function MoiNhanCho({ tenPha }: { tenPha?: string }) {
  return (
    <>
      <main className="flex-1 pb-28 pt-7 md:pb-8 md:pt-[5.5rem]">
        <div className={DOC}>
          <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Cây gia tộc</h1>
          <div className="mt-6 rounded-md border border-border bg-card px-5 py-6">
            <p className="text-[17px] leading-relaxed">
              Đường về cụ bắt đầu từ chỗ của mình trong phả — mà chỗ ấy chưa nhận. Tìm tên của
              mình để nhận chỗ, rồi cả đường huyết thống sẽ tự hiện ra.
            </p>
            <Link
              href="/tim"
              className="mt-5 inline-block rounded-md border border-input px-5 py-3 text-[17px]"
            >
              Tìm chỗ của mình
            </Link>
          </div>
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" tenPha={tenPha} banLamViec={await coBanLamViec()} />
    </>
  );
}

export default async function Page() {
  const viewer = await resolveViewer();
  // Khách xem được cây chung; còn "đường của mình" thì phải là mình — chưa đăng nhập thì mời vào.
  if (!viewer || !viewer.accountId) redirect('/dang-nhap');

  // AD-14: tên phả đọc từ `clan.settings` qua core/identity, truyền xuống component câm.
  const thongTinPha = await getClanInfo();
  const tenPha = tenPhaTuThongTin(thongTinPha.ok ? thongTinPha.value : null);
  if (!viewer.personId) return <MoiNhanCho tenPha={tenPha} />;

  const duong = await getAncestryPath(viewer.personId);
  if (!duong.ok) {
    if (duong.error.code === 'unauthenticated') redirect('/dang-nhap');
    return <MoiNhanCho tenPha={tenPha} />; // chỗ cũ không còn — mời nhận lại, không phải màn lỗi
  }

  // Cụ xa nhất ở TRÊN, chính mình ở DƯỚI: ngón tay đi lên là đi về phía tổ tiên.
  const cacBac = [...duong.value.steps].reverse();
  const gocId = cacBac[0].personId;

  // Vợ/chồng chung thẻ: tra từ khung nhìn cả mảnh (đầu chi = gốc tạm ⇒ trả trọn mảnh).
  const banDoiCua = new Map<string, PersonCard[]>();
  const manh = await getBranchView(gocId);
  if (manh.ok) {
    for (const g of manh.value.generations)
      for (const cap of g.couples) {
        banDoiCua.set(cap.person.personId, cap.partners);
        for (const p of cap.partners)
          if (!banDoiCua.has(p.personId)) banDoiCua.set(p.personId, [cap.person]);
      }
  }

  // FR-48: trung thực về mảnh chưa nối — đường của mình dừng ở gốc tạm, và còn ngần này mảnh.
  const tongQuan = await getClanOverview();
  const manhRoi = tongQuan.ok ? tongQuan.value.unconnectedFragments : [];
  const nhanhChinh = tongQuan.ok ? tongQuan.value.mainFragment : null;

  return (
    <>
      {/* MỘT CỘT kể cả trên máy — cố ý. Một đường dọc kéo ngang 1280px không đọc dễ hơn,
          chỉ dài dòng hơn (EXPERIENCE § Responsive — hai màn cố tình không nới rộng). */}
      <main className="flex-1 pb-28 pt-7 md:pb-8 md:pt-[5.5rem]">
        <div className={DOC}>
          <header className="mb-6">
            <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Cây gia tộc</h1>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Đường từ {duong.value.steps[0].fullName} ngược lên cụ xa nhất hiện biết
            </p>
            {!duong.value.reachesMainRoot && (
              <p className="mt-2 text-[15px] text-muted-foreground">
                Đường này nằm trong một mảnh chưa nối được vào nhánh chính của dòng họ.
              </p>
            )}
          </header>

          <ol className="space-y-0">
            {cacBac.map((n, i) => {
              const laToi = n.personId === viewer.personId;
              const tonNghi = n.tier === 'tentative';
              const banDoi = banDoiCua.get(n.personId) ?? [];
              return (
                <li key={n.personId}>
                  <Link href={`/nguoi/${n.personId}`} className="block">
                    <Card
                      className={[
                        'gap-0 py-3.5',
                        tonNghi ? 'van-ton-nghi border-dashed' : '',
                        // Vòng son quanh node mình (FR-13) bằng VIỀN, không bằng nền —
                        // nền son sẽ nuốt mất phân biệt chất liệu của tầng tồn nghi.
                        laToi ? 'ring-2 ring-primary' : '',
                      ].join(' ')}
                      style={tonNghi ? { borderColor: 'var(--color-tin-ton-nghi)' } : undefined}
                    >
                      <CardBody className="px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                              {n.fullName}
                              {laToi && (
                                <span className="ml-2 text-[15px] font-semibold text-primary">
                                  mình
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-[15px] text-muted-foreground">
                              {[dongViTri(n), n.lifespan].filter(Boolean).join(' · ')}
                            </p>
                            {/* Vợ/chồng trong CÙNG một thẻ. Một đường huyết thống mà thiếu các
                                cụ bà thì chỉ còn một nửa dòng họ — nửa mà chính phả cũng chép. */}
                            {banDoi.map((b) => (
                              <div key={b.personId} className="mt-2 border-t border-border pt-2">
                                <p className="text-[15px] text-muted-foreground">vợ/chồng</p>
                                <p className="font-[family-name:var(--font-pha)] text-[17px]">
                                  {b.fullName}
                                </p>
                                <DongPhu n={b} />
                              </div>
                            ))}
                            {n.attribution && (
                              <p className="mt-1.5 text-[15px] italic text-primary">
                                {n.attribution.byName} ghi · {nhanNgay(n.attribution.at)}
                              </p>
                            )}
                          </div>

                          {/* Chip mức tin cậy: CHẤM MÀU + CHỮ. Không bao giờ chỉ màu —
                              phải đọc được khi in đen trắng và với người mù màu. */}
                          <span className="shrink-0 whitespace-nowrap">
                            <ChamTinCay muc={n.confidence} />
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>

                  {i < cacBac.length - 1 && (
                    <div className="ml-7 h-5 w-px bg-border" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>

          {/* Chú giải — mỗi từ phả học được giải nghĩa tại chỗ lần đầu xuất hiện. */}
          <section className="mt-8 rounded-md border border-border bg-card px-4 py-4">
            <h2 className="text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
              Ba mức tin cậy
            </h2>
            <dl className="mt-3 space-y-2.5">
              {GIAI_NGHIA.map(({ muc, loi }) => (
                <div key={muc} className="flex items-start gap-2.5">
                  <dt className="pt-0.5">
                    <ChamTinCay muc={muc} />
                  </dt>
                  <dd className="text-[15px] text-muted-foreground">— {loi}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[15px] text-muted-foreground">
              Ô viền nét đứt trên nền vân giấy là{' '}
              <strong className="font-semibold">Tầng tồn nghi</strong> — đã ghi vào phả, chưa
              được duyệt lên Tầng chính thức. Chữ vẫn rõ như mọi ô khác.
            </p>
          </section>

          {/* FR-48: trung thực về mảnh chưa nối. Đếm cả nhánh chính: chúng chưa nối ĐƯỢC VỚI NHAU. */}
          {manhRoi.length > 0 && nhanhChinh && (
            <section className="mt-5 rounded-md border border-dashed border-border px-4 py-4">
              <p className="text-[17px]">
                Còn {manhRoi.length + 1} mảnh chưa nối được với nhau.
              </p>
              <ul className="mt-2 space-y-1">
                <li className="text-[15px] text-muted-foreground">
                  Nhánh cụ {nhanhChinh.rootName} · {nhanhChinh.personCount} người
                </li>
                {manhRoi.map((m) => (
                  <li key={m.rootPersonId} className="text-[15px] text-muted-foreground">
                    Nhánh cụ {m.rootName} · {m.personCount} người
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Nút chính nền son — hành động chính duy nhất của màn (DESIGN.md § Nút). Đường vào
              việc thêm LUÔN qua tìm (FR-48: chặn trùng tại nguồn). */}
          <Link
            href="/tim"
            className="mt-6 block rounded-md bg-primary px-4 py-3.5 text-center text-[17px] text-primary-foreground"
          >
            Thêm người thân
          </Link>
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" tenPha={tenPha} banLamViec={await coBanLamViec()} />
    </>
  );
}
