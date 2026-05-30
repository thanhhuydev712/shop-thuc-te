# CLAUDE.md

File này hướng dẫn Claude Code (và bất kỳ AI/agent nào) khi làm việc trong dự án này.
Đồng thời nó được viết theo phong cách **giải thích để học** — nên bạn (người mới) cũng đọc được
để hiểu *vì sao* mỗi mảnh ghép tồn tại, chứ không chỉ *nó là gì*.

> Quy ước ngôn ngữ: **toàn bộ comment, tài liệu và tên biến nghiệp vụ viết bằng tiếng Việt**
> (ví dụ route `/gio-hang`, `/dang-nhap`). Hãy giữ đúng phong cách này khi thêm code mới.

---

## 1. Dự án này là gì?

`shop-thuc-te` — một website **bán hàng (e-commerce) thu nhỏ nhưng "thật"**, dựng lên để học
full-stack hiện đại **từ con số 0**. Nó cố tình dùng đúng bộ công cụ mà các công ty đang dùng,
nhưng mỗi file đều có comment tiếng Việt giải thích.

Các tính năng đã có:
- Xem danh sách / chi tiết sản phẩm, lọc theo danh mục.
- Tìm kiếm thường (so khớp tên) **và** tìm kiếm ngữ nghĩa (semantic search bằng vector).
- Đăng ký / đăng nhập (JWT), phân quyền `USER` / `ADMIN`.
- Giỏ hàng (lưu ở trình duyệt) + tính phí ship + đặt đơn hàng.
- Trang admin tạo sản phẩm.
- Cache bằng Redis, health-check, CI, Docker cho hạ tầng.

---

## 2. Bản đồ công nghệ (đọc cái này trước)

Hình dung 1 request đi từ trình duyệt → backend → database:

```
Trình duyệt (React 19 / Next.js App Router)
   │  gọi API kiểu type-safe
   ▼
tRPC client  ──HTTP /api/trpc──►  Hono (web server) chạy trong Next.js route
                                      │
                                      ▼
                                 tRPC router (product / auth / order)
                                      │  qua "context" có sẵn prisma + redis + user
                          ┌───────────┼─────────────┐
                          ▼           ▼             ▼
                      Prisma       Redis        Vector search
                    (PostgreSQL)  (cache)       (pgvector, raw SQL)
```

| Lớp | Công nghệ | Vai trò & vì sao chọn |
|-----|-----------|------------------------|
| Framework web | **Next.js 15 (App Router)** + **React 19** | Vừa render giao diện, vừa host backend trong cùng 1 dự án. |
| Web server backend | **Hono** | Server siêu nhẹ, chạy ngay trong Next.js qua catch-all route. Lo middleware (CORS, log, health). |
| Lớp API | **tRPC v11** | API **type-safe**: frontend gọi backend mà tự biết kiểu dữ liệu, không cần viết schema 2 lần. |
| Validate dữ liệu | **Zod** | Mọi input vào API đều được kiểm tra bằng `z.object(...)` trước khi xử lý. |
| Truy vấn DB | **Prisma 6** | ORM type-safe. Mô tả bảng trong `schema.prisma`, sinh ra client để query. |
| Database | **PostgreSQL + pgvector** | DB quan hệ chính; extension `vector` để tìm kiếm ngữ nghĩa. |
| Cache | **Redis (ioredis)** | Lưu tạm danh sách sản phẩm 60s để giảm tải DB (mẫu cache-aside). |
| State client | **React Query** (`@tanstack/react-query`) + 2 store nhỏ tự viết | Cache dữ liệu phía client, lo loading/refetch; store cho giỏ hàng & auth. |
| Auth | **bcryptjs** (băm mật khẩu) + **jose** (ký/giải JWT) | Mật khẩu băm, "vé đăng nhập" là JWT ký bằng `JWT_SECRET`. |
| UI | **Tailwind CSS 4** + **shadcn/ui** (Radix) + **lucide-react** | Style bằng class tiện ích; component có sẵn trong `src/components/ui`. |
| Serialize | **superjson** | Cho phép truyền `Date`, `BigInt`... qua mạng đúng kiểu. |
| Test | **Vitest** | Test logic thuần (ví dụ tính tiền giỏ hàng). |
| Hạ tầng | **Docker Compose**, GitHub Actions CI, Vercel | Postgres+Redis bằng container; CI chạy typecheck/test/build. |

