"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Shield,
  Flame,
  Zap,
  Star,
  Trophy,
  BookOpen,
  Calendar,
  Save,
  LogOut,
  Settings,
} from "lucide-react";
import { XP_LEVELS } from "@/types";

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  xp: number;
  level: number;
  levelTitle: string;
  levelDescription: string;
  nextLevelXp: number | null;
  streakDays: number;
  preferences: {
    learningGoals?: string[];
    experienceLevel?: string;
  };
  createdAt: string;
  achievementsCount: number;
  coursesCount: number;
}

const LEARNING_GOALS = [
  { id: "ai-development", label: "AI для разработки" },
  { id: "ai-design", label: "AI для дизайна" },
  { id: "ai-marketing", label: "AI для маркетинга" },
  { id: "ai-products", label: "AI для продуктов" },
] as const;

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Новичок" },
  { value: "practitioner", label: "Практик" },
  { value: "expert", label: "Эксперт" },
] as const;

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getRoleBadgeLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Администратор";
    case "INSTRUCTOR":
      return "Инструктор";
    case "STUDENT":
      return "Студент";
    default:
      return role;
  }
}

function ProfileSkeleton() {
  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
          <Skeleton className="h-3 w-full max-w-xs" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("beginner");

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/student/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const json = await res.json();
      const data = json.data as ProfileData;
      setProfile(data);
      setName(data.name || "");
      setLearningGoals(data.preferences?.learningGoals || []);
      setExperienceLevel(data.preferences?.experienceLevel || "beginner");
    } catch {
      toast.error("Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Имя не может быть пустым");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          preferences: {
            learningGoals,
            experienceLevel,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Ошибка сохранения");
      }

      toast.success("Профиль успешно обновлён");
      await fetchProfile();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ошибка сохранения профиля"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = (goalId: string) => {
    setLearningGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    );
  };

  if (loading || !session?.user) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="container max-w-3xl py-8">
        <p className="text-muted-foreground">
          Не удалось загрузить данные профиля.
        </p>
      </div>
    );
  }

  const xpProgress = profile.nextLevelXp
    ? Math.round((profile.xp / profile.nextLevelXp) * 100)
    : 100;

  const currentLevel = XP_LEVELS.find((l) => l.level === profile.level);
  const nextLevel = XP_LEVELS.find((l) => l.level === profile.level + 1);

  const memberSince = new Date(profile.createdAt).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <h1 className="text-2xl font-bold">Профиль</h1>

      {/* Avatar & Level Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name || "Аватар"}
                  className="h-24 w-24 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border-4 border-primary/20 text-2xl font-bold text-primary">
                  {getInitials(profile.name, profile.email)}
                </div>
              )}
              <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <Star className="h-3 w-3 mr-1" />
                Ур. {profile.level}
              </Badge>
            </div>

            {/* Level Info & XP Bar */}
            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <div>
                <h2 className="text-xl font-semibold">
                  {profile.name || "Пользователь"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentLevel?.title || profile.levelTitle} —{" "}
                  {currentLevel?.description || profile.levelDescription}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-primary" />
                    {profile.xp} XP
                  </span>
                  {profile.nextLevelXp && (
                    <span className="text-muted-foreground">
                      {profile.nextLevelXp} XP до{" "}
                      {nextLevel ? `ур. ${nextLevel.level}` : "макс."}
                    </span>
                  )}
                </div>
                <Progress value={xpProgress} />
              </div>
              {profile.streakDays > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400">
                  <Flame className="h-4 w-4" />
                  <span>
                    {profile.streakDays}{" "}
                    {getDaysWord(profile.streakDays)} подряд
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.xp}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.streakDays}</p>
                <p className="text-xs text-muted-foreground">
                  {getDaysWord(profile.streakDays)} подряд
                </p>
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
                <p className="text-2xl font-bold">{profile.coursesCount}</p>
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
                <p className="text-2xl font-bold">
                  {profile.achievementsCount}
                </p>
                <p className="text-xs text-muted-foreground">достижений</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList className="w-full">
          <TabsTrigger value="personal" className="flex-1 gap-1.5">
            <User className="h-4 w-4" />
            Личные данные
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1 gap-1.5">
            <Settings className="h-4 w-4" />
            Предпочтения
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-1 gap-1.5">
            <Shield className="h-4 w-4" />
            Аккаунт
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Личные данные
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Имя</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите имя"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Label>
                <Input value={profile.email} readOnly className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Email нельзя изменить
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Роль
                </Label>
                <div>
                  <Badge variant="outline">
                    {getRoleBadgeLabel(profile.role)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" />
                  Уровень
                </Label>
                <div className="flex items-center gap-2">
                  <Badge>{profile.levelTitle}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Уровень {profile.level}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Предпочтения обучения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Learning Goals */}
              <div className="space-y-3">
                <Label>Цели обучения</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LEARNING_GOALS.map((goal) => (
                    <label
                      key={goal.id}
                      className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={learningGoals.includes(goal.id)}
                        onChange={() => toggleGoal(goal.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <span className="text-sm font-medium">{goal.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-3">
                <Label htmlFor="experience-level">Уровень опыта</Label>
                <select
                  id="experience-level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Аккаунт
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Участник с</p>
                  <p className="text-sm text-muted-foreground">{memberSince}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                Выйти из аккаунта
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4" />
          {saving ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}

/** Returns the correct Russian word form for "день/дня/дней" based on count. */
function getDaysWord(count: number): string {
  const abs = Math.abs(count);
  const lastTwo = abs % 100;
  const lastOne = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return "дней";
  if (lastOne === 1) return "день";
  if (lastOne >= 2 && lastOne <= 4) return "дня";
  return "дней";
}
