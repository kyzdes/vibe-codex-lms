import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limiter";
import { checkAchievements } from "@/services/achievements";
import { z } from "zod";

const commentSchema = z.object({
  lessonId: z.string().cuid(),
  parentId: z.string().cuid().optional().nullable(),
  content: z.string().min(1).max(5000),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { lessonId, parentId: null },
    include: {
      user: { select: { id: true, name: true, image: true } },
      replies: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: comments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`comment:${session.user.id}`, 10, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Слишком много комментариев" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  // Check comment achievements
  await checkAchievements({
    userId: session.user.id,
    event: "comment_added",
  });

  return NextResponse.json({ data: comment }, { status: 201 });
}