---

## 3. Lệnh hay dùng

```bash
# --- Hạ tầng (cần Docker Desktop đang chạy) ---
npm run docker:up      # Bật PostgreSQL + Redis bằng Docker
npm run docker:down    # Tắt

# --- Database ---
npm run db:generate    # Sinh Prisma Client từ schema.prisma (chạy sau khi sửa schema)
npm run db:push        # Đẩy cấu trúc bảng lên DB (dev nhanh, không tạo file migration)
npm run db:migrate     # Tạo migration có lịch sử (gần với production hơn)
npm run db:seed        # Nạp dữ liệu mẫu + tạo embedding cho sản phẩm
npm run db:studio      # Mở giao diện xem/sửa DB trên trình duyệt

# --- Phát triển ---
npm run dev            # Chạy app ở http://localhost:3000
npm run build          # Build production
npm run format         # Tự động format toàn bộ code cho đẹp/đều (Prettier)
npm run format:check   # Chỉ kiểm tra đã format chưa (không sửa) — dùng trong CI
npm run typecheck      # Kiểm tra kiểu TypeScript (tsc --noEmit) — KHÔNG có lint riêng đáng tin, chạy cái này
npm run test           # Chạy test 1 lần (Vitest)
npm run test:watch     # Chạy test ở chế độ theo dõi
```

> **Prettier** lo việc canh lề, xuống dòng, sắp xếp class Tailwind cho đồng nhất — bạn cứ gõ code
> thoải mái rồi chạy `npm run format`, không phải canh tay. Cấu hình ở `.prettierrc.json`,
> danh sách bỏ qua ở `.prettierignore` (đã bỏ qua `docs/` và `*.md` để giữ nguyên bảng/sơ đồ thủ công).

### Cần cài sẵn trên máy (làm 1 lần)
- **Node.js 20+** (chạy `node -v` để kiểm tra) — kèm theo `npm`.
- **Docker Desktop** — để bật PostgreSQL + Redis mà không phải cài tay. Phải **mở Docker Desktop trước** khi chạy `docker:up`.
- Git (để clone), một trình soạn thảo (VS Code).

### Chạy lần đầu (làm theo đúng thứ tự)
```bash
cp .env.example .env     # 1. Tạo file cấu hình từ mẫu (chưa cần sửa gì để chạy local)
npm install              # 2. Tải thư viện → sinh ra thư mục node_modules
npm run docker:up        # 3. Bật PostgreSQL + Redis (Docker Desktop phải đang chạy)
npm run db:push          # 4. Tạo các bảng trong DB theo schema.prisma
npm run db:seed          # 5. Nạp sản phẩm mẫu + tạo embedding để tìm kiếm
npm run dev              # 6. Chạy app → mở http://localhost:3000
```
Sau bước 6, mở trình duyệt thấy **trang chủ có danh sách sản phẩm** là thành công.
Tài khoản mẫu để thử (tạo bởi `prisma/seed.ts`):
- Admin: `admin@shop.vn` / `admin123` → đăng nhập xong vào `/admin` để tạo sản phẩm.
- Khách: `user@shop.vn` / `user123` → mua hàng, xem đơn ở `/don-hang`.

> Lưu ý: chưa cấu hình ESLint thật sự (script `lint` gọi `next lint` mặc định).
> **Cổng kiểm tra chính trước khi coi là "xong" là `npm run typecheck` + `npm run test`.**

