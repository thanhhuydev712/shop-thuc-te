import type { NextConfig } from "next";

// ============================================================
// Cấu hình Next.js 15.
// Next.js là framework React giúp ta có sẵn: định tuyến (routing),
// render phía server (SSR), tối ưu hình ảnh, API routes...
// ============================================================
const nextConfig: NextConfig = {
  reactStrictMode: true, // Bật chế độ kiểm tra nghiêm ngặt của React (gọi effect 2 lần ở dev để phát hiện lỗi)

  // Cho phép tải ảnh sản phẩm từ domain bên ngoài (ví dụ ảnh demo).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },

  // serverExternalPackages: các package chỉ chạy ở server, không bundle vào client.
  serverExternalPackages: ["@prisma/client", "bcryptjs", "ioredis"],
};

export default nextConfig;
