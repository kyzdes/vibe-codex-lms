import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  priceRub: z.number().int().min(0).default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  estimatedHours: z.number().min(0).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");

  const where = {
    ...(search && { title: { contains: search, mode: "insensitive" as const } }),
    ...(status && { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" }),
  };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({
    data: courses,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug || slugify(data.title);

  const existing = await prisma.course.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Курс с таким slug уже существует" }, { status: 409 });
  }

  const course = await prisma.course.create({
    data: {
      ...data,
      slug,
      estimatedHours: data.estimatedHours ?? null,
    } as any,
  });

  return NextResponse.json({ data: course }, { status: 201 });
}
