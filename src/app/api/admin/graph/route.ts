import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const edgeSchema = z.object({
  sourceType: z.enum(["COURSE", "MODULE", "LESSON", "PAGE"]),
  sourceId: z.string(),
  targetType: z.enum(["COURSE", "MODULE", "LESSON", "PAGE"]),
  targetId: z.string(),
  relationType: z.enum(["PREREQUISITE", "RECOMMENDED", "RELATED", "UNLOCKS"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET — get graph nodes and edges
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [courses, edges] = await Promise.all([
    prisma.course.findMany({
      include: {
        modules: {
          include: {
            lessons: { select: { id: true, title: true, type: true } },
          },
        },
      },
    }),
    prisma.contentGraph.findMany(),
  ]);

  // Build nodes from courses, modules, lessons
  const nodes: { id: string; type: string; label: string; parentId?: string }[] = [];

  for (const course of courses) {
    nodes.push({ id: course.id, type: "COURSE", label: course.title });
    for (const mod of course.modules) {
      nodes.push({ id: mod.id, type: "MODULE", label: mod.title, parentId: course.id });
      for (const lesson of mod.lessons) {
        nodes.push({ id: lesson.id, type: "LESSON", label: lesson.title, parentId: mod.id });
      }
    }
  }

  return NextResponse.json({
    data: {
      nodes,
      edges: edges.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        sourceType: e.sourceType,
        targetType: e.targetType,
        relationType: e.relationType,
        metadata: e.metadata,
      })),
    },
  });
}

// POST — create a new edge
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = edgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const edge = await prisma.contentGraph.create({
    data: parsed.data,
  });

  return NextResponse.json({ data: edge }, { status: 201 });
}

// DELETE — remove an edge by id
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const edgeId = searchParams.get("id");
  if (!edgeId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.contentGraph.delete({ where: { id: edgeId } });
  return NextResponse.json({ message: "Deleted" });
}
