import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

// ============================================================
// Khởi tạo tRPC — công cụ tạo API "type-safe": frontend gọi backend
// mà tự động biết kiểu dữ liệu trả về, không cần viết khai báo 2 lần.
// ============================================================

const t = initTRPC.context<Context>().create({
  // superjson cho phép truyền Date, BigInt... qua mạng đúng kiểu.
  transformer: superjson,
});

// "router" gom các API lại, "procedure" là 1 endpoint API.
export const router = t.router;
export const publicProcedure = t.procedure; // API ai cũng gọi được

/**
 * Middleware kiểm tra đăng nhập: nếu chưa đăng nhập -> báo lỗi UNAUTHORIZED.
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Bạn cần đăng nhập để thực hiện thao tác này.",
    });
  }
  // Truyền tiếp ctx với user chắc chắn khác null (để TypeScript hiểu).
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** API yêu cầu PHẢI đăng nhập. */
export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Middleware kiểm tra quyền ADMIN.
 */
const isAdmin = t.middleware(({ ctx, next }) => {
  const user = ctx.user;
  if (!user || user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Chỉ ADMIN mới có quyền này.",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** API chỉ dành cho ADMIN (phải đăng nhập trước). */
export const adminProcedure = protectedProcedure.use(isAdmin);
