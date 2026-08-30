/**
 * `/gio` — LỊCH GIỖ cả họ trong một năm tới (FR-41, story 7-5). Bề mặt A, khách xem được: giỗ là của
 * người đã khuất, và người đã khuất là 'full' với mọi người (AD-13).
 *
 * Mỗi dòng: ngày dương sắp tới · tên · ngày âm nhà ghi · mấy ngày nữa. Hai lịch luôn đi cùng nhau
 * (`review-culture.md:677`) — âm là thứ nhà cúng, dương là thứ người ta đặt lịch. Không có kênh đẩy
 * (addendum 10/08): người thật nhắc nhau, trang này để họ có gì mà nhắc.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChanTrang } from '@/components/pha/chan-trang';
import { KHUNG } from '@/components/pha/khung';
import { ThanhDieuHuong, tenPhaTuThongTin } from '@/components/pha/thanh-dieu-huong';
import { TuaMuc } from '@/components/pha/vach';
import { coBanLamViec } from '@/lib/vai-quan-tri';
import { listGioSapToi } from '@/core/gio';
import { getClanInfo } from '@/core/identity';

export const metadata: Metadata = { title: 'Lịch giỗ' };
export const dynamic = 'force-dynamic';

function nhomThang(duong: string): string {
  const [y, m] = duong.split('-');
  return `Tháng ${Number(m)}/${y}`;
}

export default async function GioPage() {
  // 385 ngày, không phải 365: một năm ÂM dài 354–385 ngày dương, nên giỗ vừa qua có lần kế tiếp cách
  // tới 385 ngày — cắt ở 365 là bỏ rơi một phần ba lịch suốt nhiều tuần (code review 7-5).
  const [ds, thongTin, banLamViec] = await Promise.all([listGioSapToi(385), getClanInfo(), coBanLamViec()]);
  const tenPha = tenPhaTuThongTin(thongTin.ok ? thongTin.value : null);
  const gio = ds.ok ? ds.value : [];
  const theoThang = new Map<string, typeof gio>();
  for (const g of gio) {
    const k = nhomThang(g.duong);
    const arr = theoThang.get(k);
    if (arr) arr.push(g);
    else theoThang.set(k, [g]);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ThanhDieuHuong hienTai="gia-pha" tenPha={tenPha} banLamViec={banLamViec} />
      <main className={`${KHUNG} flex-1 pt-9 md:pt-16`}>
        <h1 className="font-[family-name:var(--font-pha)] text-[29px] font-semibold leading-tight">Lịch giỗ</h1>
        <p className="mt-3 max-w-[60ch] text-[17px] text-muted-foreground">
          Ngày giỗ ghi theo âm lịch như nhà vẫn cúng; ngày dương bên cạnh là lần giỗ sắp tới. Trọn một
          năm âm, tính từ hôm nay.
        </p>
        {!ds.ok ? (
          <p className="mt-8 text-[17px] text-muted-foreground">
            {ds.error.code === 'unauthenticated' ? 'Phả chưa được dựng — chưa có lịch giỗ nào để xem.' : 'Chưa đọc được lịch giỗ. Thử lại sau một lát.'}
          </p>
        ) : gio.length === 0 ? (
          <p className="mt-8 max-w-[60ch] text-[17px] text-muted-foreground">
            Chưa ghi ngày giỗ của ai. Mở <Link href="/gia-pha" className="underline underline-offset-4">Phả quanh mình</Link>,
            chạm một người đã khuất, ở phiếu có mục <em>Giỗ</em> để ghi — nếu đã biết ngày mất thì phả
            gợi ý sẵn ngày âm.
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-8">
            {[...theoThang.entries()].map(([thang, ds]) => (
              <section key={thang}>
                <TuaMuc>{thang}</TuaMuc>
                <ul className="mt-4 divide-y divide-border">
                  {ds.map((g) => (
                    <li key={`${g.personId}-${g.ngay}/${g.thang}${g.nhuan ? 'n' : ''}`} className="grid grid-cols-[6.5rem_1fr] gap-x-4 py-3">
                      <p className="text-[17px] tabular-nums">
                        {g.chuoiDuong.slice(0, 5)}
                        <span className="block text-[15px] text-muted-foreground">
                          {g.conNgay === 0 ? 'hôm nay' : `còn ${g.conNgay} ngày`}
                        </span>
                      </p>
                      <p className="min-w-0 text-[17px]">
                        <Link
                          href={`/nguoi/${g.personId}`}
                          className="inline-flex min-h-11 items-center font-[family-name:var(--font-pha)] font-semibold underline-offset-4 hover:underline"
                        >
                          {g.fullName}
                        </Link>
                        <span className="block text-[15px] text-muted-foreground">
                          {g.cau.replace(/ — sắp tới: [^(]*/, '')}
                          {g.tier === 'tentative' ? ' · tồn nghi' : ''}
                          {g.mauThuan ? ' · hai ngày khai khác nhau, ban tu phả đang xem' : ''}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
      <ChanTrang />
    </div>
  );
}
