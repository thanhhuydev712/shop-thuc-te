import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { hashPassword, verifyPassword, signToken } from "@/lib/auth";

// ============================================================
// ROUTER XÁC THỰC — đăng ký, đăng nhập, lấy thông tin bản thân.
// ============================================================

export const authRouter = router({
  // Đăng ký tài khoản mới.
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email không hợp lệ"),
        name: z.string().min(1, "Vui lòng nhập tên"),
        password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Kiểm tra email đã tồn tại chưa.
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email đã được sử dụng.",
        });
      }

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: await hashPassword(input.password),
        },
      });

      const token = await signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  // Đăng nhập: trả về token nếu đúng email + mật khẩu.
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      // Lưu ý bảo mật: KHÔNG nói rõ "sai email" hay "sai mật khẩu"
      // để tránh lộ thông tin email nào tồn tại.
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email hoặc mật khẩu không đúng.",
        });
      }

      const token = await signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  // Lấy thông tin người dùng đang đăng nhập (cần token hợp lệ).
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }),
});
