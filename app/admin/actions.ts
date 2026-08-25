'use server';

/**
 * Server action của khung `/admin`.
 *
 * Chỉ chuyển tiếp vào core (build-contract § Phân tầng): core tự đọc phiên (AD-24) và tự lọc
 * bán kính riêng tư (AD-13/AD-21) — action không thêm gì, không nới gì. Bàn làm việc KHÔNG có
 * đường tìm rộng hơn phần phả người vận hành được phép xem.
 */
import { searchPersons } from '@/core/tree';
import type { KetQuaTim } from '@/components/admin/man-admin';

/**
 * Tìm người cho ô tìm trên thanh trên. Trả MẢNG chứ không trả `Result`: ô tìm ở đây không có
 * chỗ bày lời lỗi, và mọi mã lỗi của `searchPersons` (chưa đăng nhập, từ khoá quá ngắn) đều
 * quy về cùng một cảnh trên màn — không có ai hiện ra. Trang vẫn đứng, không băng-rôn lỗi.
 */
export async function timNguoi(tuKhoa: string): Promise<KetQuaTim[]> {
  const ketQua = await searchPersons(tuKhoa);
  /**
   * NÉM, không trả mảng rỗng.
   *
   * Rỗng ở đây có nghĩa xác định: *"đã tìm, phần phả anh xem được không có ai tên ấy"*. Một lượt
   * đọc HỎNG không biết điều đó — nó không biết gì cả. Quy nó về rỗng là dạy người vận hành một
   * câu sai, và đúng là câu họ sẽ tin: họ đi tạo người mới cho một người đã có trong phả.
   *
   * Cùng luật `null` ≠ `0` mà các số trên thanh việc phải theo (5-1): "chưa đọc được" và "không
   * có" là hai trạng thái, và giao diện đã có sẵn hai câu cho chúng. Ném ra thì `.catch` ở
   * `components/admin/khung-admin.tsx` nhận và nói đúng câu thứ hai.
   */
  if (!ketQua.ok) throw new Error(ketQua.error.message);
  return ketQua.value.slice(0, 8).map((h) => ({
    personId: h.personId,
    hoTen: h.fullName,
    // Cái phân biệt hai người trùng tên — trong một dòng họ, trùng tên là chuyện thường.
    nguCanh: [
      h.generation != null ? `đời ${h.generation}` : null,
      h.branchCode ? `chi ${h.branchCode}` : null,
      h.lifespan || null,
    ]
      .filter(Boolean)
      .join(' · '),
  }));
}
