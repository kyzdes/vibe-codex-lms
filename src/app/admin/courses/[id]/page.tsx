"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, Save, Trash2, ChevronDown, ChevronUp, GripVertical,
  FileText, Video, Code2, HelpCircle, Layers, Image,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  type: string;
  orderIndex: number;
  xpReward: number;
  isFreePreview: boolean;
}

interface Module {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  difficulty: string;
  priceRub: number;
  estimatedHours: number | null;
  modules: Module[];
  _count: { enrollments: number };
}

const LESSON_TYPE_ICONS: Record<string, typeof FileText> = {
  ARTICLE: FileText,
  VIDEO: Video,
  SANDBOX: Code2,
  QUIZ: HelpCircle,
  INTERACTIVE: Layers,
  MEDIA: Image,
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  ARTICLE: "Статья",
  VIDEO: "Видео",
  SANDBOX: "Песочница",
  QUIZ: "Квиз",
  INTERACTIVE: "Интерактив",
  MEDIA: "Медиа",
};

export default function AdminCourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonModule, setNewLessonModule] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState("ARTICLE");

  const fetchCourse = useCallback(async () => {
    const res = await fetch(`/api/admin/courses/${id}`);
    if (res.ok) {
      const json = await res.json();
      setCourse(json.data);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const saveCourse = async (fields: Partial<Course>) => {
    setSaving(true);
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      toast.success("Сохранено");
      fetchCourse();
    } else {
      toast.error("Ошибка сохранения");
    }
    setSaving(false);
  };

  const addModule = async () => {
    if (!newModuleTitle.trim()) return;
    const res = await fetch(`/api/admin/courses/${id}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newModuleTitle }),
    });
    if (res.ok) {
      toast.success("Модуль добавлен");
      setNewModuleTitle("");
      fetchCourse();
    }
  };

  const addLesson = async () => {
    if (!newLessonTitle.trim() || !newLessonModule) return;
    const res = await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: newLessonModule,
        title: newLessonTitle,
        type: newLessonType,
      }),
    });
    if (res.ok) {
      toast.success("Урок добавлен");
      setNewLessonTitle("");
      setNewLessonModule(null);
      fetchCourse();
    }
  };

  const deleteLesson = async (lessonId: string) => {
    const res = await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Урок удалён");
      fetchCourse();
    }
  };

  const deleteCourse = async () => {
    if (!confirm("Удалить курс? Это действие необратимо.")) return;
    const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Курс удалён");
      router.push("/admin/courses");
    }
  };

  if (!course) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">{course.title}</h1>
        <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"}>
          {course.status}
        </Badge>
      </div>

      {/* Course settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Настройки курса</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Название</label>
              <Input
                defaultValue={course.title}
                onBlur={(e) => {
                  if (e.target.value !== course.title) saveCourse({ title: e.target.value });
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Статус</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                defaultValue={course.status}
                onChange={(e) => saveCourse({ status: e.target.value as Course["status"] })}
              >
                <option value="DRAFT">Черновик</option>
                <option value="PUBLISHED">Опубликован</option>
                <option value="ARCHIVED">В архиве</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Сложность</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                defaultValue={course.difficulty}
                onChange={(e) => saveCourse({ difficulty: e.target.value as Course["difficulty"] })}
              >
                <option value="BEGINNER">Начальный</option>
                <option value="INTERMEDIATE">Средний</option>
                <option value="ADVANCED">Продвинутый</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Цена (копейки)</label>
              <Input
                type="number"
                defaultValue={course.priceRub}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val !== course.priceRub) saveCourse({ priceRub: val });
                }}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Описание</label>
            <Textarea
              rows={3}
              defaultValue={course.description || ""}
              onBlur={(e) => {
                if (e.target.value !== (course.description || ""))
                  saveCourse({ description: e.target.value });
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="destructive" size="sm" onClick={deleteCourse}>
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить курс
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modules & Lessons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Модули и уроки</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Модуль
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый модуль</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Название модуля"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addModule()}
            />
            <DialogFooter>
              <Button onClick={addModule}>Создать</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {course.modules.map((mod) => (
          <Card key={mod.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base flex-1">{mod.title}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {mod.lessons.length} уроков
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewLessonModule(newLessonModule === mod.id ? null : mod.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {newLessonModule === mod.id && (
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Название урока"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                    value={newLessonType}
                    onChange={(e) => setNewLessonType(e.target.value)}
                  >
                    {Object.entries(LESSON_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={addLesson}>Добавить</Button>
                </div>
              )}
              <div className="space-y-1">
                {mod.lessons.map((lesson) => {
                  const Icon = LESSON_TYPE_ICONS[lesson.type] || FileText;
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted transition-colors group"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Link
                        href={`/admin/courses/${id}/lessons/${lesson.id}`}
                        className="flex-1 text-sm hover:underline"
                      >
                        {lesson.title}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {LESSON_TYPE_LABELS[lesson.type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{lesson.xpReward} XP</span>
                      {lesson.isFreePreview && (
                        <Badge variant="secondary" className="text-xs">Free</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteLesson(lesson.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
                {mod.lessons.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2 text-center">
                    Нет уроков. Нажмите + чтобы добавить.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {course.modules.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            Добавьте первый модуль для курса
          </div>
        )}
      </div>
    </div>
  );
}
