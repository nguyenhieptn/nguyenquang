/**
 * CẢNH BÁO CỦA BỘ NẠP KHUNG — từ vựng dùng chung, module THUẦN (story 6-3).
 *
 * ── Vì sao có file này ──────────────────────────────────────────────────────────────────────
 * Cảnh báo của một lượt nạp khung đi ra HAI bề mặt: màn `/admin/nap-khung` và script vận hành
 * `scripts/seed-from-sheet.ts`. Trước 26/08/2026 bề mặt thứ hai không in cảnh báo một chữ nào,
 * nên một cụ tổ mất cha được tính đúng ở `previewSeedOp` rồi biến mất khỏi màn hình. Gộp từ
 * vựng về một chỗ là cách để lần sau thêm một loại cảnh báo thì cả hai bề mặt cùng biết.
 *
 * ── Vì sao ở `components/admin/` mà script cũng import ──────────────────────────────────────
 * Bảng nhãn phải nằm nơi một **client component** import được, và mọi module từ vựng thuần của
 * bàn quản trị đã sống ở đây. Script là node nên import được, và nó theo về đây chứ không dựng
 * bảng nhãn thứ hai.
 *
 * ── `import type`, không chép tay (sửa 27/08 sau code review) ───────────────────────────────
 * Bản đầu chép tay lại `SeedRowWarning` với lý do *"`components/` không import `@/core/*`"* —
 * **luật ấy không tồn tại**. `docs/build-contract.md:25-26` cấm `@/db`, `drizzle-orm`, `pg`, và
 * ruột core (đường `ops` bên trong mỗi module); bề mặt `@/core/<module>` thì ĐƯỢC PHÉP, và
 * `nap-khung-client.tsx` (`'use client'`) đang `import type` từ `@/core/seed` ngay trong nó.
 *
 * (Chú thích này cố ý không viết đường dẫn ruột core ra nguyên văn: chuỗi ấy chứa `*` rồi `/`,
 * tức nó tự đóng khối chú thích. Repo đã vấp đúng chỗ ấy một lần ở story 6-1.)
 *
 * `import type` bị xoá lúc biên dịch nên không kéo `pg` vào bó nào (đó mới là cái bẫy thật của
 * story 6-7 — nó là `import` GIÁ TRỊ). Và nó chặn trôi cả HAI chiều, trong khi bản chép tay chỉ
 * chặn được chiều thêm loại.
 */
import type { SeedRowWarning } from '@/core/seed';

/** Tên bề mặt của `SeedRowWarning` — một bí danh, không phải một bản sao. */
export type LoaiCanhBao = SeedRowWarning;

/**
 * `tieuDe` nói **bot thấy gì**; `mat` nói **cái gì mất**. Hai vế, vì vế thứ hai mới là thứ người
 * vận hành cần để quyết — và là vế mà mọi lần hỏng im lặng của bộ nạp khung đều giấu đi.
 */
export const NHAN_CANH_BAO: Record<LoaiCanhBao, { tieuDe: string; mat: string }> = {
  'father-not-found': {
    tieuDe: 'không tìm thấy người cha',
    mat: 'người này vào phả không có cha, thành gốc tạm của một mảnh',
  },
  'father-ambiguous': {
    tieuDe: 'có hơn một người mang đúng tên cha ấy',
    mat: 'máy không đoán, nên người này cũng vào phả không có cha',
  },
  'spouse-not-found': {
    tieuDe: 'không tìm thấy người vợ/chồng',
    mat: 'hai người này sẽ không thành vợ chồng trong phả, không union nào được ghi',
  },
  'spouse-ambiguous': {
    tieuDe: 'có hơn một người mang đúng tên vợ/chồng ấy',
    mat: 'máy không đoán, nên cũng không ghi được mối vợ chồng',
  },
  'skip-drops-edges': {
    tieuDe: 'dòng đang được để lại, mà có quan hệ dính vào nó',
    mat: 'bỏ một dòng là bỏ luôn mọi mối nối dòng ấy khai VÀ mọi mối nối khai về nó',
  },
  'father-skipped': {
    tieuDe: 'người cha CÓ trong tệp, nhưng dòng ấy đang được để lại',
    mat: 'cạnh cha–con không được ghi — tích lại dòng của người cha là xong',
  },
  'spouse-skipped': {
    tieuDe: 'người vợ/chồng CÓ trong tệp, nhưng dòng ấy đang được để lại',
    mat: 'union không được ghi — tích lại dòng của người ấy là xong',
  },
  'duplicate-in-file': {
    tieuDe: 'trùng tên với một dòng khác trong chính tệp',
    mat: 'chưa biết hai dòng là một người hay hai người — cần người chọn',
  },
};

/** Một câu cho bản in của script vận hành: *"không tìm thấy người cha — …"*. */
export function cauCanhBao(loai: LoaiCanhBao): string {
  const n = NHAN_CANH_BAO[loai];
  return `${n.tieuDe} — ${n.mat}`;
}

