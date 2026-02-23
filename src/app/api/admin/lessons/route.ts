import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const lessonCreateSchema = z.object({
  moduleId: z.string().min(1),
  type: z.enum(["ARTICLE", "VIDEO", "SANDBOX", "QUIZ", "INTERACTIVE", "MEDIA"]).default("ARTICLE"),
  title: z.string().min(1).max(255),
  content: z.record(z.string(), z.unknown()).optional(),
  orderIndex: z.number().int().min(0).optional(),
  xpReward: z.number().int().min(0).default(10),
  estimatedMinutes: z.number().int().min(0).optional().nullable(),
  isFreePreview: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = lessonCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Auto order index
  if (parsed.data.orderIndex === undefined) {
    const maxOrder = await prisma.lesson.findFirst({
      where: { moduleId: parsed.data.moduleId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    parsed.data.orderIndex = (maxOrder?.orderIndex ?? -1) + 1;
  }

  const lesson = await prisma.lesson.create({ data: parsed.data as any });
  return NextResponse.json({ data: lesson }, { status: 201 });
}
