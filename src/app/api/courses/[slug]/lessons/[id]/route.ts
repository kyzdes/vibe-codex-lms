import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET — get full lesson content for enrolled students
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, status: true, priceRub: true },
  });

  if (!course || course.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          courseId: true,
          lessons: {
            select: { id: true, title: true, type: true, orderIndex: true },
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!lesson || lesson.module.courseId !== course.id) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Check if user can access (free preview or enrolled)
  if (!lesson.isFreePreview && course.priceRub > 0) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", requiresAuth: true },
        { status: 401 }
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: session.user.id, courseId: course.id },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled", requiresEnrollment: true },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({ data: lesson });
}
