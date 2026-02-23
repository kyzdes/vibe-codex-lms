"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Star, Trophy, BookOpen, ArrowRight, Zap } from "lucide-react";

interface DashboardData {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number | null;
  streakDays: number;
  courses: {
    id: string;
    slug: string;
    title: string;
    totalLessons: number;
    completedLessons: number;
    progress: number;
  }[];
  recentActivity: {
    lesson: {
      title: string;
      type: string;
      module: { course: { title: string; slug: string } };
    };
    completedAt: string;
    xpEarned: number;
  }[];
  achievements: {
    slug: string;
    title: string;
    description: string | null;
    earnedAt: string;
  }[];
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const xpProgress = data.nextLevelXp
    ? Math.round((data.xp / data.nextLevelXp) * 100)
    : 100;

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-2xl font-bold">Мой прогресс</h1>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.xp} XP</p>
                <p className="text-xs text-muted-foreground">Уровень {data.level}: {data.levelTitle}</p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            {data.nextLevelXp && (
              <p className="text-xs text-muted-foreground mt-1">
                {data.xp} / {data.nextLevelXp} XP до следующего уровня
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.streakDays}</p>
                <p className="text-xs text-muted-foreground">дней подряд</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.courses.length}</p>
                <p className="text-xs text-muted-foreground">курсов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.achievements.length}</p>
                <p className="text-xs text-muted-foreground">достижений</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Мои курсы</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/courses">
              Каталог
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {data.courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Вы ещё не записались ни на один курс</p>
              <Button asChild>
                <Link href="/courses">Перейти в каталог</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>{course.completedLessons} / {course.totalLessons} уроков</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Достижения</h2>
          <div className="flex flex-wrap gap-3">
            {data.achievements.map((a) => (
              <Badge key={a.slug} variant="outline" className="px-3 py-1.5 text-sm gap-1.5">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                {a.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Последняя активность</h2>
          <div className="space-y-2">
            {data.recentActivity.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <div className="flex-1">
                  <span className="font-medium">{item.lesson.title}</span>
                  <span className="text-muted-foreground"> — {item.lesson.module.course.title}</span>
                </div>
                <Badge variant="secondary">+{item.xpEarned} XP</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
