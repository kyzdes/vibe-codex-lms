import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  GraduationCap, Brain, Code2, Zap, Trophy, Flame,
  ArrowRight, BookOpen, Users, Star,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-наставник",
    description: "Персонализированные подсказки через Claude и GPT-4o без прямых ответов — учим думать",
  },
  {
    icon: Code2,
    title: "Промпт-песочницы",
    description: "Практикуйтесь в вайб-кодинге прямо на платформе с AI-оценкой результатов",
  },
  {
    icon: Zap,
    title: "XP и уровни",
    description: "Геймификация обучения — зарабатывайте опыт, открывайте достижения, растите в уровнях",
  },
  {
    icon: Trophy,
    title: "Квизы и проверки",
    description: "Интерактивные тесты для закрепления знаний с мгновенной обратной связью",
  },
  {
    icon: Flame,
    title: "Стрики",
    description: "Поддерживайте серию ежедневных занятий для максимального прогресса",
  },
  {
    icon: BookOpen,
    title: "6 типов контента",
    description: "Статьи, видео, песочницы, квизы, интерактивы и медиа — разнообразие форматов",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="container flex flex-col items-center justify-center py-24 text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5">
            Платформа вайб-кодинга
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Научитесь создавать продукты{" "}
            <span className="text-primary">с помощью AI</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            VibeLearn — минималистичная LMS для обучения вайб-кодингу и применению AI
            для дизайнеров, маркетологов, продакт-менеджеров и всех, кто хочет
            создавать цифровые продукты нового поколения.
          </p>
          <div className="mt-8 flex gap-4">
            <Button size="lg" asChild>
              <Link href="/courses">
                Начать обучение
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signin">Войти</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Как устроено обучение</h2>
            <p className="mt-3 text-muted-foreground">
              Все инструменты для эффективного обучения в одном месте
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/50">
          <div className="container flex flex-col items-center py-20 text-center">
            <GraduationCap className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-3">Готовы начать?</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Присоединяйтесь к сообществу вайб-кодеров. Первые курсы доступны бесплатно.
            </p>
            <Button size="lg" asChild>
              <Link href="/courses">Перейти к курсам</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
