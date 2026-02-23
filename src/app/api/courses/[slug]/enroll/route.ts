import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createOrder } from "@/services/cloudpayments";

// POST — enroll in a course (free) or create payment order (paid)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, title: true, priceRub: true, status: true },
  });

  if (!course || course.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });

  if (existing) {
    return NextResponse.json({ data: { enrolled: true, alreadyEnrolled: true } });
  }

  // Free course — enroll directly
  if (course.priceRub === 0) {
    await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
      },
    });

    return NextResponse.json({ data: { enrolled: true } }, { status: 201 });
  }

  // Paid course — create payment order
  const order = await createOrder({
    userId: session.user.id,
    courseId: course.id,
    amount: course.priceRub,
    description: `Оплата курса "${course.title}"`,
  });

  return NextResponse.json({ data: { enrolled: false, payment: order } });
}
