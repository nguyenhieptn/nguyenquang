/**
 * /loi-ke/thu — vỏ server của màn thu (FR-47, FR-49).
 *
 * Soát trạng thái NGAY Ở CỬA, trước khi ai kịp bấm thu: để một người thu sáu phút chuyện của
 * cụ rồi mới báo "chưa gửi được" là đối xử tệ với dữ liệu không tái tạo được. Vì thế:
 *   · chưa đăng nhập → redirect /dang-nhap (quay lại thu sau khi có phiên);
 *   · có tài khoản, chưa gắn node → lời mời gắn vào phả NGAY TẠI ĐÂY, không phải màn lỗi
 *     (EXPERIENCE.md § State Patterns — trạng thái thường trực, mọi màn phải xử được).
 * Màn thu (man-thu.tsx) vẫn xử lại hai mã ấy lúc gửi — phiên có thể hết giữa chừng — nhưng
 * lúc đó blob đã nằm trong tay và không bị bỏ.
 *
 * ⚠️ NỢ TÀI LIỆU (giữ từ prototype): hành trình gốc của việc này (UJ-1 — bà Nhàn 84 tuổi, cháu
 * Quân) đã mất khi PRD được viết lại. PRD từng gắn nhãn đây là hành trình quan trọng nhất của
 * sản phẩm. Màn dựng từ § IA và § Interaction Primitives, KHÔNG từ một câu chuyện có thật —
 * nên nó đúng luật mà chưa chắc đúng nhịp. Cần người duyệt kể lại một lần thu thật.
 */
import { redirect } from 'next/navigation';
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong, tenPhaTuThongTin } from '@/components/pha/thanh-dieu-huong';
import { coBanLamViec } from '@/lib/vai-quan-tri';
import { getClanInfo, resolveSession } from '@/core/identity';
import { getPerson } from '@/core/person';
import type { NguoiDaChon } from './chon-nguoi';
import { MoiGanVaoPha } from '../moi-gan';
import { ManThu } from './man-thu';

export const metadata = { title: 'Thu lời kể' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ve?: string | string[] }>;
}) {
  const session = await resolveSession();
  if (!session) redirect('/dang-nhap');

  // AD-14: tên phả từ `clan.settings`, không phải hằng trong mã.
  const thongTinPha = await getClanInfo();
  const tenPha = tenPhaTuThongTin(thongTinPha.ok ? thongTinPha.value : null);

  // ?ve=<id> — "Kể về người này" từ trang một người: chọn sẵn người ấy trong ô "nói về những
  // ai". Tên tra qua core/person (đã lọc bán kính); người được giữ kín thì KHÔNG chọn sẵn —
  // chọn sẵn một nhãn giữ chỗ là vô nghĩa với người đang thu.
  const { ve } = await searchParams;
  let noiVeSan: NguoiDaChon[] = [];
  if (typeof ve === 'string' && ve && session.personId !== null) {
    const nguoi = await getPerson(ve);
    if (nguoi.ok && nguoi.value.visibility !== 'anonymous') {
      const the = nguoi.value.card;
      const moTa = [
        the.generation !== null ? `đời ${the.generation}` : null,
        the.branchCode ? `chi ${the.branchCode}` : null,
        the.generation === null && !the.branchCode && the.lifespan ? the.lifespan : null,
      ]
        .filter(Boolean)
        .join(' · ');
      noiVeSan = [{ personId: the.personId, fullName: the.fullName, moTa }];
    }
  }

  return (
    <>
      <main className={`${DOC} pb-28 pt-9 md:pb-16 md:pt-32`}>
        {session.personId !== null ? (
          <ManThu noiVeSan={noiVeSan} />
        ) : (
          <MoiGanVaoPha viecMuonLam="Thu lời kể" />
        )}
      </main>
      <ThanhDieuHuong hienTai="loi-ke" tenPha={tenPha} banLamViec={await coBanLamViec()} />
    </>
  );
}
