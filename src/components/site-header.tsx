// ============================================================
// SITE HEADER — Thanh điều hướng: logo, tìm kiếm, giỏ, đăng nhập, admin.
// Giải thích: docs/05-FRONTEND-NEXT-REACT.md
// ============================================================
"use client";

import Link from "next/link";
import { ShoppingCart, Search, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/store/auth-store";
import { useCart } from "@/store/cart-store";

export function SiteHeader() {
  const { user, logout } = useAuth();
  const cart = useCart();

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Shop Thực Tế
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tim-kiem">
              <Search className="size-4" />
              <span className="hidden sm:inline">Tìm kiếm AI</span>
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link href="/gio-hang" className="relative">
              <ShoppingCart className="size-4" />
              Giỏ
              {cart.count > 0 && (
                <Badge className="absolute -top-2 -right-2 size-5 justify-center rounded-full p-0 text-[10px]">
                  {cart.count}
                </Badge>
              )}
            </Link>
          </Button>

          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/don-hang">
                  <User className="size-4" />
                  Đơn hàng
                </Link>
              </Button>
              {user.role === "ADMIN" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <Shield className="size-4" />
                    Admin
                  </Link>
                </Button>
              )}
              <span className="text-muted-foreground hidden text-sm md:inline">
                {user.name}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="size-4" />
                Thoát
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dang-nhap">Đăng nhập</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/dang-ky">Đăng ký</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
