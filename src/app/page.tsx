// ============================================================
// TRANG CHỦ (/) — Danh sách sản phẩm, lọc danh mục, tìm tên, thêm giỏ.
// Gọi API: trpc.product.list.useQuery(...)
// Giải thích: docs/05-FRONTEND-NEXT-REACT.md
// ============================================================
"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/store/cart-store";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { slug: "", label: "Tất cả" },
  { slug: "dien-thoai", label: "Điện thoại" },
  { slug: "laptop", label: "Laptop" },
  { slug: "phu-kien", label: "Phụ kiện" },
];

export default function HomePage() {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const cart = useCart();

  const { data: products, isLoading } = trpc.product.list.useQuery({
    categorySlug: category || undefined,
    search: search || undefined,
  });

  const handleAdd = (p: ProductCardData) => {
    cart.add({
      productId: p.id,
      name: p.name,
      unitPrice: p.price,
      quantity: 1,
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cửa hàng điện tử</h1>
        <p className="text-muted-foreground">
          Next.js 15 · React 19 · tRPC · Prisma · Redis · pgvector
        </p>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Tìm theo tên sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c.slug}
              variant={category === c.slug ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(c.slug)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải sản phẩm...</p>
      ) : !products?.length ? (
        <p className="text-muted-foreground">
          Không có sản phẩm. Chạy seed: npm run db:seed
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={handleAdd} />
          ))}
        </div>
      )}

      <div className="bg-muted/40 rounded-lg border p-4 text-sm">
        <Badge variant="outline" className="mb-2">
          Demo
        </Badge>
        <p>
          Tài khoản mẫu: <strong>user@shop.vn</strong> /{" "}
          <strong>user123</strong> · Admin: <strong>admin@shop.vn</strong> /{" "}
          <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
}
