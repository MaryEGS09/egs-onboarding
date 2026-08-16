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

  await sendReviewDocumentToTeam({
    businessName: snapshot.businessName,
    contactName: session.client.primaryContactName,
    contactEmail: snapshot.contactEmail,
    pdfBuffer,
    reason: "admin_requested",
  });

  await prisma.auditLog.create({
    data: { sessionId: id, actorType: "ADMIN", action: "team_document_email_sent_manually" },
  });

  return NextResponse.json({ ok: true });
}
