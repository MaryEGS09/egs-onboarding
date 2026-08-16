import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { buildReviewSnapshot } from "@/lib/session/review-document";
import { getSessionProgress } from "@/lib/session/progress";

// :id here is the OnboardingSession id — each session is one client "profile" view for admins.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await prisma.onboardingSession.findUnique({ where: { id }, include: { client: true } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [progress, snapshot, auditLog, versionHistory] = await Promise.all([
    getSessionProgress(id),
    buildReviewSnapshot(id),
    prisma.auditLog.findMany({ where: { sessionId: id }, orderBy: { createdAt: "desc" } }),
    prisma.answerVersionHistory.findMany({ where: { sessionId: id }, orderBy: { supersededAt: "desc" }, include: { question: true } }),
  ]);

  return NextResponse.json({ client: session.client, progress, snapshot, auditLog, versionHistory });
}

const UpdateSchema = z.object({ reviewStatus: z.enum(["NOT_REVIEWED", "IN_REVIEW", "APPROVED", "NEEDS_CORRECTION"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const session = await prisma.onboardingSession.update({ where: { id }, data: { reviewStatus: parsed.data.reviewStatus } });
  return NextResponse.json(session);
}
