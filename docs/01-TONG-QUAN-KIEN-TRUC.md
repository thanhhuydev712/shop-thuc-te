# Chương 1 — Tổng quan kiến trúc

## Dự án là gì?

**Shop Thực Tế** là cửa hàng điện tử mẫu dùng để **học full-stack**: từ giao diện React đến API, database, cache, tìm kiếm vector và triển khai.

## Luồng request điển hình

```
Trình duyệt (React)
    │
    │  trpc.product.list.useQuery()  ──HTTP──►  /api/trpc/product.list
    ▼
Next.js Route Handler (Hono)
    │
    │  createContext() đọc JWT từ header Authorization
    ▼
tRPC procedure (product.list)
    │
    ├──► Redis cache-aside (nếu có key "products:...")
    └──► Prisma ──► PostgreSQL
```

## Luồng đăng nhập

```
1. User gửi email + password → trpc.auth.login
2. Server: bcrypt so sánh mật khẩu, ký JWT (jose)
3. Client lưu token vào localStorage
4. Mỗi request sau: header Authorization: Bearer <token>
5. createContext() → verifyToken() → ctx.user
```

## Luồng thanh toán (checkout)

```
1. Giỏ hàng lưu ở localStorage (client) — chưa cần đăng nhập để thêm
2. User đăng nhập → bấm Thanh toán
3. trpc.order.checkout gửi [{ productId, quantity }, ...]
4. Server chạy prisma.$transaction:
   - Kiểm tra tồn kho
   - Trừ stock
   - Tạo Order + OrderItem (chốt unitPrice)
5. Client xóa giỏ, chuyển sang /don-hang
```

## Cấu trúc thư mục `src/`

```
src/
├── app/              # Next.js App Router (trang + API route)
├── components/       # UI tái sử dụng (header, product-card, shadcn)
├── lib/              # Logic thuần / kết nối DB, Redis, auth
├── server/           # tRPC routers (backend logic)
├── store/            # React Context (auth, cart)
└── trpc/             # Client tRPC cho trình duyệt
```

## Công nghệ và vai trò

| Công nghệ | Vai trò trong dự án |
|-----------|---------------------|
| **Next.js 15** | Framework: routing, SSR, API routes |
| **React 19** | UI component, hooks, Context |
| **Tailwind v4** | CSS utility, design tokens |
| **shadcn/ui** | Component UI (Button, Card, Input...) |
| **Hono** | Web server nhẹ, gắn vào `/api/*` |
| **tRPC** | API type-safe: frontend biết kiểu dữ liệu backend |
| **Prisma** | ORM: truy vấn PostgreSQL an toàn kiểu |
| **PostgreSQL** | Database chính |
| **pgvector** | Cột vector embedding, tìm kiếm ngữ nghĩa |
| **Redis** | Cache danh sách sản phẩm |
| **JWT (jose)** | Token đăng nhập |
| **bcrypt** | Băm mật khẩu |
| **Vitest** | Test hàm thuần (giỏ hàng) |
| **Docker Compose** | Chạy Postgres + Redis local |

## Ba lớp bảo vệ API (tRPC)

1. **publicProcedure** — Ai cũng gọi được (list sản phẩm, đăng ký).
2. **protectedProcedure** — Phải có JWT hợp lệ (`ctx.user` không null).
3. **adminProcedure** — Phải đăng nhập **và** `role === "ADMIN"`.

## Quy ước đặt tên URL (tiếng Việt không dấu)

| URL | Trang |
|-----|-------|
| `/` | Trang chủ |
| `/san-pham/[slug]` | Chi tiết sản phẩm |
| `/dang-nhap` | Đăng nhập |
| `/dang-ky` | Đăng ký |
| `/gio-hang` | Giỏ hàng |
| `/don-hang` | Đơn hàng |
| `/tim-kiem` | Tìm kiếm vector |
| `/admin` | Quản trị |
| `/api/trpc/*` | API tRPC |
| `/api/health` | Health check |

Chương tiếp theo: [02-CAU-HINH-DU-AN.md](./02-CAU-HINH-DU-AN.md)
