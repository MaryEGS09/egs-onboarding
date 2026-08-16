import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const UpdateSchema = z.object({ name: z.string().min(1).optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const section = await prisma.section.update({ where: { id }, data: parsed.data });
  return NextResponse.json(section);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const questionCount = await prisma.question.count({ where: { sectionId: id } });
  if (questionCount > 0) {
    return NextResponse.json({ error: "Cannot delete a section that still has questions. Archive or move its questions first." }, { status: 400 });
  }
  await prisma.section.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
