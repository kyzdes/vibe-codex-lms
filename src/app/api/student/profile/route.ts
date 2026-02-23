import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getLevelInfo, getNextLevelXp } from "@/services/xp";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, achievementsCount, coursesCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatarUrl: true,
        role: true,
        xp: true,
        level: true,
        streakDays: true,
        preferences: true,
        createdAt: true,
      },
    }),
    prisma.userAchievement.count({ where: { userId } }),
    prisma.enrollment.count({ where: { userId } }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const levelInfo = getLevelInfo(user.level);
  const nextLevelXp = getNextLevelXp(user.xp);

  return NextResponse.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image || user.avatarUrl,
      role: user.role,
      xp: user.xp,
      level: user.level,
      levelTitle: levelInfo?.title || "Новичок",
      levelDescription: levelInfo?.description || "",
      nextLevelXp,
      streakDays: user.streakDays,
      preferences: user.preferences ?? {},
      createdAt: user.createdAt.toISOString(),
      achievementsCount,
      coursesCount,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, preferences } = body as {
    name?: string;
    preferences?: Record<string, unknown>;
  };

  // Validate name
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Имя не может быть пустым" },
        { status: 400 }
      );
    }
    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "Имя слишком длинное (макс. 100 символов)" },
        { status: 400 }
      );
    }
  }

  // Validate preferences
  if (preferences !== undefined) {
    if (typeof preferences !== "object" || preferences === null || Array.isArray(preferences)) {
      return NextResponse.json(
        { error: "Некорректный формат предпочтений" },
        { status: 400 }
      );
    }

    // Validate learningGoals if provided
    if ("learningGoals" in preferences) {
      if (!Array.isArray(preferences.learningGoals)) {
        return NextResponse.json(
          { error: "learningGoals должен быть массивом" },
          { status: 400 }
        );
      }
      const validGoals = [
        "ai-development",
        "ai-design",
        "ai-marketing",
        "ai-products",
      ];
      for (const goal of preferences.learningGoals as string[]) {
        if (!validGoals.includes(goal)) {
          return NextResponse.json(
            { error: `Неизвестная цель обучения: ${goal}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate experienceLevel if provided
    if ("experienceLevel" in preferences) {
      const validLevels = ["beginner", "practitioner", "expert"];
      if (!validLevels.includes(preferences.experienceLevel as string)) {
        return NextResponse.json(
          { error: "Некорректный уровень опыта" },
          { status: 400 }
        );
      }
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) {
    updateData.name = name.trim();
  }
  if (preferences !== undefined) {
    // Merge with existing preferences
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const existingPrefs =
      (existingUser?.preferences as Record<string, unknown>) ?? {};
    updateData.preferences = { ...existingPrefs, ...preferences };
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Нет данных для обновления" },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      preferences: true,
    },
  });

  return NextResponse.json({
    data: updatedUser,
    message: "Профиль обновлён",
  });
}
