# Chương 7 — Chi tiết từng file source

Mỗi mục: **đường dẫn** → mục đích → giải thích logic chính.

---

## `prisma/schema.prisma`

Định nghĩa bảng PostgreSQL. Prisma sinh client TypeScript. Extension `vector` cho pgvector. Giá `Int` = đồng. `OrderItem.unitPrice` chốt giá lúc mua.

---

## `prisma/seed.ts`

Script một lần: upsert user/category/product; gọi `upsertProductEmbedding` cho vector search. Chạy sau `db:push`.

---

## `src/lib/prisma.ts`

Export `prisma` singleton. Dev log query SQL. Tránh `new PrismaClient()` mỗi lần hot reload.

---

## `src/lib/redis.ts`

Export `redis` (ioredis) + `cacheAside()`. TTL 60s. Lỗi Redis không làm sập app.

---

## `src/lib/auth.ts`

`hashPassword`, `verifyPassword` (bcrypt). `signToken`, `verifyToken` (jose JWT HS256, 7 ngày). `JwtPayload`: userId, email, role.

---

## `src/lib/utils.ts`

`cn()` merge class Tailwind. `formatVND()` hiển thị tiền Việt Nam.

---

## `src/lib/cart.ts`

Pure functions giỏ hàng. `CartLine` interface. Ship 30k hoặc free ≥500k. `addToCart` immutable (trả mảng mới).

---

## `src/lib/cart.test.ts`

5 test Vitest cho cart.ts.

---

## `src/lib/embeddings.ts`

`EMBEDDING_DIM = 384`. `localEmbedding` offline. `createEmbedding` OpenAI hoặc fallback. `toVectorLiteral` cho SQL.

---

## `src/lib/vector-search.ts`

`upsertProductEmbedding` — raw UPDATE vector. `semanticSearch` — raw SELECT ORDER BY `<=>`. Type `SemanticSearchResult`.

---

## `src/lib/health.ts`

`getHealthStatus()` ping prisma + redis, tính status tổng.

---

## `src/server/context.ts`

Interface `Context`. `createContext({ headers })` parse Bearer token → user.

---

## `src/server/trpc.ts`

`initTRPC` + superjson. `publicProcedure`, `protectedProcedure`, `adminProcedure`.

---

## `src/server/root.ts`

`appRouter` merge product, auth, order. Export `AppRouter` type.

---

## `src/server/routers/auth.ts`

`register`, `login`, `me`. Zod validate. TRPCError CONFLICT / UNAUTHORIZED.

---

## `src/server/routers/product.ts`

`list` + cache. `bySlug`. `create` admin + invalidate cache + embedding. `semanticSearch`. `reindexEmbeddings`.

---

## `src/server/routers/order.ts`

`checkout` transaction. `myOrders` filter userId.

---

## `src/app/api/[[...route]]/route.ts`

Hono app, CORS, logger, health, trpcServer mount. Export HTTP handlers cho Next.

---

## `src/trpc/client.tsx`

`"use client"`. `createTRPCReact<AppRouter>()`. `TRPCProvider` + QueryClient + httpBatchLink + token header.

---

## `src/store/auth-store.tsx`

`AuthProvider`, `useAuth`. localStorage `token`. Sync với `auth.me` query.

---

## `src/store/cart-store.tsx`

`CartProvider`, `useCart`. localStorage `cart`. Delegate tính tiền cho `lib/cart`.

---

## `src/components/providers.tsx`

Xếp TRPC → Auth → Cart.

---

## `src/components/site-header.tsx`

Navigation, giỏ badge, admin link, login/logout.

---

## `src/components/product-card.tsx`

Card sản phẩm + Image + formatVND + callbacks.

---

## `src/components/ui/button.tsx`

shadcn Button + cva variants + Slot (asChild).

---

## `src/components/ui/card.tsx`

shadcn Card compound components.

---

## `src/components/ui/input.tsx`

Input styled Tailwind.

---

## `src/components/ui/label.tsx`

Radix Label.

---

## `src/components/ui/badge.tsx`

Badge variants.

---

## `src/components/ui/separator.tsx`

Radix Separator ngang/dọc.

---

## `src/app/layout.tsx`

Root layout HTML, font, Providers, Header, Footer.

---

## `src/app/globals.css`

Tailwind v4 + CSS variables theme shadcn.

---

## `src/app/page.tsx`

Trang chủ: list SP, filter category, search, add cart.

---

## `src/app/san-pham/[slug]/page.tsx`

Chi tiết SP theo slug từ URL.

---

## `src/app/dang-nhap/page.tsx`

Form login + mutation + redirect.

---

## `src/app/dang-ky/page.tsx`

Form register tương tự login.

---

## `src/app/gio-hang/page.tsx`

List giỏ, ship fee, checkout mutation.

---

## `src/app/don-hang/page.tsx`

myOrders query, hiển thị lịch sử.

---

## `src/app/tim-kiem/page.tsx`

semanticSearch query, similarity badge.

---

## `src/app/admin/page.tsx`

reindexEmbeddings + form create product (admin only).

---

## File cấu hình (ngoài `src/`)

| File | Vai trò |
|------|---------|
| `package.json` | Dependencies & scripts |
| `tsconfig.json` | TypeScript |
| `next.config.ts` | Next.js |
| `postcss.config.mjs` | Tailwind PostCSS |
| `components.json` | shadcn config |
| `vitest.config.ts` | Test runner |
| `docker-compose.yml` | Postgres + Redis |
| `vercel.json` | Deploy hints |
| `.github/workflows/ci.yml` | CI pipeline |
| `.env.example` | Biến môi trường mẫu |

---

Quay lại mục lục: [README.md](./README.md)
