"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { PromptSandbox } from "@/components/sandbox/prompt-sandbox";
import { CodeSandbox } from "@/components/sandbox/code-sandbox";
import { CommentSection } from "@/components/comments/comment-section";
import type { QuizContent, SandboxContent, VideoContent } from "@/types";

interface LessonData {
  id: string;
  title: string;
  type: string;
  content: Record<string, unknown>;
  xpReward: number;
  module: {
    id: string;
    title: string;
    courseId: string;
    lessons: { id: string; title: string; type: string; orderIndex: number }[];
  };
}

interface ProgressData {
  status: string;
  score: number | null;
  xpEarned: number;
}

export default function LessonPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLesson = useCallback(async () => {
    const res = await fetch(`/api/courses/${slug}/lessons/${id}`);
    if (res.ok) {
      const json = await res.json();
      setLesson(json.data);
    } else {
      const json = await res.json();
      setError(json.error || "Ошибка загрузки");
    }
  }, [slug, id]);

  const fetchProgress = useCallback(async () => {
    const res = await fetch(`/api/progress/${id}`);
    if (res.ok) {
      const json = await res.json();
      setProgress(json.data);
    }
  }, [id]);

  useEffect(() => {
    fetchLesson();
    fetchProgress();
  }, [fetchLesson, fetchProgress]);

  useEffect(() => {
    // Mark as started
    if (lesson && (!progress || progress.status === "NOT_STARTED")) {
      fetch(`/api/progress/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
    }
  }, [lesson, progress, id]);

  const handleComplete = async (score?: number, answersData?: Record<string, unknown>) => {
    setCompleting(true);
    const res = await fetch(`/api/progress/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", score, answersData }),
    });

    if (res.ok) {
      const json = await res.json();
      toast.success(`+${json.data.xpEarned} XP!`);
      if (json.data.leveledUp) {
        toast.success("Новый уровень!");
      }
      if (json.data.achievements?.length > 0) {
        json.data.achievements.forEach((a: string) => toast.success(`Достижение: ${a}`));
      }
      fetchProgress();
    }
    setCompleting(false);
  };

  if (error) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild>
          <Link href={`/courses/${slug}`}>Вернуться к курсу</Link>
        </Button>
      </div>
    );
  }

  if (!lesson) {
    return <div className="container py-12">Загрузка...</div>;
  }

  // Navigation
  const currentIdx = lesson.module.lessons.findIndex((l) => l.id === id);
  const prevLesson = currentIdx > 0 ? lesson.module.lessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < lesson.module.lessons.length - 1 ? lesson.module.lessons[currentIdx + 1] : null;
  const isCompleted = progress?.status === "COMPLETED";

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/courses/${slug}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{lesson.module.title}</p>
          <h1 className="text-xl font-bold">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{lesson.type}</Badge>
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            {lesson.xpReward} XP
          </Badge>
          {isCompleted && (
            <Badge className="gap-1 bg-green-600">
              <CheckCircle className="h-3 w-3" />
              Пройден
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      {lesson.type === "ARTICLE" && (
        <Card>
          <CardContent className="pt-6">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: (lesson.content as { html?: string }).html || "" }}
            />
          </CardContent>
        </Card>
      )}

      {lesson.type === "VIDEO" && (
        <Card>
          <CardContent className="pt-6">
            {(lesson.content as unknown as VideoContent).video_url ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={(lesson.content as unknown as VideoContent).video_url}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Видео не загружено</p>
            )}
          </CardContent>
        </Card>
      )}

      {lesson.type === "QUIZ" && (
        <QuizPlayer
          content={lesson.content as unknown as QuizContent}
          onComplete={(score, answers) => handleComplete(score, answers)}
        />
      )}

      {lesson.type === "SANDBOX" && (
        (lesson.content as unknown as SandboxContent).sandbox_type === "code" ? (
          <CodeSandbox
            content={lesson.content as unknown as SandboxContent}
            lessonId={lesson.id}
            onComplete={(score) => handleComplete(score)}
          />
        ) : (
          <PromptSandbox
            content={lesson.content as unknown as SandboxContent}
            lessonId={lesson.id}
            onComplete={(score) => handleComplete(score)}
          />
        )
      )}

      {(lesson.type === "INTERACTIVE" || lesson.type === "MEDIA") && (
        <Card>
          <CardContent className="pt-6">
            <pre className="text-sm overflow-auto">{JSON.stringify(lesson.content, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {/* Complete button (for article/video) */}
      {(lesson.type === "ARTICLE" || lesson.type === "VIDEO" || lesson.type === "MEDIA") && !isCompleted && (
        <div className="flex justify-center">
          <Button size="lg" onClick={() => handleComplete()} disabled={completing}>
            {completing ? "Сохранение..." : "Отметить как пройденное"}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        {prevLesson ? (
          <Button variant="outline" asChild>
            <Link href={`/courses/${slug}/lessons/${prevLesson.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {prevLesson.title}
            </Link>
          </Button>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Button asChild>
            <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
              {nextLesson.title}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={`/courses/${slug}`}>Вернуться к курсу</Link>
          </Button>
        )}
      </div>

      {/* Comments */}
      <CommentSection lessonId={lesson.id} />
    </div>
  );
}
