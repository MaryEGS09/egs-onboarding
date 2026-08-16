import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getSessionProgress } from "@/lib/session/progress";
import { requireSessionAccess } from "@/lib/session/access";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireSessionAccess(req, id);
  if (!access.ok) return access.response;

  const progress = await getSessionProgress(id);
  return NextResponse.json(progress);
}

const PatchSchema = z.object({ status: z.enum(["PAUSED", "IN_PROGRESS"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireSessionAccess(req, id);
  if (!access.ok) return access.response;

  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await prisma.onboardingSession.update({
    where: { id },
    data: { status: parsed.data.status, lastActivityAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
