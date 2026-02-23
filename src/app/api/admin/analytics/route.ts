import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getMonthlyAiCost } from "@/services/ai-cost";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    newUsersThisMonth,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    enrollmentsThisMonth,
    lessonsCompleted,
    lessonsCompletedThisWeek,
    totalRevenue,
    revenueThisMonth,
    monthlyAiCost,
    activeUsersThisWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { enrolledAt: { gte: startOfMonth } } }),
    prisma.userProgress.count({ where: { status: "COMPLETED" } }),
    prisma.userProgress.count({ where: { status: "COMPLETED", completedAt: { gte: startOfWeek } } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS", createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    getMonthlyAiCost(),
    prisma.userProgress.groupBy({
      by: ["userId"],
      where: { completedAt: { gte: startOfWeek } },
    }),
  ]);

  return NextResponse.json({
    data: {
      users: { total: totalUsers, newThisMonth: newUsersThisMonth },
      courses: { total: totalCourses, published: publishedCourses },
      enrollments: { total: totalEnrollments, thisMonth: enrollmentsThisMonth },
      lessons: { completed: lessonsCompleted, completedThisWeek: lessonsCompletedThisWeek },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        thisMonth: revenueThisMonth._sum.amount || 0,
      },
      ai: { monthlyUsd: monthlyAiCost },
      activity: { activeUsersThisWeek: activeUsersThisWeek.length },
    },
  });
}
