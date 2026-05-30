# Chương 5 — Frontend: Next.js + React

## App Router (`src/app/`)

Next.js 15 dùng **thư mục = route**:

| File | Route | Kiểu |
|------|-------|------|
| `layout.tsx` | bọc mọi trang | Server Component |
| `page.tsx` | `/` | Client (`"use client"`) |
| `san-pham/[slug]/page.tsx` | `/san-pham/iphone-15-pro` | Dynamic segment |
| `dang-nhap/page.tsx` | `/dang-nhap` | Form login |
| ... | | |

### `layout.tsx`

- Import **globals.css** (Tailwind + biến màu shadcn).
- Font **Inter** (hỗ trợ tiếng Việt).
- Bọc `<Providers>` → Header → `{children}` → Footer.
- `metadata` — title/description SEO.

### `globals.css`

- `@import "tailwindcss"` — Tailwind v4.
- `@theme inline` — map biến CSS → class Tailwind (`bg-background`, `text-primary`...).
- `:root` / `.dark` — design tokens shadcn (oklch colors).

## Providers (`src/components/providers.tsx`)

Thứ tự bọc (từ ngoài vào trong):

```
TRPCProvider → AuthProvider → CartProvider → children
```

- tRPC cần bọc ngoài vì Auth/Cart có thể gọi `trpc.*` hooks.

## tRPC Client (`src/trpc/client.tsx`)

- `createTRPCReact<AppRouter>()` — hooks type-safe: `trpc.product.list.useQuery()`.
- **httpBatchLink** — gộp nhiều request thành một HTTP call.
- **superjson** — khớp transformer phía server.
- **headers()** — đọc token từ `localStorage`, gửi `Authorization: Bearer ...`.
- **getBaseUrl()** — browser dùng `window.location.origin`; SSR dùng env.

## Auth Store (`src/store/auth-store.tsx`)

- Lưu JWT key `token` trong localStorage.
- Khi có token → `trpc.auth.me.useQuery()` lấy profile.
- `login(token, user)` / `logout()` — đồng bộ state + storage.
- `useAuth()` — hook dùng trong component.

## Cart Store (`src/store/cart-store.tsx`)

- State `lines: CartLine[]` trong React state.
- `useEffect` — đọc/ghi `localStorage` key `cart`.
- `add`, `remove`, `clear`, `subtotal`, `grandTotal`, `count`.
- Dùng hàm từ `@/lib/cart` để tính tiền.

## Components

### `site-header.tsx`

- Logo, link Tìm kiếm / Giỏ / Đơn hàng / Admin (nếu ADMIN).
- Hiện badge số lượng giỏ, nút Đăng nhập hoặc Thoát.

### `product-card.tsx`

- Hiển thị ảnh (next/image), tên, giá `formatVND`, nút Thêm giỏ.
- Props `onAddToCart` optional — trang chủ truyền callback.

### `components/ui/*` (shadcn)

- **button.tsx** — `cva` variants: default, outline, ghost...
- **card.tsx** — CardHeader, CardTitle, CardContent, CardFooter.
- **input.tsx**, **label.tsx** — form.
- **badge.tsx**, **separator.tsx** — UI phụ.

Tất cả dùng `cn()` từ `@/lib/utils` để merge class Tailwind.

## Từng trang — logic chính

### `/` — `page.tsx`

- `trpc.product.list.useQuery({ categorySlug, search })`.
- State lọc danh mục + ô tìm kiếm.
- Grid `ProductCard`, `cart.add()` khi bấm Thêm giỏ.

### `/san-pham/[slug]` — `page.tsx`

- `useParams()` lấy slug.
- `trpc.product.bySlug.useQuery({ slug })`.
- Nút thêm giỏ + link sang `/gio-hang`.

### `/dang-nhap`, `/dang-ky`

- Form controlled state.
- `trpc.auth.login/register.useMutation`.
- Thành công → `login()` + `router.push("/")`.

### `/gio-hang`

- Hiển thị `cart.lines`, phí ship, tổng.
- Chưa login → link đăng nhập.
- Đã login → `order.checkout.mutate({ items })` → clear giỏ → `/don-hang`.

### `/don-hang`

- `order.myOrders.useQuery` khi có `user`.
- Hiển thị status, items, tổng tiền.

### `/tim-kiem`

- `product.semanticSearch.useQuery` khi user submit câu hỏi.
- Badge % similarity trên mỗi card.

### `/admin`

- Chỉ `user.role === "ADMIN"`.
- Reindex embeddings, form tạo sản phẩm (`product.create`).

## `src/lib/utils.ts`

- **cn(...)** — `clsx` + `tailwind-merge` (chuẩn shadcn).
- **formatVND(n)** — `Intl.NumberFormat` locale `vi-VN`.

Chương tiếp theo: [06-DEVOPS-MONITORING.md](./06-DEVOPS-MONITORING.md)
