import { prisma } from "@/lib/prisma";
import { XP_LEVELS } from "@/types";

export function calculateLevel(xp: number): number {
  let level = 1;
  for (const l of XP_LEVELS) {
    if (xp >= l.xp) level = l.level;
    else break;
  }
  return level;
}

export function getLevelInfo(level: number) {
  return XP_LEVELS.find((l) => l.level === level) || XP_LEVELS[0];
}

export function getNextLevelXp(currentXp: number): number | null {
  for (const l of XP_LEVELS) {
    if (l.xp > currentXp) return l.xp;
  }
  return null;
}

export async function awardXp(userId: string, amount: number): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const newXp = user.xp + amount;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > user.level;

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel },
  });

  return { newXp, newLevel, leveledUp };
}

export async function completeLesson(
  userId: string,
  lessonId: string,
  score?: number
): Promise<{ xpEarned: number; leveledUp: boolean }> {
  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
  });

  let xpEarned = lesson.xpReward;

  // Bonus for perfect quiz
  if (lesson.type === "QUIZ" && score === 100) {
    xpEarned += 20;
  }

  // Bonus for sandbox > 80
  if (lesson.type === "SANDBOX" && score && score > 80) {
    xpEarned += 15;
  }

  const existing = await prisma.userProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (existing?.status === "COMPLETED") {
    return { xpEarned: 0, leveledUp: false };
  }

  await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      status: "COMPLETED",
      score,
      xpEarned,
      attempts: 1,
      startedAt: new Date(),
      completedAt: new Date(),
    },
    update: {
      status: "COMPLETED",
      score,
      xpEarned,
      completedAt: new Date(),
      attempts: { increment: 1 },
    },
  });

  const { leveledUp } = await awardXp(userId, xpEarned);
  return { xpEarned, leveledUp };
}
