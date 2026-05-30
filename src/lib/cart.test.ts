// ============================================================
// TEST GIỎ HÀNG — Vitest kiểm tra logic thuần trong cart.ts
// Giải thích: docs/06-DEVOPS-MONITORING.md
// ============================================================
import { describe, it, expect } from "vitest";
import {
  lineTotal,
  cartSubtotal,
  shippingFee,
  cartGrandTotal,
  addToCart,
  type CartLine,
} from "./cart";

describe("cart", () => {
  const line: CartLine = {
    productId: "1",
    name: "Test",
    unitPrice: 100_000,
    quantity: 2,
  };

  it("lineTotal = unitPrice × quantity", () => {
    expect(lineTotal(line)).toBe(200_000);
  });

  it("cartSubtotal cộng các dòng", () => {
    expect(cartSubtotal([line])).toBe(200_000);
  });

  it("miễn phí ship khi đơn >= 500k", () => {
    expect(shippingFee(500_000)).toBe(0);
    expect(shippingFee(499_999)).toBe(30_000);
    expect(shippingFee(0)).toBe(0);
  });

  it("cartGrandTotal = subtotal + ship", () => {
    expect(cartGrandTotal([line])).toBe(230_000);
  });

  it("addToCart gộp số lượng nếu trùng productId", () => {
    const next = addToCart([line], { ...line, quantity: 1 });
    expect(next[0].quantity).toBe(3);
  });
});
