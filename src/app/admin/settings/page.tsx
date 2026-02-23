"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Brain, DollarSign, Shield, Zap, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AiSettings {
  evaluationModel: string;
  hintModel: string;
  dailyBudgetPerUser: number;
  rateLimitPerMinute: number;
  systemPrompt: string;
}

interface GamificationSettings {
  xpPerLesson: number;
  bonusPerfectQuiz: number;
  bonusSandboxHighScore: number;
  streakBonus7Days: number;
  streakBonus30Days: number;
}

interface Settings {
  ai: AiSettings;
  gamification: GamificationSettings;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        throw new Error("Ошибка загрузки настроек");
      }
      const data: Settings = await res.json();
      setSettings(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить настройки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Неизвестная ошибка" }));
        throw new Error(data.error || "Ошибка сохранения");
      }
      const updated: Settings = await res.json();
      setSettings(updated);
      toast.success("Настройки сохранены");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  };

  const updateAi = <K extends keyof AiSettings>(key: K, value: AiSettings[K]) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, ai: { ...prev.ai, [key]: value } };
    });
  };

  const updateGamification = <K extends keyof GamificationSettings>(
    key: K,
    value: GamificationSettings[K],
  ) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, gamification: { ...prev.gamification, [key]: value } };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Настройки</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Не удалось загрузить настройки. Попробуйте обновить страницу.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Настройки</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Управление AI-моделями, бюджетом и геймификацией
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <Tabs defaultValue="ai-models">
        <TabsList className="mb-4">
          <TabsTrigger value="ai-models" className="gap-1.5">
            <Brain className="h-4 w-4" />
            AI модели
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-1.5">
            <DollarSign className="h-4 w-4" />
            Бюджет
          </TabsTrigger>
          <TabsTrigger value="gamification" className="gap-1.5">
            <Zap className="h-4 w-4" />
            Геймификация
          </TabsTrigger>
        </TabsList>

        {/* ========== AI Models Tab ========== */}
        <TabsContent value="ai-models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Модели OpenRouter
              </CardTitle>
              <CardDescription>
                Настройка моделей AI для разных задач
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="evaluationModel">Оценка песочниц</Label>
                <Input
                  id="evaluationModel"
                  value={settings.ai.evaluationModel}
                  onChange={(e) => updateAi("evaluationModel", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Используется для оценки промптов и кода в песочницах
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hintModel">Подсказки и объяснения</Label>
                <Input
                  id="hintModel"
                  value={settings.ai.hintModel}
                  onChange={(e) => updateAi("hintModel", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Быстрая и дешёвая модель для подсказок студентам
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Промпт-инструкции AI-наставника
              </CardTitle>
              <CardDescription>
                Системный промпт для всех взаимодействий со студентами
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Системный промпт</Label>
                <Textarea
                  id="systemPrompt"
                  className="min-h-[160px]"
                  value={settings.ai.systemPrompt}
                  onChange={(e) => updateAi("systemPrompt", e.target.value)}
                />
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {settings.ai.systemPrompt.length} символов
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Budget Tab ========== */}
        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Бюджет и лимиты
              </CardTitle>
              <CardDescription>
                Ограничение расходов на AI для каждого студента
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dailyBudget">Дневной лимит на студента (USD)</Label>
                  <Input
                    id="dailyBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.ai.dailyBudgetPerUser}
                    onChange={(e) =>
                      updateAi("dailyBudgetPerUser", parseFloat(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Максимальная сумма расходов на AI-запросы в день
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate limit (запросов/мин)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    min="1"
                    step="1"
                    value={settings.ai.rateLimitPerMinute}
                    onChange={(e) =>
                      updateAi("rateLimitPerMinute", parseInt(e.target.value, 10) || 1)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Максимальное количество запросов к AI в минуту на студента
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Gamification Tab ========== */}
        <TabsContent value="gamification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Опыт за действия
              </CardTitle>
              <CardDescription>
                Количество XP за различные достижения студентов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="xpPerLesson">XP за урок</Label>
                  <Input
                    id="xpPerLesson"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.gamification.xpPerLesson}
                    onChange={(e) =>
                      updateGamification("xpPerLesson", parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonusPerfectQuiz">Бонус за perfect quiz</Label>
                  <Input
                    id="bonusPerfectQuiz"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.gamification.bonusPerfectQuiz}
                    onChange={(e) =>
                      updateGamification("bonusPerfectQuiz", parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonusSandboxHighScore">Бонус за sandbox &gt;80</Label>
                  <Input
                    id="bonusSandboxHighScore"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.gamification.bonusSandboxHighScore}
                    onChange={(e) =>
                      updateGamification(
                        "bonusSandboxHighScore",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Streak-бонусы
              </CardTitle>
              <CardDescription>
                Дополнительные XP за серию дней подряд
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="streakBonus7Days">Streak 7 дней XP</Label>
                  <Input
                    id="streakBonus7Days"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.gamification.streakBonus7Days}
                    onChange={(e) =>
                      updateGamification("streakBonus7Days", parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streakBonus30Days">Streak 30 дней XP</Label>
                  <Input
                    id="streakBonus30Days"
                    type="number"
                    min="0"
                    step="1"
                    value={settings.gamification.streakBonus30Days}
                    onChange={(e) =>
                      updateGamification("streakBonus30Days", parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
