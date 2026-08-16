import { NextRequest, NextResponse } from "next/server";
import { requireSessionAccess } from "@/lib/session/access";
import { buildReviewSnapshot } from "@/lib/session/review-document";
import { renderReviewPdf } from "@/lib/session/review-pdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireSessionAccess(req, id);
  if (!access.ok) return access.response;

  const snapshot = await buildReviewSnapshot(id);
  const pdfBuffer = await renderReviewPdf(snapshot);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="egs-onboarding-review-${id}.pdf"`,
    },
  });
}
