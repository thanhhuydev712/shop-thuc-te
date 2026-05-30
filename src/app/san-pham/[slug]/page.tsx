// TRANG CHI TIẾT SẢN PHẨM — /san-pham/[slug] · docs/07-CHI-TIET-TUNG-FILE.md
"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/utils";
import { useCart } from "@/store/cart-store";
import Link from "next/link";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const cart = useCart();
  const { data: product, isLoading } = trpc.product.bySlug.useQuery({ slug });

  if (isLoading) return <p>Đang tải...</p>;
  if (!product) return <p>Không tìm thấy sản phẩm.</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-xl border">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      <div className="space-y-4">
        {product.category && (
          <Badge variant="secondary">{product.category.name}</Badge>
        )}
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-primary text-2xl font-semibold">
          {formatVND(product.price)}
        </p>
        <p className="text-muted-foreground">{product.description}</p>
        <p className="text-sm">Tồn kho: {product.stock}</p>
        <div className="flex gap-3">
          <Button
            size="lg"
            disabled={product.stock <= 0}
            onClick={() =>
              cart.add({
                productId: product.id,
                name: product.name,
                unitPrice: product.price,
                quantity: 1,
              })
            }
          >
            Thêm vào giỏ
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/gio-hang">Xem giỏ hàng</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
