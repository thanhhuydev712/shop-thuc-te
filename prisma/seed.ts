import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { upsertProductEmbedding } from "../src/lib/vector-search";

// ============================================================
// SEED — Đổ dữ liệu mẫu vào database để có sẵn thứ mà xem/test.
// Chạy: npm run db:seed
// Giải thích: docs/03-DATABASE-PRISMA.md
// ============================================================

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu tạo dữ liệu mẫu...");

  // --- Tạo tài khoản admin & user mẫu ---
  const adminPass = await bcrypt.hash("admin123", 10);
  const userPass = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@shop.vn" },
    update: {},
    create: {
      email: "admin@shop.vn",
      name: "Quản trị viên",
      passwordHash: adminPass,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "user@shop.vn" },
    update: {},
    create: {
      email: "user@shop.vn",
      name: "Khách Hàng Demo",
      passwordHash: userPass,
      role: "USER",
    },
  });

  // --- Tạo danh mục ---
  const dienThoai = await prisma.category.upsert({
    where: { slug: "dien-thoai" },
    update: {},
    create: { name: "Điện thoại", slug: "dien-thoai" },
  });
  const laptop = await prisma.category.upsert({
    where: { slug: "laptop" },
    update: {},
    create: { name: "Laptop", slug: "laptop" },
  });
  const phuKien = await prisma.category.upsert({
    where: { slug: "phu-kien" },
    update: {},
    create: { name: "Phụ kiện", slug: "phu-kien" },
  });

  // --- Tạo sản phẩm ---
  const products = [
    {
      name: "iPhone 15 Pro",
      slug: "iphone-15-pro",
      description: "Điện thoại cao cấp, chip A17 Pro, khung titan.",
      price: 28_990_000,
      stock: 25,
      imageUrl: "https://picsum.photos/seed/iphone/600/600",
      categoryId: dienThoai.id,
    },
    {
      name: "Samsung Galaxy S24",
      slug: "samsung-galaxy-s24",
      description: "Màn hình Dynamic AMOLED, camera AI.",
      price: 22_490_000,
      stock: 30,
      imageUrl: "https://picsum.photos/seed/samsung/600/600",
      categoryId: dienThoai.id,
    },
    {
      name: "MacBook Air M3",
      slug: "macbook-air-m3",
      description: "Laptop mỏng nhẹ, chip M3, pin cả ngày.",
      price: 27_990_000,
      stock: 15,
      imageUrl: "https://picsum.photos/seed/macbook/600/600",
      categoryId: laptop.id,
    },
    {
      name: "Dell XPS 13",
      slug: "dell-xps-13",
      description: "Laptop văn phòng cao cấp, màn hình tràn viền.",
      price: 31_500_000,
      stock: 10,
      imageUrl: "https://picsum.photos/seed/dell/600/600",
      categoryId: laptop.id,
    },
    {
      name: "Tai nghe AirPods Pro 2",
      slug: "airpods-pro-2",
      description: "Chống ồn chủ động, âm thanh không gian.",
      price: 5_990_000,
      stock: 50,
      imageUrl: "https://picsum.photos/seed/airpods/600/600",
      categoryId: phuKien.id,
    },
    {
      name: "Sạc nhanh 65W",
      slug: "sac-nhanh-65w",
      description: "Củ sạc GaN nhỏ gọn, sạc nhanh đa thiết bị.",
      price: 590_000,
      stock: 100,
      imageUrl: "https://picsum.photos/seed/charger/600/600",
      categoryId: phuKien.id,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
    // Tạo vector embedding cho tìm kiếm ngữ nghĩa.
    await upsertProductEmbedding(
      product.id,
      `${product.name}. ${product.description}`,
    );
  }

  console.log("✅ Hoàn tất! Đã tạo:");
  console.log(
    `   - 2 người dùng (admin@shop.vn / admin123, user@shop.vn / user123)`,
  );
  console.log(`   - 3 danh mục, ${products.length} sản phẩm`);
  console.log(`   - Admin id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
