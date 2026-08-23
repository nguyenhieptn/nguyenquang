import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono, Noto_Serif } from "next/font/google";
import "./globals.css";

/**
 * CHỐT FONT 22/08/2026 (DESIGN.md § Typography treo hai ràng buộc — kiểm bằng subset, không
 * bằng mắt):
 *  - Sans: Be Vietnam Pro — thiết kế cho tiếng Việt, subset `vietnamese` phủ đủ ễ ộ ự ằ ỹ.
 *  - serif-phả: Noto Serif — subset `vietnamese` đầy đủ, sức nặng cho tên người trên phả.
 *  - han-nom: chưa nạp font riêng; đề từ 光前裕後 rơi về stack CJK hệ thống (fallback khai ở
 *    globals.css). Nạp Noto Serif TC là +5MB cho bốn chữ — để khi có trang Hán-Nôm thật.
 */
const sansViet = Be_Vietnam_Pro({
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["vietnamese", "latin"],
});

const serifPha = Noto_Serif({
  variable: "--font-pha-loaded",
  subsets: ["vietnamese", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Tên dòng họ là DỮ LIỆU (AD-14) — tiêu đề khung nói vai trò sản phẩm, trang cụ thể tự đặt.
  title: "Tộc phả",
  description: "Gia phả trực tuyến của dòng họ — cây gia tộc, lời kể, và phả ký.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${sansViet.variable} ${serifPha.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
