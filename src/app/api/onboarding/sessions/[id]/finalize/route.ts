import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSessionAccess } from "@/lib/session/access";
import { countIncompleteRequiredQuestions, buildReviewSnapshot } from "@/lib/session/review-document";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireSessionAccess(req, id);
  if (!access.ok) return access.response;

  const incompleteCount = await countIncompleteRequiredQuestions(id);
  if (incompleteCount > 0) {
    return NextResponse.json(
      { error: `${incompleteCount} required question(s) still need answers before finalizing.` },
      { status: 400 },
    );
  }

  const snapshot = await buildReviewSnapshot(id);
  const lastVersion = await prisma.reviewDocument.findFirst({ where: { sessionId: id }, orderBy: { version: "desc" } });

  await prisma.reviewDocument.create({
    data: {
      sessionId: id,
      version: (lastVersion?.version ?? 0) + 1,
      format: "JSON",
      snapshotJson: snapshot,
      generatedBy: "CLIENT_FINAL",
    },
  });

  await prisma.onboardingSession.update({
    where: { id },
    data: { status: "COMPLETED", reviewStatus: "APPROVED", completedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { sessionId: id, actorType: "CLIENT", action: "client_confirmed_finalization" },
  });

  return NextResponse.json({ ok: true });
}
