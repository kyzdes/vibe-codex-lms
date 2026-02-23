import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { completeLesson } from "@/services/xp";
import { updateStreak } from "@/services/streak";
import { checkAchievements } from "@/services/achievements";

// GET — get user progress for a lesson
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  const progress = await prisma.userProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
  });

  return NextResponse.json({ data: progress });
}

// POST — mark lesson as started or completed
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const body = await req.json();
  const { action, score, answersData } = body as {
    action: "start" | "complete";
    score?: number;
    answersData?: Record<string, unknown>;
  };

  if (action === "start") {
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: { userId: session.user.id, lessonId },
      },
      create: {
        userId: session.user.id,
        lessonId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
      update: {},
    });

    return NextResponse.json({ data: progress });
  }

  if (action === "complete") {
    // Complete the lesson and award XP
    const result = await completeLesson(session.user.id, lessonId, score);

    // Update streak
    const streakResult = await updateStreak(session.user.id);

    // Save answers data if provided (for quizzes)
    if (answersData) {
      await prisma.userProgress.update({
        where: {
          userId_lessonId: { userId: session.user.id, lessonId },
        },
        data: { answersData, score } as any,
      });
    }

    // Check achievements
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    const earnedAchievements = await checkAchievements({
      userId: session.user.id,
      event: lesson?.type === "QUIZ" ? "quiz_score" : lesson?.type === "SANDBOX" ? "sandbox_score" : "lesson_complete",
      data: { score },
    });

    // Also check streak achievement
    if (streakResult.streakDays > 0) {
      const streakAchievements = await checkAchievements({
        userId: session.user.id,
        event: "streak_update",
      });
      earnedAchievements.push(...streakAchievements);
    }

    return NextResponse.json({
      data: {
        ...result,
        streak: streakResult,
        achievements: earnedAchievements,
      },
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
