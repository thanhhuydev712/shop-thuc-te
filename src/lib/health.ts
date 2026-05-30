// ============================================================
// HEALTH CHECK — Kiểm tra PostgreSQL + Redis cho monitoring.
// Giải thích: docs/06-DEVOPS-MONITORING.md
// ============================================================
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  time: string;
  checks: {
    database: "up" | "down";
    redis: "up" | "down";
  };
}

/** Kiểm tra sức khỏe hệ thống — dùng cho monitoring / load balancer. */
export async function getHealthStatus(): Promise<HealthStatus> {
  const time = new Date().toISOString();
  let database: "up" | "down" = "down";
  let redisStatus: "up" | "down" = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  try {
    const pong = await redis.ping();
    redisStatus = pong === "PONG" ? "up" : "down";
  } catch {
    redisStatus = "down";
  }

  const allUp = database === "up" && redisStatus === "up";
  const anyUp = database === "up" || redisStatus === "up";

  return {
    status: allUp ? "ok" : anyUp ? "degraded" : "error",
    time,
    checks: { database, redis: redisStatus },
  };
}
