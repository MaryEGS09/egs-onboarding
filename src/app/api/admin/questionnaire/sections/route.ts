import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const phaseId = req.nextUrl.searchParams.get("phaseId");
  const sections = await prisma.section.findMany({
    where: phaseId ? { phaseId } : undefined,
    orderBy: { order: "asc" },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(sections);
}

const CreateSchema = z.object({ phaseId: z.string().min(1), key: z.string().min(1), name: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const maxOrder = await prisma.section.aggregate({
    _max: { order: true },
    where: { phaseId: parsed.data.phaseId },
  });
  const section = await prisma.section.create({
    data: { ...parsed.data, order: (maxOrder._max.order ?? -1) + 1 },
  });
  return NextResponse.json(section, { status: 201 });
}
