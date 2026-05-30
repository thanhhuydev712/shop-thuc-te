// TRANG GIỎ HÀNG — localStorage + order.checkout · docs/05-FRONTEND-NEXT-REACT.md
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart-store";
import { useAuth } from "@/store/auth-store";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatVND } from "@/lib/utils";
import { shippingFee } from "@/lib/cart";

export default function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const checkout = trpc.order.checkout.useMutation({
    onSuccess: () => {
      cart.clear();
      router.push("/don-hang");
    },
  });

  const subtotal = cart.subtotal;
  const ship = shippingFee(subtotal);

  if (cart.lines.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Giỏ hàng trống</h1>
        <Button asChild>
          <Link href="/">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Giỏ hàng</h1>

      <Card>
        <CardHeader>
          <CardTitle>{cart.count} sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.lines.map((line) => (
            <div
              key={line.productId}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium">{line.name}</p>
                <p className="text-muted-foreground text-sm">
                  {formatVND(line.unitPrice)} × {line.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {formatVND(line.unitPrice * line.quantity)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cart.remove(line.productId)}
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
          <Separator />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển</span>
              <span>{ship === 0 ? "Miễn phí" : formatVND(ship)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Tổng cộng</span>
              <span>{formatVND(cart.grandTotal)}</span>
            </div>
          </div>

          {!user ? (
            <Button asChild className="w-full">
              <Link href="/dang-nhap">Đăng nhập để thanh toán</Link>
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={checkout.isPending}
              onClick={() =>
                checkout.mutate({
                  items: cart.lines.map((l) => ({
                    productId: l.productId,
                    quantity: l.quantity,
                  })),
                })
              }
            >
              {checkout.isPending ? "Đang xử lý..." : "Thanh toán"}
            </Button>
          )}
          {checkout.error && (
            <p className="text-destructive text-sm">{checkout.error.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
