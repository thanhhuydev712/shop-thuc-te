import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// ============================================================
// Vitest là công cụ chạy test (kiểm thử) nhanh, cú pháp giống Jest.
// Ta dùng nó để kiểm tra các hàm nghiệp vụ (ví dụ: tính tổng giỏ hàng).
// ============================================================
export default defineConfig({
  test: {
    environment: "node", // Chạy test trong môi trường Node (không cần trình duyệt)
    globals: true, // Cho phép dùng describe/it/expect mà không cần import
    include: ["src/**/*.test.ts"], // Chỉ chạy các file kết thúc bằng .test.ts
  },
  resolve: {
    alias: {
      // Cho phép dùng alias "@/..." trong test giống như trong app
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
