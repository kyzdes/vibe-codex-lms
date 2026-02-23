"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, DollarSign, Shield, Zap } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Настройки AI</h1>

      <div className="space-y-6">
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
            <div>
              <label className="text-sm font-medium mb-1 block">
                Оценка песочниц
              </label>
              <Input defaultValue="anthropic/claude-sonnet-4-5-20250514" readOnly />
              <p className="text-xs text-muted-foreground mt-1">
                Используется для оценки промптов и кода в песочницах
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Подсказки и объяснения
              </label>
              <Input defaultValue="anthropic/claude-haiku-4-5-20251001" readOnly />
              <p className="text-xs text-muted-foreground mt-1">
                Быстрая и дешёвая модель для подсказок студентам
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Бюджет и лимиты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Дневной лимит на студента (USD)
                </label>
                <Input type="number" defaultValue="0.50" step="0.01" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Rate limit (запросов/мин)
                </label>
                <Input type="number" defaultValue="20" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Промпт-инструкции AI-наставника
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              defaultValue={`Ты — обучающий помощник VibeLearn.
Правила:
1. Никогда не давай прямой ответ
2. Используй метод Сократа — задавай наводящие вопросы
3. Поощряй самостоятельное мышление
4. Отвечай на русском языке
5. Будь кратким и дружелюбным`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Геймификация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-1 block">XP за урок</label>
                <Input type="number" defaultValue="10" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Бонус за perfect quiz</label>
                <Input type="number" defaultValue="20" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Бонус за sandbox &gt;80</label>
                <Input type="number" defaultValue="15" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Streak 7 дней XP</label>
                <Input type="number" defaultValue="50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Streak 30 дней XP</label>
                <Input type="number" defaultValue="200" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
