// TRANG ĐĂNG NHẬP — gọi trpc.auth.login · docs/05-FRONTEND-NEXT-REACT.md
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("user@shop.vn");
  const [password, setPassword] = useState("user123");
  const [error, setError] = useState("");

  const mutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      login(data.token, data.user);
      router.push("/");
    },
    onError: (err) => setError(err.message),
  });

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>
          Nhập email và mật khẩu để tiếp tục mua hàng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            mutation.mutate({ email, password });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Chưa có tài khoản?{" "}
            <Link href="/dang-ky" className="text-primary underline">
              Đăng ký
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
