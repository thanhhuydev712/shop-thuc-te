# Chương 3 — Database & Prisma

## File `prisma/schema.prisma`

Prisma dùng file này mô tả **cấu trúc bảng**. Chạy `npm run db:generate` để sinh **Prisma Client** (code TypeScript truy vấn DB).

### Generator & datasource

```prisma
previewFeatures = ["postgresqlExtensions"]  // bật extension PostgreSQL
extensions = [vector]                      // pgvector
```

### Model `User`

| Cột | Kiểu | Giải thích |
|-----|------|------------|
| id | String @id @default(cuid()) | ID ngẫu nhiên |
| email | String @unique | Email duy nhất |
| passwordHash | String | Mật khẩu đã bcrypt — không lưu plain text |
| role | Role enum | USER hoặc ADMIN |

### Model `Category`

- `slug` — dùng trong URL, ví dụ `dien-thoai`.

### Model `Product`

- **price: Int** — giá bằng **số nguyên đồng** (tránh lỗi float 0.1 + 0.2).
- **stock** — tồn kho, giảm khi checkout.
- **embedding** — `Unsupported("vector(384)")` — Prisma không map kiểu vector; đọc/ghi bằng **raw SQL**.

### Model `Order` & `OrderItem`

- **Order.status** — PENDING → PAID → SHIPPED → COMPLETED hoặc CANCELLED.
- **OrderItem.unitPrice** — giá tại thời điểm mua (sản phẩm có thể đổi giá sau).

### Quan hệ

```
User 1───n Order 1───n OrderItem n───1 Product
Category 1───n Product
```

## File `prisma/seed.ts`

Script **đổ dữ liệu mẫu** khi học / test:

1. Tạo admin (`admin@shop.vn` / `admin123`) và user demo.
2. Tạo 3 danh mục, 6 sản phẩm.
3. Với mỗi sản phẩm: gọi `upsertProductEmbedding()` để tạo vector tìm kiếm.

Chạy: `npm run db:seed`

## File `src/lib/prisma.ts`

- Tạo **một** instance `PrismaClient` dùng chung (tránh tràn connection khi Next.js hot reload).
- Dev: log SQL query để học.

## pgvector hoạt động thế nào?

1. Văn bản `"iPhone 15 Pro. Điện thoại cao cấp..."` → mảng 384 số (embedding).
2. Lưu vào cột `embedding` kiểu `vector(384)`.
3. Khi user tìm `"điện thoại cao cấp"` → embedding câu hỏi → so **cosine distance** (`<=>` trong SQL).
4. Kết quả gần nghĩa nhất xếp trước.

Embedding tạo bởi:

- `src/lib/embeddings.ts` — OpenAI nếu có key, không thì **localEmbedding** (hash từ khóa, đủ cho demo).

Chi tiết code: `src/lib/vector-search.ts` — xem [04-BACKEND-HONO-TRPC.md](./04-BACKEND-HONO-TRPC.md).

Chương tiếp theo: [04-BACKEND-HONO-TRPC.md](./04-BACKEND-HONO-TRPC.md)
