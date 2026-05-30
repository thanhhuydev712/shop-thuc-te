# Chương 2 — File cấu hình dự án

## `package.json`

- **name**: `shop-thuc-te` — tên package npm.
- **scripts**:
  - `dev` — `next dev` chạy server phát triển port 3000.
  - `build` / `start` — build và chạy production.
  - `typecheck` — `tsc --noEmit` kiểm tra TypeScript không build.
  - `test` — Vitest chạy file `*.test.ts`.
  - `db:*` — Prisma: generate client, push schema, migrate, seed, studio.
  - `docker:up` / `docker:down` — bật/tắt Postgres + Redis.

## `tsconfig.json`

- **strict: true** — bắt lỗi kiểu nghiêm ngặt.
- **paths `@/*`** — import `@/lib/utils` = `src/lib/utils`.
- **noEmit: true** — TypeScript chỉ kiểm tra, Next.js lo compile.

## `next.config.ts`

- **reactStrictMode** — dev gọi effect 2 lần để phát hiện side effect sai.
- **images.remotePatterns** — cho phép ảnh từ `picsum.photos`, `unsplash`.
- **serverExternalPackages** — Prisma, bcrypt, ioredis không bundle vào client (chỉ chạy server).

## `postcss.config.mjs`

- Plugin `@tailwindcss/postcss` — Tailwind **v4** tích hợp qua PostCSS.

## `components.json`

- Cấu hình **shadcn/ui**: style `new-york`, alias `@/components`, CSS tại `src/app/globals.css`.

## `vitest.config.ts`

- **environment: node** — test chạy trên Node, không cần trình duyệt.
- **include: src/**/*.test.ts** — chỉ file test trong `src/`.
- **alias @** — giống tsconfig.

## `.env` / `.env.example`

| Biến | Ý nghĩa |
|------|---------|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL |
| `REDIS_URL` | Chuỗi kết nối Redis |
| `JWT_SECRET` | Khóa ký JWT — phải dài, ngẫu nhiên, giữ bí mật |
| `NEXT_PUBLIC_APP_URL` | URL gốc app (client tRPC dùng khi SSR) |
| `OPENAI_API_KEY` | (Tùy chọn) embedding OpenAI |

**Không commit `.env`** — đã có trong `.gitignore`.

## `docker-compose.yml`

- **postgres**: image `pgvector/pgvector:pg16`, user `shop`, DB `shop_db`, port 5432.
- **redis**: port 6379.
- **volumes** — dữ liệu persist khi restart container.

## `vercel.json`

- Gợi ý deploy Vercel: region `sin1`, build kèm `prisma generate`.
- Env tham chiếu secret trên Vercel (`@database_url`...).

## `.github/workflows/ci.yml`

Mỗi push/PR:

1. Spin up Postgres (pgvector) + Redis trên GitHub Actions.
2. `npm install` → `prisma generate` → `db push` → `seed`.
3. `typecheck` → `test` → `build`.

Chương tiếp theo: [03-DATABASE-PRISMA.md](./03-DATABASE-PRISMA.md)
