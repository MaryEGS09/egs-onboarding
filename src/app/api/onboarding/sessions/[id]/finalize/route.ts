import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSessionAccess } from "@/lib/session/access";
import { countIncompleteRequiredQuestions, buildReviewSnapshot } from "@/lib/session/review-document";
import { renderReviewPdf } from "@/lib/session/review-pdf";
import { sendReviewDocumentToTeam } from "@/lib/email/resend";

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

  try {
    const pdfBuffer = await renderReviewPdf(snapshot);
    await sendReviewDocumentToTeam({
      businessName: snapshot.businessName,
      contactName: null,
      contactEmail: snapshot.contactEmail,
      pdfBuffer,
      reason: "client_finalized",
    });
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        sessionId: id,
        actorType: "SYSTEM",
        action: "team_document_email_failed",
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
