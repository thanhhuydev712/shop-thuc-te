"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartLine } from "@/lib/cart";
import { addToCart as addLine, cartGrandTotal, cartSubtotal } from "@/lib/cart";

// ============================================================
// GIỎ HÀNG phía client — lưu vào localStorage để không mất khi tải lại trang.
// Dùng React Context để mọi component đều truy cập được giỏ hàng.
// (Trong dự án lớn hơn có thể dùng Zustand/Redux, ở đây giữ đơn giản.)
// ============================================================

interface CartContextValue {
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (productId: string) => void;
  clear: () => void;
  subtotal: number;
  grandTotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Đọc giỏ hàng từ localStorage sau mount — tránh mismatch SSR/client.
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setLines(JSON.parse(raw));
      } catch {
        /* dữ liệu hỏng -> bỏ qua */
      }
    }
    setHydrated(true);
  }, []);

  // Chỉ ghi sau khi đã đọc xong, tránh ghi `[]` đè dữ liệu cũ lúc mount.
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const value: CartContextValue = {
    lines,
    add: (line) => setLines((prev) => addLine(prev, line)),
    remove: (productId) =>
      setLines((prev) => prev.filter((l) => l.productId !== productId)),
    clear: () => setLines([]),
    subtotal: cartSubtotal(lines),
    grandTotal: cartGrandTotal(lines),
    count: lines.reduce((n, l) => n + l.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Hook tiện dụng để dùng giỏ hàng: const cart = useCart(); */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải được dùng bên trong <CartProvider>");
  return ctx;
}
