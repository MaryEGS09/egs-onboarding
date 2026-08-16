import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSessionAccess } from "@/lib/session/access";
import { buildReviewSnapshot } from "@/lib/session/review-document";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireSessionAccess(req, id);
  if (!access.ok) return access.response;

  const snapshot = await buildReviewSnapshot(id);

  const lastVersion = await prisma.reviewDocument.findFirst({
    where: { sessionId: id },
    orderBy: { version: "desc" },
  });
  const nextVersion = (lastVersion?.version ?? 0) + 1;

  await prisma.reviewDocument.create({
    data: {
      sessionId: id,
      version: nextVersion,
      format: "JSON",
      snapshotJson: snapshot,
      generatedBy: "SYSTEM_AUTO",
    },
  });

  return NextResponse.json(snapshot);
}

const ReopenSchema = z.object({ questionKeys: z.array(z.string()).min(1) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireSessionAccess(req, id);
  if (!access.ok) return access.response;

  const parsed = ReopenSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const questions = await prisma.question.findMany({ where: { key: { in: parsed.data.questionKeys } } });
  if (questions.length === 0) {
    return NextResponse.json({ error: "No matching questions found" }, { status: 404 });
  }

  await prisma.answer.updateMany({
    where: { sessionId: id, questionId: { in: questions.map((q) => q.id) } },
    data: { isComplete: false },
  });

  const firstQuestion = questions.sort((a, b) => a.order - b.order)[0];

  await prisma.onboardingSession.update({
    where: { id },
    data: {
      status: "IN_PROGRESS",
      reviewStatus: "NEEDS_CORRECTION",
      currentPhaseId: firstQuestion.sectionId ? (await prisma.section.findUnique({ where: { id: firstQuestion.sectionId } }))?.phaseId : undefined,
      currentSectionId: firstQuestion.sectionId,
      currentQuestionId: firstQuestion.id,
      lastActivityAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      sessionId: id,
      actorType: "CLIENT",
      action: "review_reopen_selected_questions",
      metadata: { questionKeys: parsed.data.questionKeys },
    },
  });

  return NextResponse.json({ ok: true, reopenedCount: questions.length });
}
