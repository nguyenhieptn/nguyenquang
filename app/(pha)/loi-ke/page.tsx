/**
 * SỔ LỜI KỂ — danh sách bản thu (FR-47), promote từ màn "ĐÃ THU" của prototype thu-loi-ke.
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § IA — "Thu lời kể | FR-47, FR-49" · § Voice and Tone (không xưng hô)
 *   · DESIGN.md § Colors (son khan hiếm — chỉ nút Thu lời kể được mang) · § Elevation (không bóng)
 *   · AD-12 — mức tiếp cận soát trong core: danh sách này ĐÃ lọc trước khi rời server,
 *     màn chỉ bày cái core cho phép, không tự che thêm bằng CSS.
 *
 * Trạng thái tiếp cận bằng CHỮ + CHẤT LIỆU, không bao giờ chỉ bằng màu:
 *   · niêm phong = ô viền NÉT ĐỨT + dòng chữ "Niêm phong tới …" — mượn đúng ngôn ngữ thị giác
 *     "chưa mở được" của tồn nghi, nhưng không dùng vân chéo (vân chéo là dấu riêng của tồn nghi).
 *   · đã rút lại = chữ nói thẳng, không nút nghe.
 *
 * Tổng số bản · tổng giờ là chỉ số M3 của PRD §9, không phải trang trí — giữ từ prototype.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Mic } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';
import { listRecordings, type RecordingMeta } from '@/core/media';
import { resolveSession } from '@/core/identity';
import { doDai, ngayVN } from './dinh-dang';
import { MoiGanVaoPha } from './moi-gan';
import { NgheLoiKe } from './nghe';

export const metadata = { title: 'Lời kể' };

/** Nhãn mức tiếp cận (FR-49) — chữ trước, chất liệu kèm theo ở ô. */
function nhanTiepCan(l: RecordingMeta): string {
  if (l.withdrawn) return 'Đã rút lại — không phát cho bất kỳ ai';
  if (l.accessTier === 'sealed') {
    return `Niêm phong tới ${l.sealedUntil ? ngayVN(l.sealedUntil) : 'ngày chưa rõ'}`;
  }
  if (l.accessTier === 'admin') return 'Chỉ người trông coi phả nghe';
  return 'Cả họ nghe được';
}

function OLoiKe({ l }: { l: RecordingMeta }) {
  const niemPhong = l.accessTier === 'sealed' && !l.withdrawn;
  const tenDong = l.title || (l.toldByName ? `${l.toldByName} kể` : 'Lời kể trong họ');
  return (
    <li>
      {/* Niêm phong = nét đứt: ô đang đóng, và nét vẽ nói điều đó cùng dòng chữ bên dưới. */}
      <Card className={`gap-0 py-3.5 ${niemPhong ? 'border border-dashed border-tin-ton-nghi ring-0' : ''}`}>
        <CardBody className="px-4">
          <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">{tenDong}</p>
          <p className="mt-0.5 text-[15px] text-muted-foreground">
            {[
              l.title && l.toldByName ? `${l.toldByName} kể` : null,
              l.durationSeconds ? doDai(l.durationSeconds) : null,
              ngayVN(l.recordedOn),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="mt-1.5 text-[15px]">{nhanTiepCan(l)}</p>
          {l.subjectPersonIds.length > 0 && (
            // TODO(core): danh sách chỉ mang id người được nhắc tới — chưa có API core đọc thẻ
            // người theo id (core/person chưa có index.ts). Khi có, thay dòng đếm bằng tên thật.
            <p className="mt-1.5 text-[15px] text-muted-foreground">
              Nhắc tới {l.subjectPersonIds.length} người trong phả
            </p>
          )}
          {l.playable ? (
            <NgheLoiKe recordingId={l.recordingId} />
          ) : (
            !l.withdrawn && (
              <p className="mt-2 text-[15px] text-muted-foreground">Chưa tới ngày mở — chưa ai nghe được.</p>
            )
          )}
        </CardBody>
      </Card>
    </li>
  );
}

export default async function Page() {
  const session = await resolveSession();
  if (!session) redirect('/dang-nhap');

  // Lời kể là chất liệu của người trong họ: tài khoản chưa gắn node thì mọi đường ở đây —
  // nghe lẫn thu — đều dẫn về luồng gắn node, không phải màn lỗi. Người trông coi phả
  // (admin/trưởng chi) vẫn vào được dù chưa gắn: họ giữ sổ.
  const duocXem =
    session.personId !== null || session.role === 'admin' || session.role === 'branch-head';

  let dsLoiKe: RecordingMeta[] = [];
  if (duocXem) {
    const kq = await listRecordings();
    // Lỗi đọc khác 'unauthenticated' (đã chặn trên): vắng lặng — bày sổ rỗng, không banner lỗi.
    if (kq.ok) dsLoiKe = kq.value;
  }

  const tongGiay = dsLoiKe.reduce((s, l) => s + (l.durationSeconds ?? 0), 0);

  return (
    <>
      {/* Prototype không có ChanTrang — màn này là một cái sổ, không phải trang bìa. */}
      <main className={`${DOC} pb-28 pt-9 md:pb-16 md:pt-32`}>
        {!duocXem ? (
          <MoiGanVaoPha viecMuonLam="Nghe và thu lời kể" />
        ) : (
          <section>
            <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Lời kể</h1>
            {dsLoiKe.length > 0 ? (
              <p className="mt-1 text-[17px] text-muted-foreground">
                {dsLoiKe.length} bản · {(tongGiay / 3600).toFixed(1)} giờ
              </p>
            ) : (
              <p className="mt-2 text-[17px] leading-relaxed">
                Chưa có bản nào trong sổ. Mỗi lời các cụ kể là một thứ không ghi lại được lần
                thứ hai — nghe được câu nào, dòng họ giữ được câu ấy.
              </p>
            )}

            {/* Nút to duy nhất mang son của màn — hành động chính, việc có hạn dùng. */}
            <Link
              href="/loi-ke/thu"
              className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-md bg-primary px-6 text-primary-foreground"
            >
              <Mic size={22} strokeWidth={2} aria-hidden />
              <span className="text-[19px] font-semibold">Thu lời kể</span>
            </Link>

            {dsLoiKe.length > 0 && (
              <>
                <ul className="mt-7 grid gap-3">
                  {dsLoiKe.map((l) => (
                    <OLoiKe key={l.recordingId} l={l} />
                  ))}
                </ul>
                {/* Nói thẳng việc còn lại thay vì im lặng — im lặng khiến người đi thu tưởng
                    mình còn phải làm gì nữa mới xong (giữ từ prototype). */}
                <p className="mt-5 text-[15px] text-muted-foreground">
                  Bóc tách lời kể thành các dòng trong phả là việc để sau — bản thu đưa vào sổ là
                  đã an toàn.
                </p>
              </>
            )}
          </section>
        )}
      </main>
      <ThanhDieuHuong hienTai="loi-ke" tenPha="Nguyễn Quang" />
    </>
  );
}
