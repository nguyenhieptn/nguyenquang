'use client';

/**
 * Chặn lỗi bất ngờ của mục Lời kể — Next 16: prop là `retry` (đổi tên từ `reset`).
 * Không banner đỏ: son mang nghĩa "đã chốt", còn đây chỉ là một lần đọc trượt.
 */
export default function LoiMucLoiKe({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-28 pt-9 md:px-8 md:pb-16 md:pt-32">
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Chưa mở được sổ lời kể</h1>
      <p className="mt-3 text-[17px] leading-relaxed">
        Có trục trặc khi mở trang này. Bản thu đã gửi trước đây vẫn an toàn trong phả.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 flex min-h-14 w-full items-center justify-center rounded-md border border-border bg-card px-6 text-[17px] font-semibold"
      >
        Mở lại
      </button>
    </main>
  );
}
