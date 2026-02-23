import { prisma } from "@/lib/prisma";
import { awardXp } from "./xp";

interface AchievementCheck {
  userId: string;
  event: "lesson_complete" | "quiz_score" | "sandbox_score" | "streak_update" | "comment_added";
  data?: Record<string, unknown>;
}

export async function checkAchievements(check: AchievementCheck): Promise<string[]> {
  const earned: string[] = [];
  const achievements = await prisma.achievement.findMany();
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId: check.userId },
    select: { achievementId: true },
  });
  const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId));

  for (const achievement of achievements) {
    if (earnedIds.has(achievement.id)) continue;

    const condition = achievement.condition as {
      type: string;
      count?: number;
      threshold?: number;
    };
    let met = false;

    switch (condition.type) {
      case "first_sandbox": {
        if (check.event === "lesson_complete") {
          const count = await prisma.userProgress.count({
            where: {
              userId: check.userId,
              lesson: { type: "SANDBOX" },
              status: "COMPLETED",
            },
          });
          met = count >= 1;
        }
        break;
      }
      case "quiz_perfect": {
        if (check.event === "quiz_score") {
          const count = await prisma.userProgress.count({
            where: {
              userId: check.userId,
              lesson: { type: "QUIZ" },
              score: 100,
            },
          });
          met = count >= (condition.count || 5);
        }
        break;
      }
      case "streak_days": {
        if (check.event === "streak_update") {
          const user = await prisma.user.findUnique({
            where: { id: check.userId },
          });
          met = (user?.streakDays || 0) >= (condition.count || 7);
        }
        break;
      }
      case "course_complete": {
        if (check.event === "lesson_complete") {
          const enrollments = await prisma.enrollment.findMany({
            where: { userId: check.userId },
            include: {
              course: { include: { modules: { include: { lessons: true } } } },
            },
          });
          for (const enrollment of enrollments) {
            const totalLessons = enrollment.course.modules.reduce(
              (sum, m) => sum + m.lessons.length,
              0
            );
            const completedLessons = await prisma.userProgress.count({
              where: {
                userId: check.userId,
                status: "COMPLETED",
                lesson: {
                  module: { courseId: enrollment.courseId },
                },
              },
            });
            if (totalLessons > 0 && completedLessons >= totalLessons) {
              met = true;
              break;
            }
          }
        }
        break;
      }
      case "sandbox_high_score": {
        if (check.event === "sandbox_score") {
          const count = await prisma.userProgress.count({
            where: {
              userId: check.userId,
              lesson: { type: "SANDBOX" },
              score: { gte: condition.threshold || 80 },
            },
          });
          met = count >= (condition.count || 20);
        }
        break;
      }
      case "comments_count": {
        if (check.event === "comment_added") {
          const count = await prisma.comment.count({
            where: { userId: check.userId },
          });
          met = count >= (condition.count || 10);
        }
        break;
      }
    }

    if (met) {
      await prisma.userAchievement.create({
        data: { userId: check.userId, achievementId: achievement.id },
      });
      if (achievement.xpBonus > 0) {
        await awardXp(check.userId, achievement.xpBonus);
      }
      earned.push(achievement.slug);
    }
  }

  return earned;
}