### Gặp lỗi thường gặp (người mới hay kẹt ở đây)
| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|-------------|------------------------|------------|
| `Cannot connect to the Docker daemon` | Chưa mở Docker Desktop | Mở Docker Desktop, đợi nó "running" rồi chạy lại `npm run docker:up` |
| `Can't reach database server` / `ECONNREFUSED ...5432` | Postgres chưa lên hoặc `DATABASE_URL` sai | Chạy `npm run docker:up`; kiểm tra `.env` khớp `docker-compose.yml` |
| `Port 3000 is already in use` | Đã có app khác chiếm cổng 3000 | Tắt app cũ, hoặc chạy `next dev -p 3001` |
| Trang chủ trống, không có sản phẩm | Quên nạp dữ liệu mẫu | Chạy `npm run db:seed` |
| Tìm kiếm ngữ nghĩa không ra gì | Sản phẩm chưa có embedding | Chạy lại `npm run db:seed` hoặc API admin `product.reindexEmbeddings` |
| Sửa `schema.prisma` xong code báo lỗi kiểu | Chưa sinh lại Prisma Client | Chạy `npm run db:generate` |

---

## 4. Cấu trúc thư mục

```
src/
├── app/                      # Next.js App Router — mỗi thư mục = 1 trang (route)
│   ├── api/[[...route]]/     # ★ Điểm vào BACKEND: Hono + tRPC mount tại đây
│   ├── page.tsx              # Trang chủ
│   ├── san-pham/[slug]/      # Chi tiết sản phẩm
│   ├── gio-hang/             # Giỏ hàng
│   ├── tim-kiem/             # Tìm kiếm
│   ├── dang-nhap/ dang-ky/   # Auth
│   ├── don-hang/             # Đơn hàng của tôi
│   ├── admin/                # Trang quản trị
│   └── layout.tsx            # Khung chung + providers
├── server/                   # ★ Toàn bộ BACKEND tRPC
│   ├── trpc.ts               # Khởi tạo tRPC + các "procedure" theo quyền
│   ├── context.ts            # "Túi đồ" mỗi request: prisma, redis, user
│   ├── root.ts               # Gom router con → appRouter (xuất type cho client)
│   └── routers/              # product.ts, auth.ts, order.ts
├── lib/                      # Logic & kết nối dùng chung
│   ├── prisma.ts redis.ts    # Singleton kết nối DB / cache
│   ├── auth.ts               # Băm mật khẩu (bcrypt) + JWT (jose)
│   ├── cart.ts (+.test.ts)   # Logic giỏ hàng THUẦN → dễ test
│   ├── embeddings.ts         # Văn bản → vector (OpenAI hoặc local)
│   ├── vector-search.ts      # Tìm kiếm ngữ nghĩa qua raw SQL pgvector
│   └── health.ts utils.ts
├── components/               # UI (ui/ = shadcn; còn lại là component nghiệp vụ)
├── store/                    # auth-store, cart-store (state phía client)
└── trpc/client.tsx           # Cấu hình tRPC client + React Query Provider
prisma/schema.prisma          # ★ Định nghĩa database
docs/                         # Tài liệu học chi tiết theo từng chương (tiếng Việt)
```

`★` = file quan trọng nhất, nên đọc đầu tiên khi muốn hiểu một mảng.

---

## 5. Các luồng logic cốt lõi (hiểu được 4 cái này là nắm cả app)

> 💡 Gặp từ lạ (middleware, procedure, `ctx`, embedding...)? Nhảy xuống **mục 5b — Thuật ngữ nhanh** để tra trong 1 dòng rồi quay lại.

### 5.1. Một API request đi như thế nào?

