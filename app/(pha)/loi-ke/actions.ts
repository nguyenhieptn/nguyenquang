'use server';

/**
 * Server actions của màn lời kể — adapter mỏng (AD-1): gọi core, trả nguyên Result cho UI.
 * Danh tính do core tự lấy từ session (AD-24) — không truyền viewer/clan id từ đây xuống.
 *
 * Riêng việc GỬI bản thu không đi qua server action: tệp âm thanh đi bằng multipart FormData
 * tới app/api/media/upload (route đã dựng ở story 1-5) — xem man-thu.tsx.
 */
import { requestPlayback } from '@/core/media';
import { searchPersons, type SearchHit } from '@/core/tree';
import type { Result } from '@/core/types';

/**
 * Xin vé nghe một lời kể (AD-12): core soát mức chia sẻ NGAY LÚC BẤM rồi cấp vé 10 phút.
 * UI nhận token và trỏ <audio> vào /api/media/stream/<token> — không có URL nào khác tới tệp.
 */
export async function xinVeNghe(recordingId: string): Promise<Result<{ token: string }>> {
  return requestPlayback(recordingId);
}

/**
 * Tìm người trong phả cho ô "ai kể" / "nói về những ai" — so khớp không dấu qua core/so-khop
 * (AD-16), đã lọc bán kính riêng tư trước khi rời server.
 */
export async function timNguoi(query: string): Promise<Result<SearchHit[]>> {
  return searchPersons(query);
}
