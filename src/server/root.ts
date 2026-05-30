import { router } from "./trpc";
import { productRouter } from "./routers/product";
import { authRouter } from "./routers/auth";
import { orderRouter } from "./routers/order";

// ============================================================
// ROUTER GỐC — gom tất cả router con lại thành 1 "appRouter".
// Frontend sẽ gọi kiểu: trpc.product.list, trpc.auth.login, ...
// ============================================================

export const appRouter = router({
  product: productRouter,
  auth: authRouter,
  order: orderRouter,
});

// Xuất KIỂU của router để frontend dùng (chỉ là type, không phải code chạy).
export type AppRouter = typeof appRouter;