**Các bước:**
1. Component React gọi `trpc.product.list.useQuery()` (xem `src/trpc/client.tsx`).
2. Client gửi HTTP tới `/api/trpc`, **tự đính kèm** `Authorization: Bearer <token>` lấy từ `localStorage`.
3. Route `src/app/api/[[...route]]/route.ts` (Hono) nhận request, mount tRPC.
4. `createContext` (`src/server/context.ts`) đọc token → giải mã ra `user`, đóng gói cùng `prisma`+`redis`.
5. `appRouter` định tuyến tới đúng procedure (vd `product.list`), chạy logic, trả dữ liệu — **kèm kiểu**.
6. React Query lo cache/loading/refetch ở phía client.

**Phía backend — định nghĩa API** (`src/server/routers/product.ts`):
```ts
export const productRouter = router({
  bySlug: publicProcedure                       // 1. chọn mức quyền
    .input(z.object({ slug: z.string() }))      // 2. Zod kiểm tra input
    .query(async ({ ctx, input }) => {          // 3. ctx = {prisma, redis, user}
      return ctx.prisma.product.findUnique({    // 4. trả dữ liệu (TS tự suy ra kiểu)
        where: { slug: input.slug },
        include: { category: true },
      });
    }),
});
```

**Phía frontend — gọi chính API đó:**
```tsx
const { data, isLoading } = trpc.product.bySlug.useQuery({ slug: "iphone-15" });
//      └─ gợi ý tự động ─┘                        └─ TS BÁO LỖI nếu thiếu `slug`
// data có kiểu Product & { category: Category } | undefined — KHÔNG cần khai báo tay
```

> **"Ma thuật" của tRPC:** `AppRouter` chỉ là một **type** được `export type` ở `root.ts` rồi
> `import type` ở client. Không có code backend nào bị gửi xuống trình duyệt — frontend chỉ "mượn
> kiểu" để được autocomplete và kiểm tra lúc biên dịch. Sửa tên/kiểu ở backend → frontend đỏ ngay,
> đó là lý do gọi là **end-to-end type-safe**.

---

### 5.2. Phân quyền (3 mức procedure) — `src/server/trpc.ts`

Ý tưởng: dùng **middleware** để "gác cổng" *trước khi* handler chạy, thay vì if/else lặp lại khắp nơi.

```ts
// Gác cổng: chưa đăng nhập → chặn ngay
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } }); // truyền tiếp, user chắc chắn ≠ null
});

export const publicProcedure   = t.procedure;                  // ai cũng gọi được
export const protectedProcedure = t.procedure.use(isAuthed);   // phải đăng nhập
export const adminProcedure    = protectedProcedure.use(isAdmin); // + phải là ADMIN
```

| Procedure | Điều kiện | Lỗi nếu fail |
|-----------|-----------|--------------|
| `publicProcedure` | không | — |
| `protectedProcedure` | `ctx.user != null` | `UNAUTHORIZED` |
| `adminProcedure` | đăng nhập **và** `role === "ADMIN"` | `FORBIDDEN` |

> Khi viết API mới: **chọn đúng procedure theo quyền**, đừng tự `if (user.role...)` trong handler.
> Để ý mẹo `next({ ctx: { ...ctx, user: ctx.user } })` — nó "thu hẹp kiểu" để bên trong handler
> TypeScript biết `ctx.user` không còn là `null`.

---

### 5.3. Cache-aside với Redis — `src/lib/redis.ts`

**Mẫu cache-aside** (ứng dụng tự quản cache): hỏi cache trước, trượt thì hỏi DB rồi nhớ lại.

```ts
export async function cacheAside<T>(key, fetcher, ttl = 60): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);   // ✅ cache HIT → trả ngay
  } catch { /* Redis lỗi → bỏ qua, KHÔNG làm sập app */ }

  const data = await fetcher();              // ❌ cache MISS → gọi DB
  try { await redis.set(key, JSON.stringify(data), "EX", ttl); } catch {}
  return data;
}
```

