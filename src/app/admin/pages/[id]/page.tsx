"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TiptapEditor } from "@/components/editor/tiptap-editor";

interface PageData {
  id: string;
  slug: string;
  title: string;
  blocks: { type: string; content: string }[] | null;
  status: string;
  seoTitle: string | null;
  seoDesc: string | null;
  ogImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [page, setPage] = useState<PageData | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPage = useCallback(async () => {
    const res = await fetch(`/api/admin/pages/${id}`);
    if (res.ok) {
      const json = await res.json();
      const data: PageData = json.data;
      setPage(data);
      setTitle(data.title);
      setStatus(data.status);
      setSeoTitle(data.seoTitle || "");
      setSeoDesc(data.seoDesc || "");
      setOgImageUrl(data.ogImageUrl || "");

      // Extract HTML content from blocks
      const blocks = data.blocks || [];
      const html = blocks
        .filter((b) => b.type === "html")
        .map((b) => b.content)
        .join("");
      setHtmlContent(html);
    } else {
      toast.error("Не удалось загрузить страницу");
      router.push("/admin/pages");
    }
  }, [id, router]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        status,
        seoTitle: seoTitle || null,
        seoDesc: seoDesc || null,
        ogImageUrl: ogImageUrl || null,
        blocks: [{ type: "html", content: htmlContent }],
      }),
    });
    if (res.ok) {
      toast.success("Страница сохранена");
      const json = await res.json();
      setPage(json.data);
    } else {
      const err = await res.json();
      toast.error(err.error || "Ошибка сохранения");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Удалить страницу? Это действие необратимо.")) return;
    const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Страница удалена");
      router.push("/admin/pages");
    } else {
      toast.error("Ошибка удаления");
    }
  };

  if (!page) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/pages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">Редактирование страницы</h1>
        <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>
          {status === "PUBLISHED" ? "Опубликована" : "Черновик"}
        </Badge>
      </div>

      {/* Main settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Основные настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Название
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название страницы"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Статус</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="DRAFT">Черновик</option>
                <option value="PUBLISHED">Опубликована</option>
              </select>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Slug: /{page.slug}
          </div>
        </CardContent>
      </Card>

      {/* Content editor */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Содержимое</CardTitle>
        </CardHeader>
        <CardContent>
          <TiptapEditor
            content={htmlContent}
            onChange={(html) => setHtmlContent(html)}
            placeholder="Начните писать содержимое страницы..."
          />
        </CardContent>
      </Card>

      {/* SEO settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              SEO заголовок
            </label>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Заголовок для поисковых систем"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              SEO описание
            </label>
            <Textarea
              rows={3}
              value={seoDesc}
              onChange={(e) => setSeoDesc(e.target.value)}
              placeholder="Описание для поисковых систем (meta description)"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              OG Image URL
            </label>
            <Input
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
            />
            {ogImageUrl && (
              <div className="mt-2 rounded-md border overflow-hidden">
                <img
                  src={ogImageUrl}
                  alt="OG Preview"
                  className="max-h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Удалить страницу
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
