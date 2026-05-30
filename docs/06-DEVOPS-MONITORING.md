# Chương 6 — DevOps & Monitoring

## Docker local

```bash
npm run docker:up    # docker compose up -d
npm run docker:down  # dừng container
```

- Postgres: `localhost:5432`, user/pass trong `.env.example`.
- Redis: `localhost:6379`.
- **healthcheck** trong compose — đợi DB sẵn sàng trước khi seed.

## Quy trình phát triển đầy đủ

```bash
cp .env.example .env
npm run docker:up
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Deploy Vercel

1. Push code lên GitHub.
2. Import project Vercel → framework Next.js.
3. Environment variables:
   - `DATABASE_URL` — Postgres có **pgvector** (Supabase, Neon, RDS...).
   - `REDIS_URL` — Upstash Redis hoặc tương đương.
   - `JWT_SECRET` — chuỗi bí mật dài.
   - `NEXT_PUBLIC_APP_URL` — URL production.
4. Build command (trong `vercel.json`): `prisma generate && next build`.

**Lưu ý**: Serverless có giới hạn thời gian — transaction checkout nên giữ gọn.

## AWS (gợi ý mở rộng)

| Dịch vụ | Dùng cho |
|---------|----------|
| RDS PostgreSQL + pgvector | Database |
| ElastiCache | Redis |
| ECS/Fargate hoặc Amplify | Chạy Next.js |
| S3 + CloudFront | Ảnh sản phẩm tĩnh |
| CloudWatch | Log + alarm từ `/api/health` |
| GitHub Actions → ECR | CI/CD deploy image |

Dự án hiện có **CI trên GitHub**; Terraform/AWS chưa code sẵn — có thể thêm sau.

## CI/CD — `.github/workflows/ci.yml`

Pipeline tự động:

1. Checkout code.
2. Services: Postgres pgvector + Redis container.
3. Cài dependency, push schema, seed.
4. `typecheck` → `test` → `build`.

Nếu fail → PR không nên merge (bảo vệ chất lượng).

## Monitoring — `/api/health`

Response mẫu:

```json
{
  "status": "ok",
  "time": "2026-05-29T...",
  "checks": {
    "database": "up",
    "redis": "up"
  }
}
```

- **ok** — cả hai up.
- **degraded** — một trong hai down (app vẫn có thể chạy một phần).
- **error** + HTTP **503** — cả hai down.

Dùng cho: Uptime Robot, Kubernetes liveness probe, load balancer.

## Test — `src/lib/cart.test.ts`

Vitest kiểm tra logic giỏ hàng **không cần DB**:

- Tính tổng dòng, subtotal, phí ship, grand total.
- `addToCart` gộp quantity khi trùng `productId`.

Chạy: `npm test`

Chương tiếp theo: [07-CHI-TIET-TUNG-FILE.md](./07-CHI-TIET-TUNG-FILE.md)
