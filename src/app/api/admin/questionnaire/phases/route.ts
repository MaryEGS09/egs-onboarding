import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const phases = await prisma.phase.findMany({
    orderBy: { order: "asc" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } },
      },
    },
  });
  return NextResponse.json(phases);
}

const CreateSchema = z.object({ key: z.string().min(1), name: z.string().min(1), description: z.string().optional() });

export async function POST(req: NextRequest) {
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const maxOrder = await prisma.phase.aggregate({ _max: { order: true } });
  const phase = await prisma.phase.create({
    data: { ...parsed.data, order: (maxOrder._max.order ?? -1) + 1 },
  });
  return NextResponse.json(phase, { status: 201 });
}
