"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, DollarSign, Brain, Flame } from "lucide-react";

interface Analytics {
  users: { total: number; newThisMonth: number };
  courses: { total: number; published: number };
  enrollments: { total: number; thisMonth: number };
  lessons: { completed: number; completedThisWeek: number };
  revenue: { total: number; thisMonth: number };
  ai: { monthlyUsd: number };
  activity: { activeUsersThisWeek: number };
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);

  const stats = [
    {
      title: "Пользователи",
      value: data?.users.total ?? "—",
      sub: `+${data?.users.newThisMonth ?? 0} за месяц`,
      icon: Users,
    },
    {
      title: "Курсы",
      value: data?.courses.published ?? "—",
      sub: `${data?.courses.total ?? 0} всего`,
      icon: BookOpen,
    },
    {
      title: "Записей на курсы",
      value: data?.enrollments.total ?? "—",
      sub: `+${data?.enrollments.thisMonth ?? 0} за месяц`,
      icon: GraduationCap,
    },
    {
      title: "Уроков пройдено",
      value: data?.lessons.completed ?? "—",
      sub: `${data?.lessons.completedThisWeek ?? 0} за неделю`,
      icon: Flame,
    },
    {
      title: "Выручка",
      value: data ? `${((data.revenue.total || 0) / 100).toLocaleString("ru-RU")} ₽` : "—",
      sub: data ? `+${((data.revenue.thisMonth || 0) / 100).toLocaleString("ru-RU")} ₽ за месяц` : "",
      icon: DollarSign,
    },
    {
      title: "AI расходы",
      value: data ? `$${data.ai.monthlyUsd.toFixed(2)}` : "—",
      sub: "За текущий месяц",
      icon: Brain,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
