/**
 * Dữ liệu mock dùng chung cho các màn UI Workshop.
 *
 * Thư mục `_mock` có tiền tố `_` nên Next KHÔNG coi là route (private folder). Mọi màn dựng thử
 * import từ đây để cả xưởng đọc như MỘT hệ thống nhất quán — cùng một thực thể, thay vì mỗi màn
 * bịa dữ liệu riêng. Khi dev promote một màn ra route thật, đây chính là chỗ bị thay bằng truy
 * vấn dữ liệu thật (Prisma/API). Hình dạng dưới bám domain của project bạn — KHÔNG phải type thật.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * KIT: đây là bản KHUNG. Thay các export ví dụ bằng entity của project bạn. Giữ nguyên nguyên tắc:
 * dữ liệu DÙNG CHUNG cho nhiều màn, để cả xưởng nhất quán.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */

/** Ví dụ mẫu — xoá và thay bằng entity thật của bạn. */
export const mockExample = {
  id: 'example-1',
  title: 'Thực thể mẫu',
  subtitle: 'Thay bằng dữ liệu thật của project',
} as const;
