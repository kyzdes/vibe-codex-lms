import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImageUrl: true,
      priceRub: true,
      status: true,
      difficulty: true,
      estimatedHours: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
      modules: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          orderIndex: true,
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              orderIndex: true,
              xpReward: true,
              estimatedMinutes: true,
              isFreePreview: true,
            },
          },
        },
      },
    },
  });

  if (!course || course.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "Курс не найден" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: course });
}
