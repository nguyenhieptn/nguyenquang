import Link from 'next/link';
import { DOC } from '@/components/pha/khung';

/**
 * 404 toàn cục — giọng bề mặt A: không xưng hô, không đổ lỗi, chỉ đường về.
 * Trang không tồn tại hay người không tồn tại đều rơi về đây.
 */
export default function NotFound() {
  return (
    <main className={`${DOC} flex min-h-dvh flex-col items-center justify-center gap-5 text-center`}>
      <p className="font-[family-name:var(--font-pha)] text-[23px] text-foreground">
        Trang này chưa có trong phả
      </p>
      <p className="text-[17px] leading-relaxed text-muted-foreground">
        Đường dẫn có thể đã cũ, hoặc gõ nhầm một chữ.
      </p>
      <div className="flex flex-col items-center gap-3 pt-2">
        <Link
          href="/"
          className="rounded-md bg-primary px-6 py-3 text-[17px] font-medium text-primary-foreground"
        >
          Về trang chủ
        </Link>
        <Link href="/tim" className="text-[17px] text-muted-foreground underline underline-offset-4">
          Tìm một người trong phả
        </Link>
      </div>
    </main>
  );
}
