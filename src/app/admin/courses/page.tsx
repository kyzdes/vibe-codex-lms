"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  slug: string;
  title: string;
  status: string;
  difficulty: string;
  priceRub: number;
  updatedAt: string;
  _count: { modules: number; enrollments: number };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const fetchCourses = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/courses?${params}`);
    const json = await res.json();
    setCourses(json.data || []);
  }, [search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      toast.success("Курс создан");
      setNewTitle("");
      fetchCourses();
    } else {
      const err = await res.json();
      toast.error(err.error || "Ошибка создания");
    }
    setCreating(false);
  };

  const statusColors: Record<string, "default" | "secondary" | "outline"> = {
    DRAFT: "secondary",
    PUBLISHED: "default",
    ARCHIVED: "outline",
  };

  const statusLabels: Record<string, string> = {
    DRAFT: "Черновик",
    PUBLISHED: "Опубликован",
    ARCHIVED: "В архиве",
  };

  const difficultyLabels: Record<string, string> = {
    BEGINNER: "Начальный",
    INTERMEDIATE: "Средний",
    ADVANCED: "Продвинутый",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Курсы</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Новый курс
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать курс</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Название курса"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск курсов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id} href={`/admin/courses/${course.id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base leading-tight">{course.title}</CardTitle>
                  <Badge variant={statusColors[course.status]}>
                    {statusLabels[course.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course._count.modules} мод.
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {course._count.enrollments} студ.
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {difficultyLabels[course.difficulty]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Курсы не найдены. Создайте первый курс!
          </div>
        )}
      </div>
    </div>
  );
}
