import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionProgress } from "@/lib/session/progress";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");

  const sessions = await prisma.onboardingSession.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { lastActivityAt: "desc" },
    include: { client: true },
  });

  const rows = await Promise.all(
    sessions.map(async (session) => {
      const progress = await getSessionProgress(session.id);
      const mediaCount = await prisma.mediaUpload.count({ where: { sessionId: session.id } });
      return {
        sessionId: session.id,
        clientName: session.client.primaryContactName,
        businessName: session.client.businessName,
        email: session.client.primaryContactEmail,
        status: session.status,
        completionPercent:
          progress.totalPhases > 0 ? Math.round((progress.completedPhaseCount / progress.totalPhases) * 100) : 0,
        currentPhase: progress.currentPhaseName,
        lastActivityAt: session.lastActivityAt,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        mode: session.mode,
        hasVoiceOrVideo: mediaCount > 0,
        reviewStatus: session.reviewStatus,
      };
    }),
  );

  return NextResponse.json(rows);
}
