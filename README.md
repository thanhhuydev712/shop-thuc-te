# Shop Thực Tế

Dự án học **full-stack hiện đại** — cửa hàng điện tử với đăng ký/đăng nhập, giỏ hàng, checkout, cache Redis và tìm kiếm ngữ nghĩa (pgvector).

Tài liệu này gồm: **cách cài đặt & chạy**, **giải thích toàn bộ code**, **cấu trúc thư mục**, **triển khai**.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cách chạy dự án (từng bước)](#2-cách-chạy-dự-án-từng-bước)
   - [Windows — Docker / không Docker](#windows-powershell--docker-desktop-path-không-docker)
3. [Biến môi trường](#3-biến-môi-trường)
4. [Scripts thường dùng](#4-scripts-thường-dùng)
5. [Tài khoản & trang demo](#5-tài-khoản--trang-demo)
6. [Stack công nghệ](#6-stack-công-nghệ)
   - [6.1. Cài đặt từng thư viện (dựng lại từ đầu)](#61-cài-đặt-từng-thư-viện-dựng-lại-từ-đầu)
7. [Kiến trúc & luồng dữ liệu](#7-kiến-trúc--luồng-dữ-liệu)
8. [Cấu trúc thư mục](#8-cấu-trúc-thư-mục)
9. [Giải thích Database (Prisma)](#9-giải-thích-database-prisma)
10. [Giải thích Backend (Hono + tRPC)](#10-giải-thích-backend-hono--trpc)
11. [Giải thích Frontend (Next.js + React)](#11-giải-thích-frontend-nextjs--react)
12. [Giải thích từng file source](#12-giải-thích-từng-file-source)
13. [Tìm kiếm vector (pgvector)](#13-tìm-kiếm-vector-pgvector)
14. [Triển khai & CI/CD](#14-triển-khai--cicd)
15. [Xử lý lỗi thường gặp](#15-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản gợi ý |
|---------|-----------------|
| **Node.js** | 20+ hoặc 22+ |
| **npm** | đi kèm Node |
| **Docker Desktop** | để chạy PostgreSQL + Redis (khuyến nghị) |

Không bắt buộc Docker nếu bạn đã có Postgres (có pgvector) và Redis cài sẵn — chỉ cần sửa `DATABASE_URL` / `REDIS_URL` trong `.env`.

---

## 2. Cách chạy dự án (từng bước)


### Windows (PowerShell) — Docker Desktop, PATH, không Docker

Lỗi **`'docker' is not recognized as an internal or external command`** nghĩa là Windows **không tìm thấy** lệnh `docker` trong **PATH** (chưa cài Docker Desktop, Docker chưa chạy, hoặc PATH chưa được cập nhật).

#### (a) Cài Docker Desktop

1. Tải [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. Chạy installer; chọn **Use WSL 2 based engine** khi được hỏi (khuyến nghị trên Windows 10/11).
3. Khởi động lại máy nếu installer yêu cầu.
4. Mở **Docker Desktop** từ Start Menu; đợi trạng thái **Engine running**.

#### (b) Thêm Docker vào PATH (nếu `where.exe docker` không ra gì)

Docker Desktop thường tự thêm PATH. Nếu vẫn lỗi, kiểm tra:

| Đường dẫn | Ghi chú |
|-----------|---------|
| `C:\Program Files\Docker\Docker\resources\bin` | Chứa `docker.exe` (thêm thư mục này vào **Path**) |
| `C:\Program Files\Docker\Docker\Docker Desktop.exe` | Ứng dụng GUI — **không** thay cho lệnh `docker` trong terminal |

**Settings** → **System** → **About** → **Advanced system settings** → **Environment Variables** → **Path** → **New** → dán `C:\Program Files\Docker\Docker\resources\bin` → **OK**.

Kiểm tra (PowerShell):

```powershell
where.exe docker
docker --version
docker compose version
```

> Nếu `where.exe docker` và hai đường dẫn `Program Files\Docker\...` ở trên đều **không tồn tại**, cần **cài Docker Desktop** (mục a) hoặc dùng **mục (d)**.

#### (c) Mở lại terminal

Đóng **tất cả** cửa sổ PowerShell / CMD / terminal trong Cursor, mở terminal mới, `cd` lại project:

```powershell
cd d:\Cursor\Tutorials-Cursor
npm run docker:up
docker ps
```

#### (d) Chạy **không cần Docker** (Postgres pgvector + Redis)

Không bắt buộc Docker nếu bạn có **PostgreSQL + extension pgvector** và **Redis** (local hoặc cloud).

| Thành phần | Gợi ý |
|------------|--------|
| PostgreSQL + **pgvector** | [Supabase](https://supabase.com), [Neon](https://neon.tech), hoặc Postgres local + bật pgvector |
| Redis | [Memurai](https://www.memurai.com/) (Windows), Redis trong WSL2, hoặc [Upstash](https://upstash.com/) |

Sửa file `.env` (copy từ `.env.example` trước):

```env
# Cloud Postgres (thay USER, PASSWORD, HOST, DB)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/shop_db?schema=public"

# Cloud Redis (ví dụ Upstash — URL từ dashboard)
REDIS_URL="rediss://default:YOUR_PASSWORD@YOUR-ENDPOINT.upstash.io:6379"
```

Bỏ qua `npm run docker:up`, chạy:

```powershell
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

`.env.example` mặc định khớp `docker-compose.yml` (`shop` / `shop_password` / `localhost:5432`, `redis://localhost:6379`) — chỉ giữ nguyên khi DB/Redis local **đúng** thông số đó.

---


### Bước 1 — Clone / mở project

```bash
cd d:\Cursor\Tutorials-Cursor
```

### Bước 2 — Khởi động database (Docker)

```bash
npm run docker:up
```

Chờ vài giây để Postgres + Redis sẵn sàng. Kiểm tra:

```bash
docker ps
```

Phải thấy container `shop-postgres` và `shop-redis`.

### Bước 3 — Tạo file `.env`

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Giá trị mặc định trong `.env.example` đã khớp với `docker-compose.yml` — thường **không cần sửa** khi chạy local.

### Bước 4 — Cài dependency

```bash
npm install
```

### Bước 5 — Tạo bảng & dữ liệu mẫu

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

| Lệnh | Ý nghĩa |
|------|---------|
| `db:generate` | Sinh Prisma Client (code truy vấn DB) |
| `db:push` | Đẩy schema lên PostgreSQL (tạo bảng) |
| `db:seed` | Tạo user, danh mục, sản phẩm, vector embedding |

### Bước 6 — Chạy ứng dụng

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

### Bước 7 — Kiểm tra API (tùy chọn)

- Health: http://localhost:3000/api/health  
- Phải thấy `"database": "up"` và `"redis": "up"`.

### Chạy production (local)

```bash
npm run build
npm run start
```

### Dừng Docker khi không dùng

```bash
npm run docker:down
```

---

## 3. Biến môi trường

File `.env` (copy từ `.env.example`):

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `DATABASE_URL` | Có | PostgreSQL, ví dụ `postgresql://shop:shop_password@localhost:5432/shop_db` |
| `REDIS_URL` | Có | Redis, ví dụ `redis://localhost:6379` |
| `JWT_SECRET` | Có | Chuỗi bí mật ký token đăng nhập — **đổi chuỗi dài ngẫu nhiên khi deploy** |
| `NEXT_PUBLIC_APP_URL` | Có | URL app, local: `http://localhost:3000` |
| `OPENAI_API_KEY` | Không | Bật embedding OpenAI (tìm kiếm vector chất lượng hơn) |

**Không commit file `.env`** lên Git.

---

## 4. Scripts thường dùng

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Server phát triển (hot reload) |
| `npm run build` | Build production |
| `npm run start` | Chạy bản build |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm test` | Chạy test Vitest (logic giỏ hàng) |
| `npm run docker:up` | Bật Postgres + Redis |
| `npm run docker:down` | Tắt container |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | Đồng bộ schema → DB |
| `npm run db:migrate` | Migration (khi dùng migrate thay push) |
| `npm run db:seed` | Dữ liệu mẫu + embeddings |
| `npm run db:studio` | Giao diện xem/sửa DB (Prisma Studio) |

---

## 5. Tài khoản & trang demo

### Tài khoản (sau `db:seed`)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Khách hàng | user@shop.vn | user123 |
| Quản trị | admin@shop.vn | admin123 |

### Luồng thử nhanh

1. Trang chủ `/` → **Thêm giỏ** sản phẩm  
2. `/dang-nhap` → đăng nhập `user@shop.vn`  
3. `/gio-hang` → **Thanh toán**  
4. `/don-hang` → xem đơn vừa tạo  
5. `/tim-kiem` → thử *"laptop mỏng pin lâu"*  
6. `/admin` (đăng nhập admin) → Reindex embeddings / thêm sản phẩm  

### Các URL

| URL | Chức năng |
|-----|-----------|
| `/` | Danh sách sản phẩm, lọc danh mục, tìm tên |
| `/san-pham/[slug]` | Chi tiết sản phẩm |
| `/dang-nhap` | Đăng nhập |
| `/dang-ky` | Đăng ký |
| `/gio-hang` | Giỏ hàng & checkout |
| `/don-hang` | Lịch sử đơn (cần đăng nhập) |
| `/tim-kiem` | Tìm kiếm ngữ nghĩa (pgvector) |
| `/admin` | Quản trị (chỉ ADMIN) |
| `/api/health` | Monitoring DB + Redis |
| `/api/trpc/*` | API tRPC (frontend gọi tự động) |

---

## 6. Stack công nghệ

| Lớp | Công nghệ | Vai trò |
|-----|-----------|---------|
| **Frontend** | React 19, Next.js 15 | UI, routing, SSR |
| | Tailwind CSS v4 | Styling |
| | shadcn/ui | Component Button, Card, Input... |
| **Backend** | Node.js, Hono | Web server trong `/api` |
| | tRPC | API type-safe |
| | Zod | Validate input |
| | JWT (jose) + bcrypt | Auth |
| **Database** | PostgreSQL + Prisma | ORM, bảng User/Product/Order... |
| | pgvector | Vector embedding, tìm kiếm ngữ nghĩa |
| | Redis (ioredis) | Cache danh sách sản phẩm |
| **DevOps** | Docker Compose | Postgres + Redis local |
| | GitHub Actions | CI: typecheck, test, build |
| | Vercel | Deploy Next.js (gợi ý) |

---

### 6.1. Cài đặt từng thư viện (dựng lại từ đầu)

> **Lưu ý:** Nếu bạn chỉ chạy dự án có sẵn, chỉ cần `npm install` — lệnh này tự đọc `package.json` và cài **đủ** mọi thư viện bên dưới. Phần này dành cho người muốn **hiểu từng thư viện làm gì** hoặc **dựng lại dự án từ con số 0**. Phiên bản dưới đây khớp với `package.json` hiện tại.

#### Bước 0 — Khởi tạo dự án Next.js

```bash
npx create-next-app@latest shop-thuc-te --typescript --app --tailwind --eslint
cd shop-thuc-te
```

> Lệnh trên dựng sẵn **Next.js 15 + React 19 + TypeScript + Tailwind + ESLint**. Các bước sau chỉ cài thêm những thư viện riêng của dự án.

#### Nhóm 1 — Backend & API (Hono + tRPC)

```bash
npm install hono @hono/trpc-server
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
npm install zod superjson
```

| Thư viện | Vai trò |
|----------|---------|
| `hono` | Web server siêu nhẹ chạy trong route `/api` |
| `@hono/trpc-server` | Cầu nối gắn tRPC vào Hono |
| `@trpc/server` · `@trpc/client` · `@trpc/react-query` | API type-safe (server, client, hooks React) |
| `@tanstack/react-query` | Cache/loading/refetch dữ liệu phía client (tRPC dựa trên nó) |
| `zod` | Kiểm tra (validate) dữ liệu đầu vào của API |
| `superjson` | Truyền `Date`, `BigInt`… qua mạng đúng kiểu |

> tRPC v11 đang ở bản RC, nên cài kèm thẻ phiên bản nếu cần đúng bản dự án: `npm install @trpc/server@^11.0.0-rc.660 @trpc/client@^11.0.0-rc.660 @trpc/react-query@^11.0.0-rc.660`.

#### Nhóm 2 — Database (Prisma + PostgreSQL/pgvector)

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

| Thư viện | Vai trò |
|----------|---------|
| `@prisma/client` | Client truy vấn DB (runtime) |
| `prisma` (devDependency) | CLI sinh client, push schema, migrate, studio |

> `pgvector` **không phải** package npm — đó là extension của PostgreSQL. Dự án bật bằng `extensions = [vector]` trong `schema.prisma` và dùng image Docker `pgvector/pgvector:pg16`.

#### Nhóm 3 — Cache (Redis)

```bash
npm install ioredis
```

| Thư viện | Vai trò |
|----------|---------|
| `ioredis` | Client kết nối Redis để cache danh sách sản phẩm |

#### Nhóm 4 — Xác thực & bảo mật

```bash
npm install bcryptjs jose
npm install -D @types/bcryptjs
```

| Thư viện | Vai trò |
|----------|---------|
| `bcryptjs` | Băm & so sánh mật khẩu |
| `jose` | Ký và xác thực JWT (token đăng nhập) |
| `@types/bcryptjs` | Khai báo kiểu TypeScript cho bcryptjs |

#### Nhóm 5 — Giao diện (Tailwind v4 + shadcn/ui)

```bash
npm install -D tailwindcss @tailwindcss/postcss
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
npm install @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-slot
```

| Thư viện | Vai trò |
|----------|---------|
| `tailwindcss` · `@tailwindcss/postcss` | Engine CSS tiện ích (Tailwind v4 dùng plugin PostCSS riêng) |
| `tailwindcss-animate` | Tiện ích animation cho Tailwind |
| `class-variance-authority` · `clsx` · `tailwind-merge` | Ghép & quản lý class có điều kiện (nền tảng của shadcn/ui) |
| `lucide-react` | Bộ icon |
| `@radix-ui/react-*` | Primitive không giao diện (Label, Separator, Slot) — shadcn/ui dựng trên đó |

Khởi tạo shadcn/ui (sinh ra `components.json` + các component trong `components/ui/`):

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label badge separator
```

#### Nhóm 6 — Công cụ phát triển (TypeScript & Test)

```bash
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D tsx vitest
```

| Thư viện | Vai trò |
|----------|---------|
| `typescript` · `@types/*` | Ngôn ngữ + khai báo kiểu cho Node/React |
| `tsx` | Chạy file `.ts` trực tiếp (dùng cho `db:seed`) |
| `vitest` | Framework chạy unit test (xem `src/lib/cart.test.ts`) |

#### Cài tất cả trong một lệnh (tham khảo)

```bash
# Runtime dependencies
npm install hono @hono/trpc-server @trpc/server @trpc/client @trpc/react-query \
  @tanstack/react-query zod superjson @prisma/client ioredis bcryptjs jose next \
  react react-dom tailwindcss-animate class-variance-authority clsx tailwind-merge \
  lucide-react @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-slot

# Dev dependencies
npm install -D prisma typescript @types/node @types/react @types/react-dom \
  @types/bcryptjs tsx vitest tailwindcss @tailwindcss/postcss
```

> Trên Windows (PowerShell) dùng dấu nối dòng backtick `` ` `` thay cho `\`, hoặc gõ liền trên một dòng.

---

## 7. Kiến trúc & luồng dữ liệu

### Sơ đồ tổng quan

```
┌─────────────┐     HTTP      ┌──────────────────┐
│  Trình duyệt │ ────────────► │ Next.js /api     │
│  React 19    │ ◄──────────── │ Hono + tRPC      │
└─────────────┘               └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
              ┌──────────┐      ┌──────────┐      ┌─────────────┐
              │  Redis   │      │  Prisma  │      │  pgvector   │
              │  (cache) │      │          │      │ (embedding) │
              └──────────┘      └────┬─────┘      └─────────────┘
                                     ▼
                              ┌─────────────┐
                              │ PostgreSQL  │
                              └─────────────┘
```

### Luồng đọc sản phẩm

```
trpc.product.list.useQuery()
  → GET /api/trpc/product.list
  → createContext() (đọc JWT nếu có)
  → Redis cache-aside (key products:...)
  → Prisma findMany → PostgreSQL
```

### Luồng đăng nhập

```
1. Form gửi email + password → auth.login
2. Server: bcrypt so sánh, ký JWT
3. Client: localStorage.setItem("token", ...)
4. Request sau: header Authorization: Bearer <token>
5. createContext → verifyToken → ctx.user
```

### Luồng thanh toán

```
1. Giỏ lưu localStorage (chưa cần login để thêm)
2. Đăng nhập → /gio-hang → Thanh toán
3. order.checkout({ items: [{ productId, quantity }] })
4. prisma.$transaction:
   - Kiểm tra tồn kho
   - Trừ stock
   - Tạo Order + OrderItem (chốt unitPrice)
5. Xóa giỏ → chuyển /don-hang
```

### Ba mức API (tRPC)

| Procedure | Ai gọi được? | Ví dụ |
|-----------|--------------|--------|
| `publicProcedure` | Mọi người | `product.list`, `auth.login` |
| `protectedProcedure` | Đã đăng nhập | `order.checkout`, `auth.me` |
| `adminProcedure` | ADMIN | `product.create`, `reindexEmbeddings` |

---

## 8. Cấu trúc thư mục

```
Tutorials-Cursor/
├── prisma/
│   ├── schema.prisma      # Định nghĩa bảng DB
│   └── seed.ts            # Dữ liệu mẫu
├── src/
│   ├── app/               # Next.js App Router (trang + API)
│   │   ├── api/[[...route]]/route.ts   # Hono + tRPC
│   │   ├── layout.tsx, page.tsx, globals.css
│   │   ├── dang-nhap/, dang-ky/, gio-hang/, don-hang/
│   │   ├── san-pham/[slug]/, tim-kiem/, admin/
│   ├── components/        # UI (header, product-card, shadcn/ui)
│   ├── lib/               # auth, prisma, redis, cart, embeddings...
│   ├── server/            # tRPC routers
│   │   ├── context.ts, trpc.ts, root.ts
│   │   └── routers/       # auth, product, order
│   ├── store/             # Auth + Cart (React Context)
│   └── trpc/client.tsx    # Client gọi API từ browser
├── docker-compose.yml
├── .github/workflows/ci.yml
├── .env.example
└── README.md              # File này
```

---

## 9. Giải thích Database (Prisma)

### File `prisma/schema.prisma`

Mô tả bảng; chạy `npm run db:generate` để sinh **Prisma Client**.

**Bảng chính:**

| Model | Mục đích |
|-------|----------|
| `User` | email, passwordHash (bcrypt), role USER/ADMIN |
| `Category` | Danh mục, có `slug` cho URL |
| `Product` | Sản phẩm; `price` kiểu **Int (đồng)**; `embedding` vector(384) |
| `Order` | Đơn hàng, status PENDING → COMPLETED |
| `OrderItem` | Dòng SP trong đơn; `unitPrice` chốt giá lúc mua |

**Quan hệ:** User 1─n Order 1─n OrderItem n─1 Product; Category 1─n Product.

**pgvector:** Cột `embedding` dùng kiểu `Unsupported("vector(384)")` — Prisma đọc/ghi bằng **raw SQL** trong `src/lib/vector-search.ts`.

### File `prisma/seed.ts`

- Tạo admin + user demo, 3 danh mục, 6 sản phẩm.
- Gọi `upsertProductEmbedding()` cho từng sản phẩm (tìm kiếm vector).

### File `src/lib/prisma.ts`

- Một instance `PrismaClient` dùng chung (tránh tràn connection khi Next.js hot reload).

---

## 10. Giải thích Backend (Hono + tRPC)

### `src/app/api/[[...route]]/route.ts`

- **Catch-all route** `/api/*` → Hono.
- `runtime = "nodejs"` (Prisma/bcrypt/Redis).
- Middleware: logger, CORS.
- `GET /api/health` — kiểm tra DB + Redis.
- Mount tRPC tại `/api/trpc`.

### `src/server/context.ts`

Mỗi request API nhận **context**:

```ts
{ prisma, redis, user: JwtPayload | null }
```

Đọc `Authorization: Bearer <token>` → `verifyToken()`.

### `src/server/trpc.ts`

- **superjson** — truyền Date qua mạng.
- `protectedProcedure` — middleware bắt buộc đăng nhập.
- `adminProcedure` — protected + role ADMIN.

### Routers

**`routers/auth.ts`**

| API | Mô tả |
|-----|--------|
| `register` | Tạo user, hash mật khẩu, trả JWT |
| `login` | Kiểm tra bcrypt, trả JWT |
| `me` | Profile user hiện tại |

**`routers/product.ts`**

| API | Mô tả |
|-----|--------|
| `list` | Danh sách; cache Redis 60s |
| `bySlug` | Chi tiết theo slug |
| `create` | Admin tạo SP + embedding |
| `semanticSearch` | Tìm vector pgvector |
| `reindexEmbeddings` | Admin index lại toàn bộ |

**`routers/order.ts`**

| API | Mô tả |
|-----|--------|
| `checkout` | Transaction: trừ kho + tạo đơn |
| `myOrders` | Đơn của user đang login |

### Thư viện `src/lib/`

| File | Chức năng |
|------|-----------|
| `auth.ts` | bcrypt + JWT sign/verify |
| `redis.ts` | Client Redis + `cacheAside()` |
| `cart.ts` | Tính tiền giỏ, phí ship (pure functions) |
| `embeddings.ts` | Tạo vector 384 chiều (local hoặc OpenAI) |
| `vector-search.ts` | SQL pgvector, semantic search |
| `health.ts` | Ping DB/Redis cho monitoring |
| `utils.ts` | `cn()`, `formatVND()` |

---

## 11. Giải thích Frontend (Next.js + React)

### `src/app/layout.tsx`

- Khung HTML: font, `Providers`, `SiteHeader`, `{children}`, footer.
- Import `globals.css` (Tailwind + theme shadcn).

### Providers (`components/providers.tsx`)

Thứ tự bọc:

```
TRPCProvider → AuthProvider → CartProvider
```

### `src/trpc/client.tsx`

- `trpc.product.list.useQuery()` — hooks gọi API type-safe.
- Tự gắn token từ `localStorage` vào header.
- `getBaseUrl()` — dùng `window.location.origin` trên browser.

### Stores

**`store/auth-store.tsx`** — JWT, `login`/`logout`, sync `auth.me`.

**`store/cart-store.tsx`** — Giỏ trong state + `localStorage` key `cart`.

### Components

- **`site-header.tsx`** — Menu, badge giỏ, admin link.
- **`product-card.tsx`** — Ảnh, giá, nút thêm giỏ.
- **`components/ui/*`** — shadcn: Button, Card, Input, Label, Badge, Separator.

### Các trang (`app/*/page.tsx`)

| Trang | Logic chính |
|-------|----------------|
| `page.tsx` | `product.list`, lọc, thêm giỏ |
| `san-pham/[slug]` | `product.bySlug` |
| `dang-nhap` / `dang-ky` | mutation auth → lưu token |
| `gio-hang` | Hiển thị giỏ, `order.checkout` |
| `don-hang` | `order.myOrders` |
| `tim-kiem` | `product.semanticSearch` |
| `admin` | `reindexEmbeddings`, `product.create` |

---

## 12. Giải thích từng file source

### `prisma/`

| File | Giải thích |
|------|------------|
| `schema.prisma` | Định nghĩa bảng, extension pgvector |
| `seed.ts` | Dữ liệu mẫu + embeddings |

### `src/lib/`

| File | Giải thích |
|------|------------|
| `prisma.ts` | Singleton Prisma Client |
| `redis.ts` | Redis + cache-aside |
| `auth.ts` | Hash mật khẩu, JWT |
| `utils.ts` | cn(), formatVND() |
| `cart.ts` | Logic giỏ hàng thuần |
| `cart.test.ts` | Test Vitest cho cart.ts |
| `embeddings.ts` | Vector từ text |
| `vector-search.ts` | SQL pgvector |
| `health.ts` | Health check |

### `src/server/`

| File | Giải thích |
|------|------------|
| `context.ts` | Context tRPC mỗi request |
| `trpc.ts` | Khởi tạo tRPC + middleware |
| `root.ts` | Gom router product, auth, order |
| `routers/auth.ts` | API xác thực |
| `routers/product.ts` | API sản phẩm + cache + vector |
| `routers/order.ts` | API đơn hàng |

### `src/app/`

| File | Giải thích |
|------|------------|
| `api/[[...route]]/route.ts` | Entry Hono + tRPC |
| `layout.tsx` | Layout gốc |
| `globals.css` | Tailwind v4 + CSS variables |
| `page.tsx` | Trang chủ |
| `san-pham/[slug]/page.tsx` | Chi tiết SP |
| `dang-nhap/page.tsx` | Login |
| `dang-ky/page.tsx` | Register |
| `gio-hang/page.tsx` | Giỏ + checkout |
| `don-hang/page.tsx` | Lịch sử đơn |
| `tim-kiem/page.tsx` | Tìm vector |
| `admin/page.tsx` | Trang admin |

### `src/components/`, `src/store/`, `src/trpc/`

| File | Giải thích |
|------|------------|
| `providers.tsx` | Xếp Context |
| `site-header.tsx` | Header |
| `product-card.tsx` | Card sản phẩm |
| `ui/*.tsx` | shadcn components |
| `auth-store.tsx` | Context đăng nhập |
| `cart-store.tsx` | Context giỏ hàng |
| `trpc/client.tsx` | tRPC phía browser |

### File cấu hình

| File | Giải thích |
|------|------------|
| `package.json` | Dependencies & scripts |
| `tsconfig.json` | TypeScript, alias `@/` |
| `next.config.ts` | Next.js, ảnh remote |
| `postcss.config.mjs` | Tailwind PostCSS |
| `components.json` | Cấu hình shadcn |
| `vitest.config.ts` | Test runner |
| `docker-compose.yml` | Postgres pgvector + Redis |
| `vercel.json` | Gợi ý deploy Vercel |
| `.github/workflows/ci.yml` | CI pipeline |
| `.env.example` | Mẫu biến môi trường |

> Thư mục `docs/` vẫn giữ bản chi tiết từng chương; **README này là tài liệu chính**.

---

## 13. Tìm kiếm vector (pgvector)

1. Mỗi sản phẩm có **embedding** (384 số) từ tên + mô tả.
2. User nhập câu tại `/tim-kiem` → embedding câu hỏi.
3. PostgreSQL so **cosine distance** (`<=>`) → sản phẩm gần nghĩa nhất.

**Mặc định:** embedding cục bộ (không cần API).

**Nâng cao:** thêm vào `.env`:

```env
OPENAI_API_KEY=sk-...
```

Vào `/admin` → **Reindex embeddings**.

Nếu không có kết quả: chạy lại `npm run db:seed` hoặc Reindex trên Admin.

---

## 14. Triển khai & CI/CD

### Vercel

1. Push code lên GitHub, import project Vercel.
2. Environment variables:
   - `DATABASE_URL` — Postgres **có pgvector** (Supabase, Neon...)
   - `REDIS_URL` — Upstash Redis
   - `JWT_SECRET` — chuỗi bí mật dài
   - `NEXT_PUBLIC_APP_URL` — URL production
3. Build: `prisma generate && next build` (xem `vercel.json`).

### AWS (gợi ý)

| Dịch vụ | Dùng cho |
|---------|----------|
| RDS PostgreSQL + pgvector | Database |
| ElastiCache | Redis |
| ECS/Fargate hoặc Amplify | Next.js |
| CloudWatch | Log + alarm từ `/api/health` |

### CI (GitHub Actions)

Mỗi push/PR: cài dependency → `db push` → `seed` → `typecheck` → `test` → `build`.

File: `.github/workflows/ci.yml`

### Monitoring

`GET /api/health` trả về:

```json
{
  "status": "ok",
  "checks": { "database": "up", "redis": "up" }
}
```

`503` nếu cả DB và Redis đều down.

---

## 15. Xử lý lỗi thường gặp

### `Can't reach database server`

- Chạy `npm run docker:up` hoặc kiểm tra Postgres đang bật.
- Kiểm tra `DATABASE_URL` trong `.env`.

### Redis connection / lỗi khi build

- Chạy Redis: `docker ps` thấy `shop-redis`.
- App vẫn chạy nếu Redis lỗi (bỏ qua cache) — nhưng `/api/health` có thể `degraded`.

### Trang trống, không có sản phẩm

```bash
npm run db:push
npm run db:seed
```

### Tìm kiếm vector không ra kết quả

```bash
npm run db:seed
```

Hoặc Admin → **Reindex embeddings**.

### `prisma generate` lỗi extension vector

Đảm bảo `schema.prisma` có:

```prisma
previewFeatures = ["postgresqlExtensions"]
```

### Port 3000 đã được dùng

```bash
npx next dev -p 3001
```

Đổi `NEXT_PUBLIC_APP_URL` tương ứng.

### Cảnh báo hydration mismatch trên `<body>` (Chrome + extension)

Khi mở app trong Chrome, console có thể báo **Hydration failed** với diff kiểu:

```text
- __processed_...="true"
- bis_register="W3s..."
```

Đây thường **không phải lỗi code** — extension trình duyệt (Bitwarden, LastPass, ad blocker, v.v.) chèn attribute vào `<html>` / `<body>` **trước khi React hydrate**, nên HTML client khác HTML server.

**Cách kiểm tra:**

1. Mở **cửa sổ ẩn danh** (Incognito) — extension thường bị tắt → cảnh báo biến mất.
2. Hoặc tắt tạm extension (password manager, ad blocker) rồi reload.
3. So sánh với trình duyệt sạch / Firefox không cài extension.

**Trong dự án này:** `src/app/layout.tsx` đặt `suppressHydrationWarning` trên `<html>` và `<body>` để React bỏ qua khác biệt attribute do extension. Auth/cart đọc `localStorage` trong `useEffect` sau mount — không gây mismatch nội dung.

Nếu cảnh báo **vẫn còn ở Incognito**, mới cần tìm nguyên nhân code (ví dụ render `Date` / `window` khác nhau giữa server và client).

---

## Thứ tự học code đề xuất

1. `prisma/schema.prisma` + `seed.ts`
2. `src/lib/prisma.ts`, `auth.ts`, `redis.ts`
3. `src/server/context.ts` → `trpc.ts` → `routers/*`
4. `src/app/api/[[...route]]/route.ts`
5. `src/trpc/client.tsx` + `store/*`
6. `src/app/page.tsx` và các trang còn lại

---

**Shop Thực Tế** — Tutorial full-stack · React 19 · Next.js 15 · tRPC · Prisma · Redis · pgvector
