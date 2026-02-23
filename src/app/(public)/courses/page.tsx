"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ---------- types ---------- */

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  priceRub: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedHours: string | null;
  _count: {
    modules: number;
    enrollments: number;
  };
}

interface CoursesResponse {
  data: Course[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ---------- maps ---------- */

const difficultyLabel: Record<string, string> = {
  BEGINNER: "Начальный",
  INTERMEDIATE: "Средний",
  ADVANCED: "Продвинутый",
};

const difficultyColor: Record<string, string> = {
  BEGINNER: "bg-green-100 text-green-800 border-green-200",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  ADVANCED: "bg-red-100 text-red-800 border-red-200",
};

const DIFFICULTY_FILTERS = [
  { key: "", label: "Все" },
  { key: "BEGINNER", label: "Начальный" },
  { key: "INTERMEDIATE", label: "Средний" },
  { key: "ADVANCED", label: "Продвинутый" },
] as const;

/* ---------- component ---------- */

export default function CourseCatalogPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (difficulty) params.set("difficulty", difficulty);
      params.set("page", String(page));

      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error("Ошибка загрузки курсов");
      const json: CoursesResponse = await res.json();

      setCourses(json.data);
      setTotalPages(json.totalPages);
      setTotal(json.total);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [search, difficulty, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  /* reset page on filter change */
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDifficulty = (value: string) => {
    setDifficulty(value);
    setPage(1);
  };

  const formatPrice = (price: number) =>
    price === 0
      ? "Бесплатно"
      : `${price.toLocaleString("ru-RU")} \u20BD`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ---- header ---- */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Каталог курсов</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Выберите курс и начните обучение вайб-кодингу уже сегодня
        </p>
      </div>

      {/* ---- search + filters ---- */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={difficulty === f.key ? "default" : "outline"}
              onClick={() => handleDifficulty(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ---- results count ---- */}
      {!loading && (
        <p className="mb-6 text-sm text-muted-foreground">
          {total === 0
            ? "Курсы не найдены"
            : `Найдено курсов: ${total}`}
        </p>
      )}

      {/* ---- grid ---- */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-4 w-full rounded bg-muted" />
                <div className="mt-1 h-4 w-2/3 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-1/3 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="group cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => router.push(`/courses/${course.slug}`)}
            >
              {/* optional cover */}
              {course.coverImageUrl && (
                <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.coverImageUrl}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              )}

              <CardHeader>
                <div className="mb-2 flex items-center gap-2">
                  <Badge className={difficultyColor[course.difficulty]}>
                    {difficultyLabel[course.difficulty]}
                  </Badge>
                  {course.priceRub === 0 && (
                    <Badge variant="secondary">Бесплатно</Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                  {course.title}
                </CardTitle>
                {course.description && (
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course._count.modules}{" "}
                    {pluralize(course._count.modules, "модуль", "модуля", "модулей")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course._count.enrollments}
                  </span>
                  {course.estimatedHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.estimatedHours} ч
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <span className="text-lg font-semibold">
                  {formatPrice(course.priceRub)}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* ---- pagination ---- */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      )}
    </section>
  );
}

/* ---------- helpers ---------- */

function pluralize(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (lastDigit > 1 && lastDigit < 5) return few;
  if (lastDigit === 1) return one;
  return many;
}
