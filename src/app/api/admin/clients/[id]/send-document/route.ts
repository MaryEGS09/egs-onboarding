import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { buildReviewSnapshot } from "@/lib/session/review-document";
import { renderReviewPdf } from "@/lib/session/review-pdf";
import { sendReviewDocumentToTeam } from "@/lib/email/resend";

// Lets an admin resend a client's onboarding document to the team inbox on
// demand — e.g. if the client never downloaded it themselves.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await prisma.onboardingSession.findUnique({ where: { id }, include: { client: true } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snapshot = await buildReviewSnapshot(id);
  const pdfBuffer = await renderReviewPdf(snapshot);

  const result = await sendReviewDocumentToTeam({
    businessName: snapshot.businessName,
    contactName: session.client.primaryContactName,
    contactEmail: snapshot.contactEmail,
    pdfBuffer,
    reason: "admin_requested",
  });

  if (!result.sent) {
    await prisma.auditLog.create({
      data: {
        sessionId: id,
        actorType: "ADMIN",
        action: "team_document_email_skipped_not_configured",
        metadata: { reason: result.reason },
      },
    });
    return NextResponse.json({ error: result.reason }, { status: 503 });
  }

  await prisma.auditLog.create({
    data: {
      sessionId: id,
      actorType: "ADMIN",
      action: "team_document_email_sent_manually",
      metadata: { to: result.to },
    },
  });

  return NextResponse.json({ ok: true, to: result.to });
}
