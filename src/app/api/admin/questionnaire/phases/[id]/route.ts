import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const UpdateSchema = z.object({ name: z.string().min(1).optional(), description: z.string().nullable().optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const phase = await prisma.phase.update({ where: { id }, data: parsed.data });
  return NextResponse.json(phase);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sectionCount = await prisma.section.count({ where: { phaseId: id } });
  if (sectionCount > 0) {
    return NextResponse.json({ error: "Cannot delete a phase that still has sections. Remove its sections first." }, { status: 400 });
  }
  await prisma.phase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
