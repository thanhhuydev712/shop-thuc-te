import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { verifyToken, type JwtPayload } from "@/lib/auth";

// ============================================================
// CONTEXT của tRPC — "túi đồ" được truyền vào MỌI API (procedure).
// Trong này có: kết nối DB (prisma), cache (redis) và thông tin
// người dùng đang đăng nhập (lấy từ token trong header Authorization).
// ============================================================

export interface Context {
  prisma: typeof prisma;
  redis: typeof redis;
  user: JwtPayload | null; // null nếu chưa đăng nhập
}

/**
 * Tạo context cho mỗi request. Ta đọc token từ header:
 *   Authorization: Bearer <token>
 * rồi giải mã ra thông tin user.
 */
export async function createContext(opts: {
  headers: Headers;
}): Promise<Context> {
  const authHeader = opts.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const user = token ? await verifyToken(token) : null;

  return { prisma, redis, user };
}
