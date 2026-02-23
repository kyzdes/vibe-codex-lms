import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const difficulty = searchParams.get("difficulty") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

  const where: Record<string, unknown> = {
    status: "PUBLISHED" as const,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (difficulty && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(difficulty)) {
    where.difficulty = difficulty;
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverImageUrl: true,
        priceRub: true,
        difficulty: true,
        estimatedHours: true,
        createdAt: true,
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({
    data: courses,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}
