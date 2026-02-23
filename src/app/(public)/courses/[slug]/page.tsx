"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Video,
  Code2,
  HelpCircle,
  Zap,
  Clock,
  Users,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ---------- types ---------- */

interface Lesson {
  id: string;
  title: string;
  type: "ARTICLE" | "VIDEO" | "SANDBOX" | "QUIZ" | "INTERACTIVE" | "MEDIA";
  orderIndex: number;
  xpReward: number;
  estimatedMinutes: number | null;
  isFreePreview: boolean;
}

interface Module {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  priceRub: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedHours: string | null;
  _count: {
    enrollments: number;
  };
  modules: Module[];
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

const lessonTypeIcon: Record<string, React.ElementType> = {
  ARTICLE: FileText,
  VIDEO: Video,
  SANDBOX: Code2,
  QUIZ: HelpCircle,
  INTERACTIVE: Sparkles,
  MEDIA: Video,
};

const lessonTypeLabel: Record<string, string> = {
  ARTICLE: "Статья",
  VIDEO: "Видео",
  SANDBOX: "Песочница",
  QUIZ: "Тест",
  INTERACTIVE: "Интерактив",
  MEDIA: "Медиа",
};

/* ---------- component ---------- */

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/courses/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((json) => {
        setCourse(json.data);
        // open first module by default
        if (json.data?.modules?.[0]) {
          setOpenModules(new Set([json.data.modules[0].id]));
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalLessons = course?.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  ) ?? 0;

  const totalXp = course?.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + l.xpReward, 0),
    0
  ) ?? 0;

  const formatPrice = (price: number) =>
    price === 0
      ? "Бесплатно"
      : `${price.toLocaleString("ru-RU")} \u20BD`;

  /* ---- loading state ---- */
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-2/3 rounded bg-muted" />
          <div className="h-5 w-full rounded bg-muted" />
          <div className="h-5 w-1/2 rounded bg-muted" />
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---- error / not found ---- */
  if (error || !course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Курс не найден</h1>
        <p className="mt-2 text-muted-foreground">
          Возможно, курс был удален или ещё не опубликован.
        </p>
        <Button className="mt-6" onClick={() => router.push("/courses")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к каталогу
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ---- back link ---- */}
      <button
        onClick={() => router.push("/courses")}
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Каталог курсов
      </button>

      {/* ---- hero ---- */}
      <div className="mb-10">
        {course.coverImageUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.coverImageUrl}
              alt={course.title}
              className="h-64 w-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className={difficultyColor[course.difficulty]}>
            {difficultyLabel[course.difficulty]}
          </Badge>
          {course.priceRub === 0 && (
            <Badge variant="secondary">Бесплатно</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {course.title}
        </h1>

        {course.description && (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}

        {/* stats row */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {course.modules.length}{" "}
            {pluralize(course.modules.length, "модуль", "модуля", "модулей")}
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            {totalLessons}{" "}
            {pluralize(totalLessons, "урок", "урока", "уроков")}
          </span>
          {course.estimatedHours && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {course.estimatedHours} ч
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {course._count.enrollments}{" "}
            {pluralize(
              course._count.enrollments,
              "студент",
              "студента",
              "студентов"
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            {totalXp} XP
          </span>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {course.priceRub === 0 ? (
            <Button size="lg">Начать бесплатно</Button>
          ) : (
            <Button size="lg">
              {formatPrice(course.priceRub)} — Записаться
            </Button>
          )}
        </div>
      </div>

      {/* ---- modules / programme ---- */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">Программа курса</h2>

        <div className="space-y-3">
          {course.modules.map((mod, idx) => {
            const isOpen = openModules.has(mod.id);
            const moduleXp = mod.lessons.reduce((s, l) => s + l.xpReward, 0);

            return (
              <Card key={mod.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleModule(mod.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {idx + 1}
                      </span>
                      <div>
                        <CardTitle className="text-base">
                          {mod.title}
                        </CardTitle>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {mod.lessons.length}{" "}
                          {pluralize(
                            mod.lessons.length,
                            "урок",
                            "урока",
                            "уроков"
                          )}
                          {" \u00B7 "}
                          {moduleXp} XP
                        </p>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="border-t pt-4">
                    <ul className="space-y-2">
                      {mod.lessons.map((lesson) => {
                        const Icon = lessonTypeIcon[lesson.type] ?? FileText;
                        return (
                          <li
                            key={lesson.id}
                            className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm">{lesson.title}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {lessonTypeLabel[lesson.type] ?? lesson.type}
                              </Badge>
                              {lesson.isFreePreview && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Превью
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              {lesson.estimatedMinutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lesson.estimatedMinutes} мин
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {lesson.xpReward} XP
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
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
