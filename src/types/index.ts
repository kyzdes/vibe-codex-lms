export type { UserRole, CourseStatus, CourseDifficulty, LessonType, ProgressStatus, PaymentStatus, ContentNodeType, RelationType, PageStatus } from "@prisma/client";

// XP Level thresholds
export const XP_LEVELS = [
  { level: 1, xp: 0, title: "Новичок", description: "Первые шаги в мире AI" },
  { level: 2, xp: 100, title: "Промпт-падаван", description: "Освоил базовые промпты" },
  { level: 3, xp: 300, title: "AI-практик", description: "Уверенно использует AI" },
  { level: 4, xp: 600, title: "Вайб-кодер", description: "Создаёт продукты с AI" },
  { level: 5, xp: 1000, title: "Вайб-архитектор", description: "Проектирует сложные решения" },
  { level: 6, xp: 1500, title: "AI-мастер", description: "Полное владение AI-стеком" },
  { level: 7, xp: 2500, title: "Вайб-сенсей", description: "Эксперт, может учить других" },
] as const;

// Content types for lesson JSONB content field
export interface ArticleContent {
  blocks: Record<string, unknown>;
}

export interface VideoContent {
  video_url: string;
  thumbnail_url?: string;
  duration_sec?: number;
  chapters?: { time: number; title: string }[];
  captions_vtt_url?: string;
}

export interface SandboxContent {
  sandbox_type: "prompt" | "code";
  task_description: string;
  starter_code?: string;
  reference_solution?: string;
  evaluation_criteria?: string;
  model_whitelist?: string[];
  max_attempts?: number;
  hints?: string[];
}

export interface QuizContent {
  questions: QuizQuestion[];
  pass_threshold: number;
  shuffle?: boolean;
  time_limit_sec?: number;
}

export interface QuizQuestion {
  id: string;
  type: "single_choice" | "multiple_choice" | "true_false" | "free_text";
  text: string;
  options?: { id: string; text: string }[];
  correct: string | string[];
  explanation?: string;
  points: number;
}

export interface InteractiveContent {
  interactive_type: "step_by_step" | "fill_blank" | "before_after" | "hotspot";
  steps?: { instruction: string; check: string }[];
  blanks?: { text: string; answer: string }[];
}

export interface MediaContent {
  media_type: "image" | "gif" | "gallery" | "embed" | "pdf";
  url?: string;
  urls?: string[];
  embed_url?: string;
  caption?: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
