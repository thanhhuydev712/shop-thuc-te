"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/root";

// ============================================================
// CLIENT tRPC cho phía trình duyệt.
// Giải thích đầy đủ: docs/05-FRONTEND-NEXT-REACT.md
// "trpc" là đối tượng để gọi API trong React, ví dụ:
//   const { data } = trpc.product.list.useQuery();
// ============================================================

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Lấy token đăng nhập đã lưu trong trình duyệt (nếu có). */
function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") ?? "";
}

/**
 * Provider bọc toàn bộ app để các component con dùng được tRPC + React Query.
 * React Query lo việc cache dữ liệu, loading, refetch... giúp ta.
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          // Tự động đính kèm token vào header mỗi request.
          headers() {
            const token = getToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
