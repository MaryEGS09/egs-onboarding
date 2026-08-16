import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateResumeCode, hashResumeCode } from "@/lib/session/resume-code";
import { isRateLimited } from "@/lib/session/rate-limit";
import { sendResumeCodeEmail } from "@/lib/email/resend";

const BodySchema = z.object({ email: z.string().email(), businessName: z.string().min(1) });

const GENERIC_RESPONSE = NextResponse.json({
  message: "If that email and business name match a record, we've sent a new resume code.",
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(`request-code:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return GENERIC_RESPONSE;

  const { email, businessName } = parsed.data;
  const client = await prisma.client.findFirst({
    where: {
      primaryContactEmail: { equals: email, mode: "insensitive" },
      businessName: { equals: businessName, mode: "insensitive" },
    },
    include: { sessions: { orderBy: { startedAt: "desc" }, take: 1 } },
  });

  const session = client?.sessions[0];
  if (session) {
    const newCode = generateResumeCode();
    const newHash = await hashResumeCode(newCode);
    await prisma.onboardingSession.update({ where: { id: session.id }, data: { resumeCodeHash: newHash } });
    await sendResumeCodeEmail({ to: email, businessName, resumeCode: newCode });
    await prisma.auditLog.create({
      data: { sessionId: session.id, actorType: "CLIENT", action: "resume_code_requested" },
    });
  }

  return GENERIC_RESPONSE;
}
