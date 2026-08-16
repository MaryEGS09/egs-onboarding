import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processTurn } from "@/lib/ai/conversation-engine";
import { requireSessionAccess } from "@/lib/session/access";
import { syncGeneralInfoToClient } from "@/lib/session/general-info-sync";
import { prisma } from "@/lib/db/prisma";

const BodySchema = z.object({
  inputType: z.enum(["text", "transcript"]),
  content: z.string().min(1),
  mediaUploadId: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireSessionAccess(req, id);
  if (!access.ok) return access.response;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await processTurn({ sessionId: id, ...parsed.data });

  await syncGeneralInfoToClient(id, result.answeredQuestions);

  await prisma.onboardingSession.update({
    where: { id },
    data: { lastActivityAt: new Date(), ...(result.sessionComplete ? { completedAt: new Date() } : {}) },
  });

  return NextResponse.json(result);
}
