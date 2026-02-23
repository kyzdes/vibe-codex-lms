import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "node:fs";
import path from "node:path";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

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

const DEFAULT_SETTINGS: Settings = {
  ai: {
    evaluationModel: "anthropic/claude-sonnet-4-5-20250514",
    hintModel: "anthropic/claude-haiku-4-5-20251001",
    dailyBudgetPerUser: 0.5,
    rateLimitPerMinute: 20,
    systemPrompt:
      "Ты — обучающий помощник VibeLearn.\nПравила:\n1. Никогда не давай прямой ответ\n2. Используй метод Сократа — задавай наводящие вопросы\n3. Поощряй самостоятельное мышление\n4. Отвечай на русском языке\n5. Будь кратким и дружелюбным",
  },
  gamification: {
    xpPerLesson: 10,
    bonusPerfectQuiz: 20,
    bonusSandboxHighScore: 15,
    streakBonus7Days: 50,
    streakBonus30Days: 200,
  },
};

function readSettings(): Settings {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      const dir = path.dirname(SETTINGS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: Settings): void {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value >= 0;
}

function validateAiSettings(ai: Partial<AiSettings>): string | null {
  if (ai.evaluationModel !== undefined && !isValidString(ai.evaluationModel)) {
    return "evaluationModel должен быть непустой строкой";
  }
  if (ai.hintModel !== undefined && !isValidString(ai.hintModel)) {
    return "hintModel должен быть непустой строкой";
  }
  if (ai.dailyBudgetPerUser !== undefined && !isValidPositiveNumber(ai.dailyBudgetPerUser)) {
    return "dailyBudgetPerUser должен быть положительным числом";
  }
  if (ai.rateLimitPerMinute !== undefined) {
    if (typeof ai.rateLimitPerMinute !== "number" || !Number.isInteger(ai.rateLimitPerMinute) || ai.rateLimitPerMinute < 1) {
      return "rateLimitPerMinute должен быть целым числом >= 1";
    }
  }
  if (ai.systemPrompt !== undefined && typeof ai.systemPrompt !== "string") {
    return "systemPrompt должен быть строкой";
  }
  return null;
}

function validateGamificationSettings(gam: Partial<GamificationSettings>): string | null {
  const intFields: (keyof GamificationSettings)[] = [
    "xpPerLesson",
    "bonusPerfectQuiz",
    "bonusSandboxHighScore",
    "streakBonus7Days",
    "streakBonus30Days",
  ];
  for (const field of intFields) {
    if (gam[field] !== undefined) {
      const val = gam[field];
      if (typeof val !== "number" || !Number.isInteger(val) || val < 0) {
        return `${field} должен быть целым неотрицательным числом`;
      }
    }
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = readSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидный JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Тело запроса должно быть объектом" }, { status: 400 });
  }

  const current = readSettings();

  if (body.ai !== undefined) {
    if (typeof body.ai !== "object" || body.ai === null || Array.isArray(body.ai)) {
      return NextResponse.json({ error: "ai должен быть объектом" }, { status: 400 });
    }
    const aiPatch = body.ai as Partial<AiSettings>;
    const aiError = validateAiSettings(aiPatch);
    if (aiError) {
      return NextResponse.json({ error: aiError }, { status: 400 });
    }
    current.ai = { ...current.ai, ...aiPatch };
  }

  if (body.gamification !== undefined) {
    if (typeof body.gamification !== "object" || body.gamification === null || Array.isArray(body.gamification)) {
      return NextResponse.json({ error: "gamification должен быть объектом" }, { status: 400 });
    }
    const gamPatch = body.gamification as Partial<GamificationSettings>;
    const gamError = validateGamificationSettings(gamPatch);
    if (gamError) {
      return NextResponse.json({ error: gamError }, { status: 400 });
    }
    current.gamification = { ...current.gamification, ...gamPatch };
  }

  writeSettings(current);

  return NextResponse.json(current);
}
