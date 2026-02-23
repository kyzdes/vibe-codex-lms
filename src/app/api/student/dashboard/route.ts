import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getLevelInfo, getNextLevelXp } from "@/services/xp";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, enrollments, recentProgress, achievements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        level: true,
        streakDays: true,
        streakLastDate: true,
      },
    }),
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: { select: { id: true } },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.userProgress.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 10,
      include: {
        lesson: {
          select: { title: true, type: true, module: { select: { course: { select: { title: true, slug: true } } } } },
        },
      },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
  ]);

  // Calculate progress per course
  const completedLessonIds = await prisma.userProgress.findMany({
    where: { userId, status: "COMPLETED" },
    select: { lessonId: true },
  });
  const completedSet = new Set(completedLessonIds.map((p) => p.lessonId));

  const coursesWithProgress = enrollments.map((enrollment) => {
    const totalLessons = enrollment.course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0
    );
    const completedLessons = enrollment.course.modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => completedSet.has(l.id)).length,
      0
    );

    return {
      id: enrollment.course.id,
      slug: enrollment.course.slug,
      title: enrollment.course.title,
      totalLessons,
      completedLessons,
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  });

  const levelInfo = getLevelInfo(user?.level || 1);
  const nextLevelXp = getNextLevelXp(user?.xp || 0);

  return NextResponse.json({
    data: {
      xp: user?.xp || 0,
      level: user?.level || 1,
      levelTitle: levelInfo?.title || "Новичок",
      nextLevelXp,
      streakDays: user?.streakDays || 0,
      courses: coursesWithProgress,
      recentActivity: recentProgress,
      achievements: achievements.map((ua) => ({
        slug: ua.achievement.slug,
        title: ua.achievement.title,
        description: ua.achievement.description,
        iconUrl: ua.achievement.iconUrl,
        earnedAt: ua.earnedAt,
      })),
    },
  });
}
