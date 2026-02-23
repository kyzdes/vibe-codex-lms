import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const lessonCreateSchema = z.object({
  moduleId: z.string().cuid(),
  type: z.enum(["ARTICLE", "VIDEO", "SANDBOX", "QUIZ", "INTERACTIVE", "MEDIA"]).default("ARTICLE"),
  title: z.string().min(1).max(255),
  content: z.record(z.string(), z.unknown()).optional(),
  orderIndex: z.number().int().min(0).optional(),
  xpReward: z.number().int().min(0).default(10),
  estimatedMinutes: z.number().int().min(0).optional().nullable(),
  isFreePreview: z.boolean().default(false),
});

const lessonUpdateSchema = lessonCreateSchema.partial().omit({ moduleId: true });

// GET — get a single lesson by id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { module: { include: { course: true } } },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: lesson });
}

// PATCH — update a lesson
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = lessonUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lesson = await prisma.lesson.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ data: lesson });
}

// DELETE — delete a lesson
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.lesson.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}
