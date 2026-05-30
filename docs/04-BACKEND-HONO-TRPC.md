# Chương 4 — Backend: Hono + tRPC

## `src/app/api/[[...route]]/route.ts`

**Điểm vào backend** trong Next.js.

- `[[...route]]` = **catch-all**: mọi path `/api/...` vào đây.
- `runtime = "nodejs"` — bắt buộc vì Prisma/bcrypt/Redis không chạy Edge.
- Tạo app Hono với `basePath("/api")`.
- Middleware:
  - **logger** — in log request (debug).
  - **cors** — cho phép frontend gọi API, `credentials: true` cho cookie/header.
- `GET /api/health` — gọi `getHealthStatus()` kiểm tra DB + Redis.
- `use("/trpc/*", trpcServer(...))` — gắn tRPC, mỗi request tạo `createContext` từ headers.
- Export `GET, POST, PUT...` qua `handle(app)` — Next.js chuyển HTTP method cho Hono.

## `src/server/context.ts`

**Context** = object truyền vào mọi API handler:

```typescript
{ prisma, redis, user: JwtPayload | null }
```

`createContext`:

1. Đọc header `Authorization`.
2. Nếu dạng `Bearer <token>` → `verifyToken(token)`.
3. Trả về user hoặc `null`.

## `src/server/trpc.ts`

Khởi tạo tRPC:

- **superjson** transformer — truyền `Date`, `BigInt` qua mạng đúng kiểu.
- **isAuthed** middleware — không có `ctx.user` → lỗi `UNAUTHORIZED`.
- **protectedProcedure** = procedure + isAuthed.
- **isAdmin** — kiểm tra `role === "ADMIN"`.
- **adminProcedure** = protectedProcedure + isAdmin (phải login trước).

## `src/server/root.ts`

Gom router con:

```typescript
appRouter = { product, auth, order }
export type AppRouter = typeof appRouter  // frontend import type này
```

## `src/server/routers/auth.ts`

| Procedure | Loại | Mô tả |
|-----------|------|-------|
| register | mutation | Zod validate input → bcrypt hash → tạo User → trả JWT |
| login | mutation | Tìm user → verify password → JWT |
| me | query (protected) | Trả profile user hiện tại |

**Bảo mật**: login báo chung "Email hoặc mật khẩu không đúng" — không tiết lộ email có tồn tại hay không.

## `src/server/routers/product.ts`

| Procedure | Loại | Mô tả |
|-----------|------|-------|
| list | query | Lọc categorySlug, search; **cache Redis** 60s |
| bySlug | query | Chi tiết 1 sản phẩm |
| create | mutation (admin) | Tạo SP, xóa cache, tạo embedding |
| semanticSearch | query | Tìm vector pgvector |
| reindexEmbeddings | mutation (admin) | Index lại toàn bộ SP |

**Cache key**: `products:{category}:{search}` — khi admin tạo SP mới, xóa `products:*`.

## `src/server/routers/order.ts`

| Procedure | Loại | Mô tả |
|-----------|------|-------|
| checkout | mutation (protected) | Transaction: validate stock → decrement → create order |
| myOrders | query (protected) | Đơn của user đang login |

**Transaction** (`$transaction`): nếu một bước lỗi → rollback toàn bộ (không trừ kho mà không tạo đơn).

## `src/lib/auth.ts`

- **hashPassword** / **verifyPassword** — bcrypt, salt rounds = 10.
- **signToken** — JWT HS256, hết hạn 7 ngày, payload: userId, email, role.
- **verifyToken** — giải mã; sai/hết hạn → `null`.

## `src/lib/redis.ts`

- Singleton **ioredis** client.
- **lazyConnect: true** — không kết nối lúc build nếu Redis chưa chạy.
- **cacheAside(key, fetcher, ttl)**:
  1. Thử `redis.get(key)` → parse JSON → return.
  2. Không có → gọi `fetcher()` (query DB).
  3. `redis.set` với TTL (mặc định 60s).
  4. Redis lỗi → bỏ qua cache, vẫn trả dữ liệu từ DB.

## `src/lib/embeddings.ts`

- **localEmbedding(text)** — hash từ khóa vào vector 384 chiều, normalize (offline).
- **openaiEmbedding** — gọi API OpenAI nếu có `OPENAI_API_KEY`.
- **createEmbedding** — ưu tiên OpenAI, fallback local.
- **toVectorLiteral** — chuyển mảng số thành chuỗi `'[0.1,0.2,...]'` cho PostgreSQL.

## `src/lib/vector-search.ts`

- **upsertProductEmbedding** — `UPDATE Product SET embedding = $1::vector`.
- **semanticSearch** — `ORDER BY embedding <=> query_vector`, trả `similarity`.

## `src/lib/health.ts`

- Ping DB: `SELECT 1`.
- Ping Redis: `PING`.
- Trả `status`: `ok` | `degraded` | `error` + HTTP 503 nếu toàn bộ down.

## `src/lib/cart.ts`

Logic **thuần** (không React, không DB) — dễ test:

- `lineTotal`, `cartSubtotal`, `shippingFee`, `cartGrandTotal`, `addToCart`.
- Ship: miễn phí nếu đơn ≥ 500.000đ, không thì 30.000đ.

Chương tiếp theo: [05-FRONTEND-NEXT-REACT.md](./05-FRONTEND-NEXT-REACT.md)
