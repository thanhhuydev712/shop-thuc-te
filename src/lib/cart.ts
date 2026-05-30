// ============================================================
// Logic nghiệp vụ thuần (không phụ thuộc DB/React) cho GIỎ HÀNG.
// Tách riêng ra đây để DỄ VIẾT TEST (xem src/lib/cart.test.ts).
// Nguyên tắc: hàm thuần (pure function) -> cùng input luôn cho cùng output.
// ============================================================

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number; // giá 1 sản phẩm (đồng)
  quantity: number; // số lượng
}

/** Tính thành tiền của 1 dòng = đơn giá × số lượng. */
export function lineTotal(line: CartLine): number {
  return line.unitPrice * line.quantity;
}

/** Tính tổng tạm tính (subtotal) của cả giỏ hàng. */
export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

/**
 * Tính phí vận chuyển: miễn phí nếu đơn >= 500.000đ, ngược lại 30.000đ.
 * Giỏ rỗng thì không tính phí ship.
 */
export function shippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= 500_000 ? 0 : 30_000;
}

/** Tổng tiền cuối cùng phải trả = tạm tính + phí ship. */
export function cartGrandTotal(lines: CartLine[]): number {
  const subtotal = cartSubtotal(lines);
  return subtotal + shippingFee(subtotal);
}

/**
 * Thêm sản phẩm vào giỏ. Nếu đã có thì cộng dồn số lượng,
 * nếu chưa có thì thêm dòng mới. Trả về MẢNG MỚI (không sửa mảng cũ).
 */
export function addToCart(lines: CartLine[], item: CartLine): CartLine[] {
  const existing = lines.find((l) => l.productId === item.productId);
  if (existing) {
    return lines.map((l) =>
      l.productId === item.productId
        ? { ...l, quantity: l.quantity + item.quantity }
        : l,
    );
  }
  return [...lines, item];
}
