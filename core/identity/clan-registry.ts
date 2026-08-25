/**
 * Single-clan era clan registry (story 1-4; nguồn đổi 25/08/2026).
 *
 * ── Trước: biến môi trường. Nay: database ───────────────────────────────────────────────────
 * Bản đầu đọc `GIAPHA_CLAN_ID` từ `.env`, vì RLS trên `clan` fail closed (AD-20) nên vai ứng
 * dụng không liệt kê nổi dòng họ nào — câu "triển khai này phục vụ ai?" không trả lời được từ
 * database. Cái giá là MỘT SỰ THẬT CHÉP RA HAI NƠI: id nằm trong DB, bản sao nằm trong `.env`,
 * và phải tự tay giữ cho khớp. Mỗi lần dựng lại là một lần lệch.
 *
 * Migration `0002_clan_directory.sql` mở `SELECT` trên riêng bảng `clan` — bảng ấy chứa dữ liệu
 * về DÒNG HỌ (tên · họ · chữ đệm · đề từ), không chứa dữ liệu về NGƯỜI. Mọi lối GHI vẫn buộc
 * `id = current_clan_id()`, và mười bảng phân vùng giữ nguyên fail-closed. Nên nay id đọc thẳng
 * từ nguồn duy nhất, và `.env` hết một biến phải trông chừng.
 *
 * `GIAPHA_CLAN_ID` vẫn đọc được, nhưng nay chỉ là CHỐT GHIM tuỳ chọn cho trường hợp có nhiều
 * dòng họ (thực tế: test). Không còn là cấu hình bắt buộc, và `create-admin.ts` không ghi nó.
 *
 * ── Vì sao KHÔNG memo hoá ──────────────────────────────────────────────────────────────────
 * Đây là một lượt `SELECT` trên bảng bốn cột thường chỉ có một dòng, và cả hai chỗ gọi
 * (`resolveSessionImpl`, `guestContextImpl`) đã nằm trong `cache()` theo request, nên tối đa hai
 * lượt mỗi request. Memo ở tầng module thì phải nhớ dọn — và chính gate RLS tạo rồi xoá dòng họ
 * giữa các bài test, nên một cache quên dọn sẽ hỏng đúng chỗ khó tìm nhất.
 */
import { asc } from 'drizzle-orm';
import { dbGlobal } from '@/db';
import { clan } from '@/db/schema';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Dòng họ mà triển khai này phục vụ, hoặc `null` khi chưa bootstrap.
 *
 * Nhiều hơn một dòng họ thì NÉM, không đoán. Thời single-clan (PRD NFR-7) chưa có màn chọn dòng
 * họ, nên chọn bừa một cái là phục vụ nhầm người trong im lặng — hỏng tệ hơn hẳn một lỗi nói rõ.
 * Đây cũng chính là chỗ việc nhiều-dòng-họ sẽ bắt đầu: `resolveSessionImpl` lấy clan từ
 * `attachment` của tài khoản, còn khách thì chọn qua subdomain hoặc đoạn đường dẫn.
 */
export async function soleClanId(): Promise<string | null> {
  /**
   * `GIAPHA_CLAN_ID` KHÔNG còn là cấu hình — `.env` không cần nó, `create-admin.ts` không ghi
   * nó nữa. Nó sống sót đúng một vai: CHỐT GHIM khi database có nhiều hơn một dòng họ, mà tình
   * huống ấy hôm nay chỉ xảy ra trong test — `identity.test.ts` dựng dòng họ tạm của riêng nó
   * cạnh dòng họ thật, và phải ghim được để biết mình đang hỏi về cái nào.
   */
  const ghim = process.env.GIAPHA_CLAN_ID;
  if (ghim && UUID_RE.test(ghim)) return ghim;

  // `asc(createdAt)`: khi chưa ghim thì dòng họ ĐẦU TIÊN của triển khai thắng — một thứ tự ổn
  // định, không phải thứ Postgres tình cờ trả về trước.
  const rows = await dbGlobal
    .select({ id: clan.id })
    .from(clan)
    .orderBy(asc(clan.createdAt))
    .limit(2);
  if (rows.length === 0) return null;

  /**
   * Nhiều hơn một dòng họ: LẤY DÒNG HỌ ĐẦU TIÊN, không ném (sửa 25/08 sau code review).
   *
   * Bản đầu ném một `Error`, và đó là một quyết định sai ở đúng chỗ nguy hiểm nhất: hàm này chạy
   * trên MỌI request qua `resolveSessionImpl` và `guestContextImpl`, cả hai bọc trong `cache()`
   * không có `catch`. Mà chính bộ test tạo dòng họ thứ hai bên cạnh dòng họ thật — một lượt test
   * bị ngắt giữa chừng là để lại trạng thái ấy, và **trang chủ công khai 500** cho mọi khách.
   *
   * Mọi bề mặt core đều xử được `null`; không bề mặt nào xử được một cú ném. Nên ở đây trả về một
   * câu trả lời xác định, và cảnh báo ra log cho người vận hành — chứ không đánh sập sản phẩm để
   * bắt họ chú ý.
   */
  if (rows.length > 1) {
    console.warn(
      '[clan-registry] Database có nhiều hơn một dòng họ. Đang phục vụ dòng họ đầu tiên ' +
        `(${rows[0]!.id}). Đặt GIAPHA_CLAN_ID để ghim rõ, hoặc xem ARCHITECTURE-SPINE ` +
        '§ Multi-clan onboarding.',
    );
  }
  return rows[0]!.id;
}
