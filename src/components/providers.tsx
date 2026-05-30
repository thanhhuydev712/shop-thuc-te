// ============================================================
// PROVIDERS — Xếp chồng Context: tRPC → Auth → Cart.
// Giải thích: docs/05-FRONTEND-NEXT-REACT.md
// ============================================================
"use client";

import { TRPCProvider } from "@/trpc/client";
import { CartProvider } from "@/store/cart-store";
import { AuthProvider } from "@/store/auth-store";

/** Gom tất cả React Context providers cho app. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </TRPCProvider>
  );
}
