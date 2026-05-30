// ============================================================
// PRODUCT CARD — Thẻ hiển thị 1 sản phẩm (ảnh, giá, nút thêm giỏ).
// Giải thích: docs/05-FRONTEND-NEXT-REACT.md
// ============================================================
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category?: { name: string; slug: string };
}

interface ProductCardProps {
  product: ProductCardData;
  onAddToCart?: (product: ProductCardData) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/san-pham/${product.slug}`}>
        <div className="bg-muted relative aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        </div>
      </Link>
      <CardHeader className="pb-2">
        {product.category && (
          <Badge variant="secondary" className="w-fit text-xs">
            {product.category.name}
          </Badge>
        )}
        <CardTitle className="line-clamp-2 text-base">
          <Link href={`/san-pham/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {product.description}
        </p>
        <p className="text-primary mt-2 text-lg font-semibold">
          {formatVND(product.price)}
        </p>
        <p className="text-muted-foreground text-xs">
          Còn {product.stock} sản phẩm
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1" asChild>
          <Link href={`/san-pham/${product.slug}`}>Chi tiết</Link>
        </Button>
        {onAddToCart && (
          <Button
            className="flex-1"
            disabled={product.stock <= 0}
            onClick={() => onAddToCart(product)}
          >
            Thêm giỏ
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