Dùng trong API (`product.list`) và **làm mới (invalidate) khi ghi dữ liệu**:
```ts
const product = await ctx.prisma.product.create({ data: input });
const keys = await redis.keys("products:*");      // tìm mọi cache liên quan
if (keys.length) await redis.del(...keys);        // xóa để lần sau lấy dữ liệu mới
```

Hai nguyên tắc quan trọng:
- **Redis không bao giờ được làm sập app** — mọi thao tác bọc `try/catch`, lỗi thì gọi thẳng DB.
- **Ghi là phải xóa cache cũ** — nếu không, người dùng sẽ thấy dữ liệu lỗi thời tới 60s.

---

### 5.4. Tìm kiếm ngữ nghĩa (vector) — `embeddings.ts` + `vector-search.ts`

Khác tìm kiếm thường (so khớp *chữ*), tìm ngữ nghĩa so khớp *ý nghĩa*: gõ "điện thoại chụp đẹp"
vẫn ra iPhone dù mô tả không chứa đúng từ đó.

**Bước 1 — Văn bản → vector số** (`embeddings.ts`): mỗi sản phẩm/câu hỏi biến thành 1 mảng 384 số.
Có `OPENAI_API_KEY` thì dùng model thật; không có thì dùng hàm hash local (yếu hơn nhưng chạy offline, đủ học).

**Bước 2 — Lưu & truy vấn bằng raw SQL** (`vector-search.ts`). Prisma **chưa hỗ trợ kiểu `vector`**
nên cột khai báo `Unsupported("vector(384)")` và phải viết SQL tay:
```ts
// <=> = khoảng cách cosine của pgvector (càng NHỎ càng giống nhau)
const rows = await prisma.$queryRawUnsafe(`
  SELECT p.id, p.name,
         (1 - (p.embedding <=> $1::vector)) AS similarity   -- đổi sang "độ giống"
  FROM "Product" p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <=> $1::vector                        -- gần nhất lên đầu
  LIMIT $2
`, toVectorLiteral(vec), limit);
```

> Muốn tìm ngữ nghĩa hoạt động, sản phẩm phải có sẵn embedding → chạy `npm run db:seed`
> hoặc API admin `product.reindexEmbeddings`.

---

## 5b. Thuật ngữ nhanh cho người mới

| Thuật ngữ | Hiểu nôm na |
|-----------|-------------|
| **ORM** (Prisma) | Lớp dịch giữa code và SQL — viết `prisma.product.findMany()` thay vì SQL thô. |
| **Type-safe** | Sai kiểu dữ liệu bị bắt **lúc gõ code/biên dịch**, không phải lúc chạy mới vỡ. |
| **Middleware** | Hàm chạy *xen giữa* trước khi tới handler chính (gác cổng, ghi log, kiểm quyền). |
| **Context (`ctx`)** | "Túi đồ" tạo cho **mỗi request**, mang theo `prisma`, `redis`, `user`. |
| **Procedure** | Một endpoint API trong tRPC (`.query` = đọc, `.mutation` = ghi). |
| **Cache-aside** | Hỏi cache trước, trượt thì hỏi DB rồi lưu lại cho lần sau. |
| **TTL** | "Hạn dùng" của 1 mục cache (ở đây 60 giây) — hết hạn thì tự mất. |
| **Embedding** | Vector số biểu diễn *ý nghĩa* của văn bản để máy so sánh được. |
| **Cosine distance** | Cách đo 2 vector "lệch hướng" bao nhiêu — nhỏ = giống nghĩa. |
| **JWT** | "Vé đăng nhập" đã ký — sửa nội dung là chữ ký sai, server phát hiện ngay. |
| **Singleton** | Chỉ tạo **một** kết nối DB/Redis dùng lại, tránh tạo trùng khi hot-reload. |
| **Pure function** | Hàm cùng input luôn cho cùng output, không gây tác dụng phụ → dễ test. |
| **Hydration / `"use client"`** | Component có `"use client"` chạy được ở trình duyệt (có state, sự kiện). |

