"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  xp: number;
  level: number;
  streakDays: number;
  createdAt: string;
  _count: { enrollments: number; progress: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/users?${params}`);
    const json = await res.json();
    setUsers(json.data || []);
    setTotal(json.total || 0);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const roleLabels: Record<string, string> = {
    STUDENT: "Студент",
    INSTRUCTOR: "Инструктор",
    ADMIN: "Админ",
  };

  const roleVariants: Record<string, "default" | "secondary" | "outline"> = {
    ADMIN: "default",
    INSTRUCTOR: "secondary",
    STUDENT: "outline",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <Badge variant="outline" className="text-sm">
          <Users className="h-3.5 w-3.5 mr-1" />
          {total} всего
        </Badge>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-[2fr_1fr_80px_80px_80px_100px] gap-4 border-b p-3 text-sm font-medium text-muted-foreground">
          <span>Пользователь</span>
          <span>Роль</span>
          <span>XP</span>
          <span>Уровень</span>
          <span>Streak</span>
          <span>Курсов</span>
        </div>
        {users.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-[2fr_1fr_80px_80px_80px_100px] gap-4 border-b p-3 text-sm items-center last:border-0"
          >
            <div>
              <p className="font-medium">{user.name || "—"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <Badge variant={roleVariants[user.role]}>{roleLabels[user.role]}</Badge>
            </div>
            <span>{user.xp}</span>
            <span>{user.level}</span>
            <span>{user.streakDays}d</span>
            <span>{user._count.enrollments}</span>
          </div>
        ))}
        {users.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Пользователи не найдены</div>
        )}
      </div>
    </div>
  );
}
