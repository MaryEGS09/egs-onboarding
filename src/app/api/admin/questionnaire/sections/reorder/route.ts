import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const BodySchema = z.object({ orderedIds: z.array(z.string()).min(1) });

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) => prisma.section.update({ where: { id }, data: { order: index } })),
  );
  return NextResponse.json({ ok: true });
}
