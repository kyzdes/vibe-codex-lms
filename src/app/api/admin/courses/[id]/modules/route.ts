import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const moduleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(255),
  orderIndex: z.number().int().min(0).default(0),
  unlockCondition: z.record(z.string(), z.unknown()).optional().nullable(),
});

// POST /api/admin/courses/[id]/modules — create a module under a course
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: courseId } = await params;
  const body = await req.json();
  const parsed = moduleSchema.safeParse({ ...body, courseId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Auto order index
  if (!body.orderIndex && body.orderIndex !== 0) {
    const maxOrder = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    parsed.data.orderIndex = (maxOrder?.orderIndex ?? -1) + 1;
  }

  const mod = await prisma.module.create({
    data: parsed.data as any,
  });
  return NextResponse.json({ data: mod }, { status: 201 });
}