---

## 6. Quy ước & "luật chơi" khi sửa code

- **Tiền tệ lưu bằng số nguyên (đồng), kiểu `Int`** — tránh sai số dấu phẩy động. Đừng đổi sang `Float`.
- **Không bao giờ lưu mật khẩu thô** — luôn `hashPassword` trước khi ghi DB.
- **Validate mọi input API bằng Zod** (`.input(z.object({...}))`). Không tin dữ liệu từ client.
- **Logic nghiệp vụ thuần tách ra `src/lib`** (như `cart.ts`) để viết được unit test mà không cần DB/React.
  Hàm thuần: cùng input → cùng output, không sửa tham số đầu vào (trả về mảng/đối tượng mới).
- **Kết nối dùng singleton** (`prisma`, `redis` qua `globalThis`) để không tạo trùng kết nối khi hot-reload.
- **Backend chạy `runtime = "nodejs"`** (không phải edge) vì dùng Prisma/bcrypt/ioredis.
- Thêm router con mới: tạo file trong `src/server/routers/`, đăng ký trong `src/server/root.ts`.
- Giữ **comment tiếng Việt giải thích "vì sao"** ngang mức các file hiện có — đây là dự án để học.
- Sau khi sửa `schema.prisma` → nhớ chạy `npm run db:generate` (và `db:push`/`db:migrate`).

---

## 7. Biến môi trường (`.env`)

Copy từ `.env.example`. Các biến chính:
- `DATABASE_URL` — chuỗi kết nối PostgreSQL (đã bật pgvector).
- `REDIS_URL` — kết nối Redis.
- `JWT_SECRET` — khóa ký JWT (**đổi thành chuỗi ngẫu nhiên dài trong thực tế**).
- `NEXT_PUBLIC_APP_URL` — URL gốc app (client dùng để gọi API; tiền tố `NEXT_PUBLIC_` = lộ ra trình duyệt).
- `OPENAI_API_KEY` — *tùy chọn*; có thì embedding chất lượng cao hơn, không có thì dùng local.

> `.env` **không commit** lên git (đã có trong `.gitignore`). Chỉ commit `.env.example`.

---

## 8. Học sâu hơn ở đâu?

Thư mục `docs/` có giải thích chi tiết từng chương (tiếng Việt) — đọc khi cần đào sâu:

- [docs/01-TONG-QUAN-KIEN-TRUC.md](docs/01-TONG-QUAN-KIEN-TRUC.md) — kiến trúc tổng thể
- [docs/02-CAU-HINH-DU-AN.md](docs/02-CAU-HINH-DU-AN.md) — cấu hình dự án
- [docs/03-DATABASE-PRISMA.md](docs/03-DATABASE-PRISMA.md) — database & Prisma
- [docs/04-BACKEND-HONO-TRPC.md](docs/04-BACKEND-HONO-TRPC.md) — backend Hono + tRPC + vector
- [docs/05-FRONTEND-NEXT-REACT.md](docs/05-FRONTEND-NEXT-REACT.md) — frontend Next + React
- [docs/06-DEVOPS-MONITORING.md](docs/06-DEVOPS-MONITORING.md) — Docker, CI, monitoring
- [docs/07-CHI-TIET-TUNG-FILE.md](docs/07-CHI-TIET-TUNG-FILE.md) — giải thích từng file
- [docs/GIAI-THICH-TOAN-BO.md](docs/GIAI-THICH-TOAN-BO.md) — tổng hợp tất cả

Lộ trình đề xuất cho người mới: `prisma/schema.prisma` (dữ liệu) → `src/server/trpc.ts` + `context.ts`
(xương sống backend) → `src/server/routers/product.ts` (1 ví dụ API thật) → `src/lib/cart.ts` + `cart.test.ts`
(logic thuần + test) → `src/trpc/client.tsx` + một trang trong `src/app` (cách frontend gọi API).
