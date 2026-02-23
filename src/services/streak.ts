import { prisma } from "@/lib/prisma";
import { awardXp } from "./xp";

export async function updateStreak(userId: string): Promise<{
  streakDays: number;
  streakBroken: boolean;
  bonusXp: number;
}> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = user.streakLastDate
    ? new Date(user.streakLastDate)
    : null;
  if (lastDate) lastDate.setHours(0, 0, 0, 0);

  // Already logged in today
  if (lastDate && lastDate.getTime() === today.getTime()) {
    return { streakDays: user.streakDays, streakBroken: false, bonusXp: 0 };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak: number;
  let streakBroken = false;

  if (lastDate && lastDate.getTime() === yesterday.getTime()) {
    // Consecutive day
    newStreak = user.streakDays + 1;
  } else {
    // Streak broken
    newStreak = 1;
    streakBroken = user.streakDays > 0;
  }

  let bonusXp = 0;
  if (newStreak === 7) bonusXp = 50;
  if (newStreak === 30) bonusXp = 200;

  await prisma.user.update({
    where: { id: userId },
    data: {
      streakDays: newStreak,
      streakLastDate: today,
    },
  });

  if (bonusXp > 0) {
    await awardXp(userId, bonusXp);
  }

  return { streakDays: newStreak, streakBroken, bonusXp };
}
