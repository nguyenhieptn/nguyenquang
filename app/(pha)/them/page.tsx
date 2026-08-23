/**
 * THÊM VÀO PHẢ — bước 1 / 4: "Người muốn thêm là ai?"
 *
 * Tự khai 4 bước (story 2-3, FR-11) và thêm người thân (story 2-5, FR-3, FR-55) là MỘT luồng,
 * rẽ nhánh ngay ở câu đầu: "Chính mình" = tự khai; còn lại = thêm người thân cho mình.
 *
 * Spine chi phối (thừa từ prototype `them-nguoi-than`, git 8fd4af1^):
 *   · EXPERIENCE.md § Interaction Primitives — "Một câu hỏi một màn. RÀNG BUỘC CỨNG."
 *   · EXPERIENCE.md § Key Flows — Luồng 1 (vào thẳng Tầng tồn nghi, hiện ngay)
 *   · NFR-5 — thêm một người ≤ 4 màn, ≤ 3 phút.
 *
 * ── NGÂN SÁCH MÀN, ĐẾM CHO ĐÚNG ─────────────────────────────────────────────
 * NFR-5 cho phép 4 màn. Bốn câu dùng hết đúng ngân sách ấy: QUAN HỆ (để nối) → TÊN (để gọi,
 * kèm năm sinh/giới tính gập dưới "Thêm chi tiết") → NỐI VÀO AI (để đứng đúng chỗ trên cây)
 * → XÁC NHẬN (đọc lại một câu + NGUỒN, FR-1). Câu nguồn của prototype không mất — nó đứng
 * trên màn xác nhận, vì hỏi nguồn khi người khai vừa kể xong là lúc câu ấy đọc ra tự nhiên.
 * Màn "đã ghi vào phả" ở cuối KHÔNG tính vào ngân sách: nó không hỏi gì, nó trả công.
 *
 * Hỏi quan hệ TRƯỚC tên vì nó quyết định người mới nối vào đâu; hỏi sau thì phải quay lại.
 *
 * Trạng thái giữa các bước nằm trong URL (xem _chung/luong.ts) — nút lui của trình duyệt
 * là nút lui của luồng, không cần JS nào.
 */
import type { Metadata } from 'next';
import { CauHoi, KhungThem, Nhip, OChonDuong } from './_chung/khuon';
import { duongBuoc, type QuanHe } from './_chung/luong';

export const metadata: Metadata = { title: 'Thêm vào phả' };

const LUA_CHON: { qh: QuanHe; nhan: string; phu?: string }[] = [
  // Tự khai đứng ĐẦU: FR-11 là vòng lặp cốt lõi, và người mới tới thường tới vì chính mình.
  { qh: 'minh', nhan: 'Chính mình', phu: 'tự khai — ghi tên mình vào phả' },
  { qh: 'bo', nhan: 'Bố' },
  { qh: 'me', nhan: 'Mẹ' },
  { qh: 'vo-chong', nhan: 'Vợ hoặc chồng' },
  { qh: 'con', nhan: 'Con' },
  // Gộp "anh hoặc chị"/"em" của prototype làm một: phép nối giống hệt nhau (cùng bố mẹ),
  // tách đôi chỉ thêm một lần đắn đo mà không thêm thông tin nào cho phả.
  { qh: 'anh-chi-em', nhan: 'Anh, chị hoặc em', phu: 'cùng bố mẹ' },
];

/**
 * `ten` đến từ đường tạo của màn tìm (`/them?ten=…`, app/(pha)/tim): người vừa gõ một cái tên,
 * không thấy ai, và bấm "thêm người này". Cái tên ấy phải sống qua bước 1 sang bước 2 — bắt gõ
 * lại đúng cái vừa gõ là chỗ người ta bỏ dở, và nó phá luôn ngân sách 3 phút của NFR-5.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ten?: string | string[] }>;
}) {
  const sp = await searchParams;
  const thoTen = Array.isArray(sp.ten) ? sp.ten[0] : sp.ten;
  const ten = thoTen?.trim() || undefined;

  return (
    <KhungThem>
      <section>
        <Nhip so={1} />
        <CauHoi>Người muốn thêm là ai?</CauHoi>
        <div className="mt-5 grid gap-2.5">
          {LUA_CHON.map((c) => (
            <OChonDuong key={c.qh} href={duongBuoc('/them/ten', { qh: c.qh, ten })} phu={c.phu}>
              {c.nhan}
            </OChonDuong>
          ))}
        </div>
        {/* Xem không cần đăng nhập; tới bước GHI mới cần xác thực (Luồng 1 bước 4) — nói
            trước ở đây thì thừa, nói tại chỗ cần thì đúng lúc. Nên màn này im lặng về auth. */}
      </section>
    </KhungThem>
  );
}
