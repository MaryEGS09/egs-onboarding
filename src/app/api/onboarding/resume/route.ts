import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { verifyResumeCode } from "@/lib/session/resume-code";
import { isRateLimited } from "@/lib/session/rate-limit";
import { createSessionCookieValue, CLIENT_SESSION_COOKIE_NAME, CLIENT_SESSION_COOKIE_MAX_AGE } from "@/lib/session/client-session-cookie";
import { getSessionProgress } from "@/lib/session/progress";

const BodySchema = z.object({
  email: z.string().email(),
  businessName: z.string().min(1),
  resumeCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(`resume:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { email, businessName, resumeCode } = parsed.data;

  const client = await prisma.client.findFirst({
    where: {
      primaryContactEmail: { equals: email, mode: "insensitive" },
      businessName: { equals: businessName, mode: "insensitive" },
    },
    include: { sessions: { orderBy: { startedAt: "desc" } } },
  });

  const candidateSessions = client?.sessions ?? [];
  let matchedSessionId: string | null = null;

  for (const session of candidateSessions) {
    if (await verifyResumeCode(session.resumeCodeHash, resumeCode)) {
      matchedSessionId = session.id;
      break;
    }
  }

  await prisma.auditLog.create({
    data: {
      sessionId: matchedSessionId,
      actorType: "CLIENT",
      action: matchedSessionId ? "resume_success" : "resume_failed",
      metadata: { email, businessName },
    },
  });

  if (!matchedSessionId) {
    return NextResponse.json({ error: "We couldn't find a matching session. Please check your details and try again." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(CLIENT_SESSION_COOKIE_NAME, createSessionCookieValue(matchedSessionId), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: CLIENT_SESSION_COOKIE_MAX_AGE,
    path: "/",
  });

  const progress = await getSessionProgress(matchedSessionId);
  return NextResponse.json({ sessionId: matchedSessionId, progress });
}
