import Redis from "ioredis";

// ============================================================
// Redis — kho dữ liệu trong bộ nhớ (in-memory), cực nhanh.
// Trong dự án này ta dùng Redis để CACHE (lưu tạm) danh sách sản phẩm,
// giúp giảm số lần truy vấn PostgreSQL.
//
// Tương tự Prisma, ta tái sử dụng một kết nối dùng chung.
// ============================================================

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    // Không "ngắt app" nếu Redis chưa sẵn sàng — chỉ thử lại có giới hạn.
    maxRetriesPerRequest: 2,
    lazyConnect: true, // Kết nối khi cần — tránh lỗi lúc `next build` không có Redis.
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// Thời gian sống mặc định của cache: 60 giây.
export const CACHE_TTL_SECONDS = 60;

/**
 * Helper "cache-aside": nếu có trong cache thì trả về luôn,
 * nếu không thì chạy hàm lấy dữ liệu (fetcher), lưu vào cache rồi trả về.
 * Nếu Redis lỗi/không kết nối được -> tự động bỏ qua cache, gọi thẳng DB.
 */
export async function cacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL_SECONDS,
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    // Redis lỗi -> bỏ qua cache, không làm app sập.
  }

  const data = await fetcher();

  try {
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch {
    // Bỏ qua nếu không ghi được cache.
  }

  return data;
}
