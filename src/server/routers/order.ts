import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure } from "../trpc";

// ============================================================
// ROUTER ĐƠN HÀNG — tạo đơn (checkout) và xem lịch sử đơn.
// Tất cả đều yêu cầu đăng nhập (protectedProcedure).
// ============================================================

export const orderRouter = router({
  // Tạo đơn hàng từ danh sách sản phẩm trong giỏ.
  checkout: protectedProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              productId: z.string(),
              quantity: z.number().int().positive(),
            }),
          )
          .min(1, "Giỏ hàng đang trống"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Dùng "transaction" để đảm bảo: hoặc tất cả thành công, hoặc không gì cả.
      // Tránh trường hợp trừ kho rồi mà tạo đơn lại lỗi.
      return ctx.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const productIds = input.items.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        let total = 0;
        const orderItemsData = input.items.map((item) => {
          const product = products.find(
            (p: (typeof products)[number]) => p.id === item.productId,
          );
          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Không tìm thấy sản phẩm ${item.productId}`,
            });
          }
          if (product.stock < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Sản phẩm "${product.name}" không đủ hàng (còn ${product.stock}).`,
            });
          }
          total += product.price * item.quantity;
          return {
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price, // chốt giá tại thời điểm mua
          };
        });

        // Trừ tồn kho cho từng sản phẩm.
        for (const item of input.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Tạo đơn hàng + các dòng sản phẩm.
        return tx.order.create({
          data: {
            userId: ctx.user.userId,
            total,
            items: { create: orderItemsData },
          },
          include: { items: { include: { product: true } } },
        });
      });
    }),

  // Lấy danh sách đơn hàng của chính người dùng.
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.order.findMany({
      where: { userId: ctx.user.userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),
});
