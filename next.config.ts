import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Xem xưởng UI từ máy khác: Next chặn cross-origin tới asset dev nếu origin
  // không phải hostname khởi tạo server. Khai báo IP Tailscale + LAN ở đây.
  allowedDevOrigins: [
    "100.94.148.68",
    "edgexpert-cd08.tail5d6a1b.ts.net",
    "192.168.31.168",
  ],

  /**
   * `/ban-duyet/*` → `/admin/*` — đổi 24/08/2026 khi bàn duyệt thành bàn làm việc (story 5-1).
   *
   * `permanent: true` (308) chứ không phải 307: địa chỉ cũ KHÔNG quay lại. Trình duyệt và
   * dấu trang của người vận hành nhớ luôn đường mới, không hỏi lại mỗi lần.
   *
   * `/ban-duyet/xem-truoc` trỏ về `nap-khung` chứ không mất hút: màn ấy vốn là trang chỉ
   * đường, và chỗ nó chỉ tới là bước nạp khung — nay câu giải thích nằm sẵn ở đầu màn ấy.
   *
   * ⚠️ SỬA 24/08 sau code review — chú thích cũ ở đây dạy một luật KHÔNG CÓ THẬT. Nó bảo
   * `/ban-duyet/nap-khung` sẽ "nuốt" `/ban-duyet/nap-khung/mau` nếu đứng trên. Không: `source`
   * của `redirects()` so khớp nguyên vẹn cả đường, nên một `source` không có tham số thì không
   * khớp bất kỳ đường con nào. Thứ tự dưới đây vô hại, và cũng không phải bất biến gì.
   *
   * Mối nguy nuốt route con là CÓ THẬT, nhưng nó đến từ ký tự đại diện (`:path*`) chứ không từ
   * thứ tự. Chưa mục nào ở đây dùng, và `app/admin/chrome.test.ts` giữ cho nó tiếp tục vậy.
   */
  async redirects() {
    return [
      { source: "/ban-duyet/nap-khung/mau", destination: "/admin/nap-khung/mau", permanent: true },
      { source: "/ban-duyet/nap-khung", destination: "/admin/nap-khung", permanent: true },
      { source: "/ban-duyet/xem-truoc", destination: "/admin/nap-khung", permanent: true },
      { source: "/ban-duyet/hang-cho", destination: "/admin/hang-cho", permanent: true },
      { source: "/ban-duyet/hop-nhat", destination: "/admin/hop-nhat", permanent: true },
      { source: "/ban-duyet", destination: "/admin", permanent: true },
    ];
  },
};

export default nextConfig;
