# Giải thích toàn bộ code — Shop Thực Tế

> Tài liệu này gom **tất cả** phần giải thích dự án. Đọc file này từ đầu đến cuối hoặc mở từng chương riêng trong thư mục `docs/`.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu hình dự án](#2-cấu-hình-dự-án)
3. [Database & Prisma](#3-database--prisma)
4. [Backend Hono + tRPC](#4-backend-hono--trpc)
5. [Frontend Next.js + React](#5-frontend-nextjs--react)
6. [DevOps & Monitoring](#6-devops--monitoring)
7. [Bảng tra cứu từng file](#7-bảng-tra-cứu-từng-file)

---

## 1. Tổng quan kiến trúc

Dự án là **cửa hàng điện tử tutorial** với stack hiện đại.

**Luồng đọc dữ liệu sản phẩm:**

```
React (useQuery) → HTTP /api/trpc/product.list → Hono → tRPC → Redis? → Prisma → PostgreSQL
```

**Luồng auth:** Login → JWT trong localStorage → mỗi request gửi `Authorization: Bearer ...` → `createContext` gán `ctx.user`.

**Luồng checkout:** Giỏ (localStorage) → `order.checkout` → transaction trừ kho + tạo đơn.

**Phân quyền API:** public / protected (cần login) / admin.

Chi tiết sơ đồ: xem [01-TONG-QUAN-KIEN-TRUC.md](./01-TONG-QUAN-KIEN-TRUC.md).

---

## 2. Cấu hình dự án

- **package.json** — scripts: dev, build, db:*, docker:*, test.
- **tsconfig** — strict, alias `@/`.
- **next.config** — ảnh remote, external packages server.
- **.env** — DATABASE_URL, REDIS_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL, OPENAI_API_KEY (optional).

Chi tiết: [02-CAU-HINH-DU-AN.md](./02-CAU-HINH-DU-AN.md).

---

## 3. Database & Prisma

**Bảng chính:** User, Category, Product, Order, OrderItem.

**Điểm quan trọng:**

- Mật khẩu chỉ lưu `passwordHash` (bcrypt).
- Giá kiểu `Int` (đồng).
- `embedding vector(384)` cho pgvector — Prisma dùng raw SQL.
- Seed tạo 2 user, 3 category, 6 product + embeddings.

Chi tiết: [03-DATABASE-PRISMA.md](./03-DATABASE-PRISMA.md).

---

## 4. Backend Hono + tRPC

| File | Chức năng |
|------|-----------|
| `api/[[...route]]/route.ts` | Hono + health + mount tRPC |
| `server/context.ts` | prisma, redis, user từ JWT |
| `server/trpc.ts` | procedures + middleware auth |
| `server/root.ts` | gom routers |
| `routers/auth.ts` | register, login, me |
| `routers/product.ts` | CRUD list, cache, vector search |
| `routers/order.ts` | checkout, myOrders |
| `lib/auth.ts` | bcrypt + JWT |
| `lib/redis.ts` | cache-aside |
| `lib/embeddings.ts` + `vector-search.ts` | pgvector |
| `lib/health.ts` | monitoring |
| `lib/cart.ts` | logic giỏ (server-side pure) |

Chi tiết từng procedure: [04-BACKEND-HONO-TRPC.md](./04-BACKEND-HONO-TRPC.md).

---

## 5. Frontend Next.js + React

| File | Chức năng |
|------|-----------|
| `app/layout.tsx` | shell app, providers |
| `app/globals.css` | Tailwind + theme |
| `app/page.tsx` | danh sách SP |
| `app/san-pham/[slug]/page.tsx` | chi tiết |
| `app/dang-nhap`, `dang-ky` | auth forms |
| `app/gio-hang` | cart + checkout |
| `app/don-hang` | orders |
| `app/tim-kiem` | semantic search UI |
| `app/admin` | admin tools |
| `trpc/client.tsx` | tRPC React client |
| `store/auth-store.tsx` | auth context |
| `store/cart-store.tsx` | cart context |
| `components/*` | UI |

Chi tiết: [05-FRONTEND-NEXT-REACT.md](./05-FRONTEND-NEXT-REACT.md).

---

## 6. DevOps & Monitoring

- **docker-compose** — Postgres pgvector + Redis.
- **CI GitHub Actions** — typecheck, test, build.
- **vercel.json** — deploy Next.js.
- **GET /api/health** — database + redis status.

Chi tiết: [06-DEVOPS-MONITORING.md](./06-DEVOPS-MONITORING.md).

---

## 7. Bảng tra cứu từng file

Danh sách **đầy đủ** mọi file `.ts`/`.tsx` trong `src/` và `prisma/`: [07-CHI-TIET-TUNG-FILE.md](./07-CHI-TIET-TUNG-FILE.md).

---

## Ghi chú khi đọc code trong IDE

Nhiều file `.ts` đã có khối comment tiếng Việt ở **đầu file** (giải thích ngắn). Comment trong file = tóm tắt nhanh; thư mục `docs/` = giải thích đầy đủ + sơ đồ.

**Thứ tự học đề xuất:**

1. `prisma/schema.prisma` + `seed.ts`
2. `src/lib/prisma.ts`, `auth.ts`, `redis.ts`
3. `src/server/context.ts` → `trpc.ts` → `routers/*`
4. `src/app/api/[[...route]]/route.ts`
5. `src/trpc/client.tsx` + `store/*`
6. `src/app/page.tsx` và các trang còn lại

---

*Tài liệu đi kèm dự án Shop Thực Tế — tutorial full-stack.*
