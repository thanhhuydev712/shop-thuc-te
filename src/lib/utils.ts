import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================
// Hàm tiện ích dùng chung.
// ============================================================

/**
 * cn() = "class names": gộp nhiều chuỗi class Tailwind lại,
 * tự động xử lý xung đột (vd: "p-2" và "p-4" -> giữ "p-4").
 * Đây là hàm chuẩn mà shadcn/ui sử dụng.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng số tiền sang dạng tiền Việt: 1500000 -> "1.500.000 ₫".
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
