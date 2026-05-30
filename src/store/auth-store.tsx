// ============================================================
// AUTH STORE — React Context quản lý đăng nhập (JWT + localStorage).
// Giải thích: docs/05-FRONTEND-NEXT-REACT.md
// ============================================================
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { trpc } from "@/trpc/client";

// ============================================================
// Auth phía client — lưu JWT trong localStorage, đồng bộ với tRPC.
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    if (meQuery.data) {
      setUser({
        id: meQuery.data.id,
        email: meQuery.data.email,
        name: meQuery.data.name,
        role: meQuery.data.role,
      });
    }
    if (meQuery.isError) {
      window.localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, [meQuery.data, meQuery.isError]);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isLoading = !bootstrapped || (!!token && meQuery.isLoading && !user);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng trong <AuthProvider>");
  return ctx;
}
