import { PrismaClient } from "@prisma/client";

// ============================================================
// Khởi tạo PrismaClient (đối tượng để truy vấn database).
//
// VẤN ĐỀ: Ở môi trường dev, Next.js "hot reload" liên tục nên nếu
// cứ "new PrismaClient()" mỗi lần thì sẽ tạo ra RẤT NHIỀU kết nối DB
// và làm tràn connection. GIẢI PHÁP: lưu một instance dùng chung vào
// biến global để tái sử dụng.
// ============================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Ở dev in ra câu lệnh SQL để học/ debug; ở production chỉ log lỗi.
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
