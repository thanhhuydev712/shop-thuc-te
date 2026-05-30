import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@/server/root";
import { createContext } from "@/server/context";
import { getHealthStatus } from "@/lib/health";

// ============================================================
// ĐIỂM VÀO BACKEND — dùng HONO làm web server siêu nhẹ, chạy ngay
// bên trong Next.js qua "catch-all route" [[...route]].
//
// Mọi request tới /api/* sẽ được Hono xử lý.
// Ta gắn (mount) tRPC vào đường dẫn /api/trpc.
// ============================================================

// runtime "nodejs" vì ta dùng Prisma/bcrypt/ioredis (không chạy được trên edge).
export const runtime = "nodejs";

const app = new Hono().basePath("/api");

// --- Middleware ---
app.use("*", logger()); // Ghi log mỗi request ra console (tiện debug khi học)
app.use(
  "*",
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "*", // Cho phép frontend gọi API
    credentials: true,
  }),
);

// Endpoint monitoring — kiểm tra PostgreSQL + Redis.
app.get("/health", async (c) => {
  const health = await getHealthStatus();
  const code = health.status === "error" ? 503 : 200;
  return c.json(health, code);
});

// --- Gắn tRPC ---
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    // Tạo context cho mỗi request (kèm thông tin user từ token).
    createContext: (_opts, c) =>
      createContext({ headers: c.req.raw.headers }) as unknown as Promise<
        Record<string, unknown>
      >,
  }),
);

// Chuyển các method HTTP cho Next.js xử lý qua Hono.
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
