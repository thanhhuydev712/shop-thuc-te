// TRANG ADMIN — reindex embedding, tạo sản phẩm (role ADMIN) · docs/05-FRONTEND-NEXT-REACT.md
"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: products } = trpc.product.list.useQuery({});

  const reindex = trpc.product.reindexEmbeddings.useMutation({
    onSuccess: (d) => alert(`Đã index ${d.indexed} sản phẩm.`),
  });

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "https://picsum.photos/seed/new/600/600",
    categoryId: "",
  });

  const create = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      alert("Đã tạo sản phẩm.");
    },
    onError: (e) => alert(e.message),
  });

  // Lấy categoryId từ sản phẩm đầu tiên nếu chưa chọn
  const defaultCategoryId = products?.[0]?.categoryId ?? "";

  if (!user) {
    return (
      <p>
        <Link href="/dang-nhap" className="text-primary underline">
          Đăng nhập
        </Link>{" "}
        để truy cập trang quản trị.
      </p>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <p className="text-destructive">Chỉ ADMIN mới truy cập được trang này.</p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">Quản trị</h1>

      <Card>
        <CardHeader>
          <CardTitle>Vector / pgvector</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => reindex.mutate()}
            disabled={reindex.isPending}
          >
            {reindex.isPending ? "Đang index..." : "Reindex embeddings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thêm sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({
                name: form.name,
                slug: form.slug,
                description: form.description,
                price: Number(form.price),
                stock: Number(form.stock),
                imageUrl: form.imageUrl,
                categoryId: form.categoryId || defaultCategoryId,
              });
            }}
          >
            <div className="space-y-1">
              <Label>Tên</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Mô tả</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Giá (đồng)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Tồn kho</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Category ID</Label>
              <Input
                placeholder={defaultCategoryId}
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              />
              <p className="text-muted-foreground text-xs">
                Lấy từ DB sau seed. Mặc định: {defaultCategoryId || "—"}
              </p>
            </div>
            <Button type="submit" disabled={create.isPending}>
              Tạo sản phẩm
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
