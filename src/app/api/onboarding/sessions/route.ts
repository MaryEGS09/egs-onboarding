import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { generateResumeCode, hashResumeCode } from "@/lib/session/resume-code";
import { createSessionCookieValue, CLIENT_SESSION_COOKIE_NAME, CLIENT_SESSION_COOKIE_MAX_AGE } from "@/lib/session/client-session-cookie";
import { loadPhaseQuestions, loadAllPhasesOrdered } from "@/lib/ai/question-graph";

const BodySchema = z.object({ mode: z.enum(["CHAT", "INTERVIEW"]) });

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const phases = await loadAllPhasesOrdered();
  const firstPhase = phases[0];
  if (!firstPhase) {
    return NextResponse.json({ error: "Questionnaire is not seeded yet." }, { status: 500 });
  }
  const firstPhaseQuestions = await loadPhaseQuestions(firstPhase.id);
  const firstQuestion = firstPhaseQuestions[0];

  const client = await prisma.client.create({ data: {} });

  const resumeCode = generateResumeCode();
  const resumeCodeHash = await hashResumeCode(resumeCode);

  const session = await prisma.onboardingSession.create({
    data: {
      clientId: client.id,
      mode: parsed.data.mode,
      resumeCodeHash,
      resumeCodePlaintext: resumeCode,
      resumeCodeExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      currentPhaseId: firstPhase.id,
      currentSectionId: firstQuestion?.sectionId,
      currentQuestionId: firstQuestion?.id,
    },
  });

  await prisma.auditLog.create({
    data: { sessionId: session.id, actorType: "CLIENT", action: "session_started", metadata: { mode: parsed.data.mode } },
  });

  const cookieStore = await cookies();
  cookieStore.set(CLIENT_SESSION_COOKIE_NAME, createSessionCookieValue(session.id), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: CLIENT_SESSION_COOKIE_MAX_AGE,
    path: "/",
  });

  return NextResponse.json({
    sessionId: session.id,
    resumeCode,
    mode: session.mode,
    firstQuestion: firstQuestion
      ? {
          key: firstQuestion.key,
          prompt: firstQuestion.prompt,
          responseType: firstQuestion.responseType,
          required: firstQuestion.required,
        }
      : null,
  });
}
