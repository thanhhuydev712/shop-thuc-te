// ============================================================
// VECTOR SEARCH — pgvector qua raw SQL (Prisma Unsupported type).
// Giải thích: docs/04-BACKEND-HONO-TRPC.md
// ============================================================
import { prisma } from "@/lib/prisma";
import { createEmbedding, toVectorLiteral } from "@/lib/embeddings";

// ============================================================
// Tìm kiếm vector — dùng pgvector qua raw SQL (Prisma chưa có kiểu vector).
// ============================================================

export interface SemanticSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: string;
  similarity: number;
}

/** Lưu embedding cho 1 sản phẩm. */
export async function upsertProductEmbedding(
  productId: string,
  text: string,
): Promise<void> {
  const vec = await createEmbedding(text);
  const literal = toVectorLiteral(vec);
  await prisma.$executeRawUnsafe(
    `UPDATE "Product" SET embedding = $1::vector WHERE id = $2`,
    literal,
    productId,
  );
}

/** Tìm sản phẩm gần nghĩa nhất với câu truy vấn (cosine distance). */
export async function semanticSearch(
  query: string,
  limit = 12,
): Promise<SemanticSearchResult[]> {
  const vec = await createEmbedding(query);
  const literal = toVectorLiteral(vec);

  // <=> là toán tử cosine distance trong pgvector (càng nhỏ càng giống).
  const rows = (await prisma.$queryRawUnsafe(
    `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.stock,
      p."imageUrl",
      p."categoryId",
      (1 - (p.embedding <=> $1::vector))::float AS similarity
    FROM "Product" p
    WHERE p.embedding IS NOT NULL
    ORDER BY p.embedding <=> $1::vector
    LIMIT $2
    `,
    literal,
    limit,
  )) as SemanticSearchResult[];

  return rows;
}
