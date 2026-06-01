// ============================================================
// ROOT LAYOUT — Khung HTML chung cho MỌI trang (App Router).
// Bọc Providers (tRPC, Auth, Cart), Header, nội dung trang, Footer.
// Giải thích đầy đủ: docs/05-FRONTEND-NEXT-REACT.md
// ============================================================
import type { Metadata } from "next";
import { Inter } from "next/font/google";
// Speed Insights: đo hiệu năng thực tế (Core Web Vitals) từ trình duyệt người dùng
// rồi gửi về dashboard Vercel. Chỉ thu thập số liệu khi chạy trên Vercel.
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Shop Thực Tế — Học Full-Stack",
  description:
    "Dự án bán hàng học Next.js 15, React 19, tRPC, Hono, Prisma, PostgreSQL, Redis, pgvector",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen font-sans`}
        suppressHydrationWarning
      >
        <Providers>
          <SiteHeader />
          <main className="container mx-auto px-4 py-8">{children}</main>
          <footer className="text-muted-foreground border-t py-6 text-center text-sm">
            Shop Thực Tế — Tutorial full-stack · API health:{" "}
            <a href="/api/health" className="hover:text-foreground underline">
              /api/health
            </a>
          </footer>
        </Providers>
        {/* Đặt cuối <body>: chèn script đo Web Vitals, không ảnh hưởng layout */}
        <SpeedInsights />
      </body>
    </html>
  );
}
