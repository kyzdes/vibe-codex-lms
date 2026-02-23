"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Video,
  Code2,
  HelpCircle,
  Layers,
  Image,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LessonData {
  id: string;
  title: string;
  type: "ARTICLE" | "VIDEO" | "SANDBOX" | "QUIZ" | "INTERACTIVE" | "MEDIA";
  content: Record<string, unknown> | null;
  orderIndex: number;
  xpReward: number;
  estimatedMinutes: number | null;
  isFreePreview: boolean;
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
  };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<string, string> = {
  ARTICLE: "Статья",
  VIDEO: "Видео",
  SANDBOX: "Песочница",
  QUIZ: "Квиз",
  INTERACTIVE: "Интерактив",
  MEDIA: "Медиа",
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  ARTICLE: FileText,
  VIDEO: Video,
  SANDBOX: Code2,
  QUIZ: HelpCircle,
  INTERACTIVE: Layers,
  MEDIA: Image,
};

/* ------------------------------------------------------------------ */
/*  Helpers: default content per lesson type                           */
/* ------------------------------------------------------------------ */

function defaultContent(type: string): Record<string, unknown> {
  switch (type) {
    case "ARTICLE":
      return { html: "" };
    case "VIDEO":
      return { video_url: "", thumbnail_url: "", duration_sec: 0 };
    case "QUIZ":
      return { questions: [], pass_threshold: 70 };
    case "SANDBOX":
      return {
        task_description: "",
        starter_code: "",
        reference_solution: "",
        evaluation_criteria: "",
        sandbox_type: "prompt",
      };
    case "INTERACTIVE":
      return {};
    case "MEDIA":
      return { media_type: "image", url: "" };
    default:
      return {};
  }
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function AdminLessonEditorPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [xpReward, setXpReward] = useState(10);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [content, setContent] = useState<Record<string, unknown>>({});

  /* ---- Fetch ---------------------------------------------------- */

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`);
      if (!res.ok) throw new Error("Не удалось загрузить урок");
      const json = await res.json();
      const data: LessonData = json.data;
      setLesson(data);
      setTitle(data.title);
      setXpReward(data.xpReward);
      setIsFreePreview(data.isFreePreview);
      setContent(data.content ?? defaultContent(data.type));
    } catch {
      toast.error("Ошибка загрузки урока");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  /* ---- Save ----------------------------------------------------- */

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          xpReward,
          isFreePreview,
          content,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Урок сохранён");
      const json = await res.json();
      setLesson(json.data);
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Content helpers ------------------------------------------ */

  const updateContent = (key: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  /* ---- Loading state -------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Урок не найден.
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[lesson.type] || FileText;

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="max-w-4xl">
      {/* ---- Header ---------------------------------------------- */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            {lesson.module.course.title} / {lesson.module.title}
          </p>
          <h1 className="text-2xl font-bold truncate">{lesson.title}</h1>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <TypeIcon className="h-3.5 w-3.5" />
          {TYPE_LABELS[lesson.type]}
        </Badge>
      </div>

      {/* ---- Meta settings --------------------------------------- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Основные настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Название урока
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите название"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Награда XP
              </label>
              <Input
                type="number"
                min={0}
                value={xpReward}
                onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isFreePreview}
              onClick={() => setIsFreePreview((v) => !v)}
              className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
                border-2 border-transparent transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${isFreePreview ? "bg-primary" : "bg-input"}
              `}
            >
              <span
                className={`
                  pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg
                  ring-0 transition-transform
                  ${isFreePreview ? "translate-x-5" : "translate-x-0"}
                `}
              />
            </button>
            <span className="text-sm font-medium flex items-center gap-1.5">
              {isFreePreview ? (
                <Eye className="h-4 w-4 text-primary" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              Бесплатный превью
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ---- Type-specific editor -------------------------------- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Содержимое урока</CardTitle>
        </CardHeader>
        <CardContent>
          {lesson.type === "ARTICLE" && (
            <ArticleEditor content={content} updateContent={updateContent} />
          )}
          {lesson.type === "VIDEO" && (
            <VideoEditor content={content} updateContent={updateContent} />
          )}
          {lesson.type === "QUIZ" && (
            <QuizEditor content={content} setContent={setContent} />
          )}
          {lesson.type === "SANDBOX" && (
            <SandboxEditor content={content} updateContent={updateContent} />
          )}
          {lesson.type === "INTERACTIVE" && (
            <InteractiveEditor content={content} setContent={setContent} />
          )}
          {lesson.type === "MEDIA" && (
            <MediaEditor content={content} updateContent={updateContent} />
          )}
        </CardContent>
      </Card>

      {/* ---- Footer actions -------------------------------------- */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="outline" asChild>
          <Link href={`/admin/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к курсу
          </Link>
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Сохранить
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Sub-editors                                                        */
/* ================================================================== */

/* ---- ARTICLE ---------------------------------------------------- */

function ArticleEditor({
  content,
  updateContent,
}: {
  content: Record<string, unknown>;
  updateContent: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">
        Текст статьи
      </label>
      <TiptapEditor
        content={(content.html as string) || ""}
        onChange={(html) => updateContent("html", html)}
        placeholder="Начните писать содержимое статьи..."
      />
    </div>
  );
}

/* ---- VIDEO ------------------------------------------------------ */

function VideoEditor({
  content,
  updateContent,
}: {
  content: Record<string, unknown>;
  updateContent: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">URL видео</label>
        <Input
          value={(content.video_url as string) || ""}
          onChange={(e) => updateContent("video_url", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">
          URL превью (thumbnail)
        </label>
        <Input
          value={(content.thumbnail_url as string) || ""}
          onChange={(e) => updateContent("thumbnail_url", e.target.value)}
          placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg"
        />
        {(content.thumbnail_url as string) && (
          <div className="mt-2 rounded-md overflow-hidden border max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.thumbnail_url as string}
              alt="Превью"
              className="w-full h-auto"
            />
          </div>
        )}
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">
          Длительность (сек.)
        </label>
        <Input
          type="number"
          min={0}
          value={(content.duration_sec as number) ?? 0}
          onChange={(e) =>
            updateContent("duration_sec", parseInt(e.target.value) || 0)
          }
          placeholder="360"
        />
        {typeof content.duration_sec === "number" && content.duration_sec > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {Math.floor((content.duration_sec as number) / 60)} мин.{" "}
            {(content.duration_sec as number) % 60} сек.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---- QUIZ ------------------------------------------------------- */

function QuizEditor({
  content,
  setContent,
}: {
  content: Record<string, unknown>;
  setContent: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const [jsonStr, setJsonStr] = useState(() =>
    JSON.stringify(content, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(jsonStr);
      setContent(parsed);
      setError(null);
    } catch (e) {
      setError("Некорректный JSON. Проверьте синтаксис.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium block">
          Вопросы (JSON)
        </label>
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>
      <Textarea
        rows={16}
        value={jsonStr}
        onChange={(e) => setJsonStr(e.target.value)}
        onBlur={handleBlur}
        className="font-mono text-sm"
        placeholder={`{
  "questions": [
    {
      "question": "Что такое React?",
      "options": ["Библиотека", "Фреймворк", "Язык"],
      "correctIndex": 0
    }
  ],
  "pass_threshold": 70
}`}
      />
      <p className="text-xs text-muted-foreground">
        Формат: {"{"} questions: [{"{"} question, options, correctIndex {"}"}], pass_threshold: 70 {"}"}
      </p>
    </div>
  );
}

/* ---- SANDBOX ---------------------------------------------------- */

function SandboxEditor({
  content,
  updateContent,
}: {
  content: Record<string, unknown>;
  updateContent: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">
          Описание задачи
        </label>
        <Textarea
          rows={4}
          value={(content.task_description as string) || ""}
          onChange={(e) => updateContent("task_description", e.target.value)}
          placeholder="Опишите задачу, которую студент должен выполнить..."
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">
          Начальный код
        </label>
        <Textarea
          rows={8}
          value={(content.starter_code as string) || ""}
          onChange={(e) => updateContent("starter_code", e.target.value)}
          className="font-mono text-sm"
          placeholder="// Начальный код для студента"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">
          Эталонное решение
        </label>
        <Textarea
          rows={8}
          value={(content.reference_solution as string) || ""}
          onChange={(e) => updateContent("reference_solution", e.target.value)}
          className="font-mono text-sm"
          placeholder="// Правильное решение задачи"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">
          Критерии оценки
        </label>
        <Textarea
          rows={3}
          value={(content.evaluation_criteria as string) || ""}
          onChange={(e) => updateContent("evaluation_criteria", e.target.value)}
          placeholder="Опишите критерии, по которым будет оцениваться решение..."
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">
          Тип песочницы
        </label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={(content.sandbox_type as string) || "prompt"}
          onChange={(e) => updateContent("sandbox_type", e.target.value)}
        >
          <option value="prompt">Prompt</option>
          <option value="code">Code</option>
          <option value="terminal">Terminal</option>
        </select>
      </div>
    </div>
  );
}

/* ---- INTERACTIVE ------------------------------------------------ */

function InteractiveEditor({
  content,
  setContent,
}: {
  content: Record<string, unknown>;
  setContent: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const [jsonStr, setJsonStr] = useState(() =>
    JSON.stringify(content, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(jsonStr);
      setContent(parsed);
      setError(null);
    } catch (e) {
      setError("Некорректный JSON. Проверьте синтаксис.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium block">
          Конфигурация (JSON)
        </label>
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>
      <Textarea
        rows={16}
        value={jsonStr}
        onChange={(e) => setJsonStr(e.target.value)}
        onBlur={handleBlur}
        className="font-mono text-sm"
        placeholder="{}"
      />
      <p className="text-xs text-muted-foreground">
        Произвольная JSON-конфигурация интерактивного урока.
      </p>
    </div>
  );
}

/* ---- MEDIA ------------------------------------------------------ */

function MediaEditor({
  content,
  updateContent,
}: {
  content: Record<string, unknown>;
  updateContent: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Тип медиа</label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={(content.media_type as string) || "image"}
          onChange={(e) => updateContent("media_type", e.target.value)}
        >
          <option value="image">Изображение</option>
          <option value="audio">Аудио</option>
          <option value="pdf">PDF</option>
          <option value="other">Другое</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">URL файла</label>
        <Input
          value={(content.url as string) || ""}
          onChange={(e) => updateContent("url", e.target.value)}
          placeholder="https://example.com/media/file.png"
        />
      </div>
      {(content.media_type as string) === "image" && (content.url as string) && (
        <div className="rounded-md overflow-hidden border max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.url as string}
            alt="Превью медиа"
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}
