import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";
import { cacheAside, redis } from "@/lib/redis";
import { semanticSearch, upsertProductEmbedding } from "@/lib/vector-search";

// ============================================================
// ROUTER SẢN PHẨM — các API liên quan đến sản phẩm.
// z.object(...) dùng thư viện Zod để KIỂM TRA dữ liệu đầu vào.
// ============================================================

export const productRouter = router({
  // Lấy danh sách sản phẩm (có thể lọc theo danh mục + tìm kiếm).
  // Dùng cache Redis để tăng tốc.
  list: publicProcedure
    .input(
      z
        .object({
          categorySlug: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const cacheKey = `products:${input?.categorySlug ?? "all"}:${input?.search ?? ""}`;

      return cacheAside(cacheKey, () =>
        ctx.prisma.product.findMany({
          where: {
            category: input?.categorySlug
              ? { slug: input.categorySlug }
              : undefined,
            name: input?.search
              ? { contains: input.search, mode: "insensitive" }
              : undefined,
          },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        }),
      );
    }),

  // Lấy chi tiết 1 sản phẩm theo slug.
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.product.findUnique({
        where: { slug: input.slug },
        include: { category: true },
      });
    }),

  // Tạo sản phẩm mới — CHỈ ADMIN. Sau khi tạo thì xóa cache cũ.
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string(),
        price: z.number().int().positive(),
        stock: z.number().int().min(0),
        imageUrl: z.string().url(),
        categoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.create({ data: input });
      // Xóa cache để lần lấy tiếp theo có dữ liệu mới.
      try {
        const keys = await redis.keys("products:*");
        if (keys.length) await redis.del(...keys);
      } catch {
        /* bỏ qua nếu redis lỗi */
      }
      // Tạo embedding cho tìm kiếm ngữ nghĩa.
      await upsertProductEmbedding(
        product.id,
        `${product.name}. ${product.description}`,
      ).catch(() => {});

      return product;
    }),

  // Tìm kiếm ngữ nghĩa bằng pgvector (cần đã chạy seed / reindex).
  semanticSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional(),
      }),
    )
    .query(async ({ input }) => {
      return semanticSearch(input.query, input.limit ?? 12);
    }),

  // ADMIN: tạo lại embedding cho tất cả sản phẩm.
  reindexEmbeddings: adminProcedure.mutation(async ({ ctx }) => {
    const products = await ctx.prisma.product.findMany();
    let count = 0;
    for (const p of products) {
      await upsertProductEmbedding(p.id, `${p.name}. ${p.description}`);
      count++;
    }
    try {
      const keys = await redis.keys("products:*");
      if (keys.length) await redis.del(...keys);
    } catch {
      /* bỏ qua */
    }
    return { indexed: count };
  }),
});
