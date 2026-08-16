import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Xem xưởng UI từ máy khác: Next chặn cross-origin tới asset dev nếu origin
  // không phải hostname khởi tạo server. Khai báo IP Tailscale + LAN ở đây.
  allowedDevOrigins: [
    "100.94.148.68",
    "edgexpert-cd08.tail5d6a1b.ts.net",
    "192.168.31.168",
  ],
};

export default nextConfig;
