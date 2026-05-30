// TRANG TÌM KIẾM VECTOR — trpc.product.semanticSearch · docs/04-BACKEND-HONO-TRPC.md
"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/store/cart-store";
import { Badge } from "@/components/ui/badge";

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("điện thoại cao cấp");
  const [submitted, setSubmitted] = useState("");
  const cart = useCart();

  const {
    data: results,
    isLoading,
    isFetching,
  } = trpc.product.semanticSearch.useQuery(
    { query: submitted },
    { enabled: submitted.length > 0 },
  );

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
        <h1 className="text-2xl font-bold">Tìm kiếm ngữ nghĩa (pgvector)</h1>
        <p className="text-muted-foreground">
          Mô tả nhu cầu bằng ngôn ngữ tự nhiên — hệ thống tìm sản phẩm gần nghĩa
          nhất.
        </p>
        <Badge variant="secondary">Vector DB · cosine similarity</Badge>
      </section>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query.trim());
        }}
      >
        <Input
          placeholder='Ví dụ: "laptop mỏng pin lâu" hoặc "tai nghe chống ồn"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isFetching}>
          Tìm
        </Button>
      </form>

      {isLoading && submitted && <p>Đang tìm kiếm vector...</p>}

      {results && (
        <>
          <p className="text-muted-foreground text-sm">
            {results.length} kết quả cho &quot;{submitted}&quot;
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => (
              <div key={p.id} className="relative">
                <ProductCard product={p} onAddToCart={handleAdd} />
                {"similarity" in p && (
                  <Badge className="absolute top-2 right-2" variant="outline">
                    {Math.round((p.similarity as number) * 100)}% khớp
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {submitted && !isLoading && results?.length === 0 && (
        <p className="text-muted-foreground">
          Chưa có embedding. Chạy{" "}
          <code className="bg-muted rounded px-1">npm run db:seed</code> hoặc
          reindex từ trang Admin.
        </p>
      )}
    </div>
  );
}