/**
 * Cảnh báo ĐANG ĐÚNG của một dòng: bản tính lại theo quyết định hiện hành nếu đã có, không thì
 * bản mù của lượt xem trước đầu tiên.
 *
 * ── Hai cái bẫy mà hàm này tồn tại để tránh ────────────────────────────────────────────────
 * 1. **`[]` là một câu trả lời, không phải "chưa có".** Bỏ một dòng cha thừa thì dòng con hết
 *    sạch cảnh báo — và đó chính là tin cần bày. Rơi về bản mù ở đây là bày lại đúng cái cảnh
 *    báo vừa được gỡ. Nên chỉ vắng KHOÁ mới rơi về, `[]` thì giữ nguyên `[]`.
 * 2. **Bản tính lại KHÔNG được chảy ngược vào `macDinhCua`.** Màn Nạp khung suy *quyết định* ra
 *    từ *phân loại + cảnh báo mù*; nếu cảnh báo tính lại quay ngược vào mặc định thì mỗi lần
 *    bấm một nút radio sẽ đổi mặc định của chính dòng ấy — một vòng lặp. Vì thế bản tính lại
 *    sống ở một map RIÊNG (`capNhat`), không bao giờ được ghi đè vào `dong.canhBao`.
 */
export function canhBaoHienHanh(
  goc: readonly LoaiCanhBao[],
  capNhat: Readonly<Record<number, readonly LoaiCanhBao[]>> | null,
  index: number,
): readonly LoaiCanhBao[] {
  return capNhat?.[index] ?? goc;
}

/**
 * HƯỚNG MẶC ĐỊNH của một dòng — luật của MÀN Nạp khung, một bản, hai nơi dịch.
 *
 * `nap-khung-client.tsx` dịch nó ra `SeedDecision` để bày ô tích; `app/admin/nap-khung/
 * actions.ts` dịch cùng một hướng ấy ra bộ quyết định để chạy lượt xem trước THỨ HAI. Trước khi
 * gom về đây, hai bên có thể trôi khỏi nhau — mà lệch nhau thì màn bày cảnh báo của một lượt ghi
 * không phải lượt ghi sắp chạy, đúng cái bệnh story 6-3 sinh ra để chữa.
 *
 * `chua-quyet` KHÔNG phải "tạo mới": FR-48 — bot gợi ý, không tự quyết. Nhưng khi chỉ dùng để
 * TÍNH CẢNH BÁO thì nó rơi về mặc định của core (`create`), vì đó là điều sẽ xảy ra nếu người
 * vận hành tích ô ấy, và cũng là giả định của lượt xem trước mù.
 *
 * `de-lai` cho mọi dòng mang cảnh báo: ghi hàng loạt không được cuốn theo một dòng chưa ai nhìn
 * tới. Chú ý — luật này đọc cảnh báo MÙ, không đọc bản tính lại theo quyết định (xem
 * `canhBaoHienHanh`), kẻo bấm một nút lại đổi mặc định của chính dòng vừa bấm.
 *
 * Script `scripts/seed-from-sheet.ts` cố ý KHÔNG dùng luật này: ở đó không có ai để tích ô, nên
 * "để lại mọi dòng có cảnh báo" sẽ lặng lẽ bỏ rơi người. Nó chỉ để lại dòng nghi trùng.
 */
export type HuongMacDinh = 'chua-quyet' | 'de-lai' | 'noi-vao-ung-vien' | 'tao-moi';

/**
 * Cảnh báo nào đủ nặng để BỎ TÍCH sẵn một dòng — chốt 27/08/2026 sau code review.
 *
 * ── Vì sao không phải "mọi cảnh báo" như bản đầu ────────────────────────────────────────────
 * Story 6-3 thêm `spouse-not-found`, và nó bắt tay với luật cũ *"có cảnh báo thì bỏ tích"* thành
 * một hồi quy đo được trên **chính tệp mẫu sản phẩm phát ra**: `ten_vo_chong` trỏ tới người
 * không có dòng riêng — hình dạng thường gặp nhất của bảng tính chép tay, và là hình dạng tệp
 * mẫu dạy — nên dòng ấy bị bỏ tích, và tệp hai dòng chỉ ghi được một, không cạnh nào.
 *
 * Chủ dự án chốt: **chỉ `spouse-*` thôi bỏ tích**, `father-*` giữ nguyên như cũ. Lý do đứng
 * được: thiếu cha đổi CẤU TRÚC cây — người ấy thành gốc tạm của một mảnh mới, một chuyện đáng
 * bắt dừng lại nhìn; thiếu vợ/chồng chỉ mất một union, không đổi hình cây.
 *
 * `skip-drops-edges` · `father-skipped` · `spouse-skipped` không bao giờ có mặt trong lượt MÙ
 * (chúng đòi một dòng đang bị `skip`), nên chúng đứng ngoài bảng này theo định nghĩa.
 */
const BO_TICH: readonly LoaiCanhBao[] = ['father-not-found', 'father-ambiguous', 'duplicate-in-file'];

export function huongMacDinh(a: {
  nghiTrung: boolean;
  khopNguoiCoSan: boolean;
  coUngVien: boolean;
  /** Cảnh báo MÙ của lượt xem trước đầu tiên. */
  canhBao: readonly LoaiCanhBao[];
}): HuongMacDinh {
  if (a.nghiTrung) return 'chua-quyet';
  if (a.canhBao.some((c) => BO_TICH.includes(c))) return 'de-lai';
  if (a.khopNguoiCoSan && a.coUngVien) return 'noi-vao-ung-vien';
  return 'tao-moi';
}
