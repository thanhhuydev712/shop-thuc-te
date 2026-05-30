// TRANG ĐƠN HÀNG — trpc.order.myOrders · docs/05-FRONTEND-NEXT-REACT.md
"use client";

import Link from "next/link";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PAID: "Đã thanh toán",
  SHIPPED: "Đang giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading } = trpc.order.myOrders.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) return <p>Đang tải...</p>;

  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Đơn hàng của bạn</h1>
        <p className="text-muted-foreground">
          Vui lòng đăng nhập để xem đơn hàng.
        </p>
        <Button asChild>
          <Link href="/dang-nhap">Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Đơn hàng của bạn</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : !orders?.length ? (
        <p className="text-muted-foreground">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">
                  Đơn #{order.id.slice(-8)}
                </CardTitle>
                <Badge variant="outline">
                  {STATUS_LABEL[order.status] ?? order.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString("vi-VN")}
                </p>
                <ul className="space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <span>{formatVND(item.unitPrice * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-semibold">Tổng: {formatVND(order.total)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
