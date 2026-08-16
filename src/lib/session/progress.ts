import { prisma } from "@/lib/db/prisma";
import { loadAllPhasesOrdered, loadPhaseQuestions } from "@/lib/ai/question-graph";

export async function getSessionProgress(sessionId: string) {
  const session = await prisma.onboardingSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { currentPhase: true, currentQuestion: true },
  });

  const phases = await loadAllPhasesOrdered();
  const currentPhaseIndex = phases.findIndex((p) => p.id === session.currentPhaseId);

  const completedPhaseIds = (
    await prisma.phaseSummary.findMany({ where: { sessionId }, select: { phaseId: true } })
  ).map((p) => p.phaseId);

  const recentMessages = session.currentPhaseId
    ? await prisma.conversationMessage.findMany({
        where: { sessionId, phaseId: session.currentPhaseId },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return {
    sessionId: session.id,
    mode: session.mode,
    status: session.status,
    reviewStatus: session.reviewStatus,
    totalPhases: phases.length,
    currentPhaseIndex: currentPhaseIndex === -1 ? phases.length : currentPhaseIndex,
    currentPhaseName: session.currentPhase?.name ?? null,
    completedPhaseCount: completedPhaseIds.length,
    currentQuestion: session.currentQuestion
      ? {
          key: session.currentQuestion.key,
          prompt: session.currentQuestion.prompt,
          responseType: session.currentQuestion.responseType,
          required: session.currentQuestion.required,
        }
      : null,
    lastActivityAt: session.lastActivityAt,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    recentMessages: recentMessages.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt })),
  };
}

export async function getPhaseCompletionSummary(sessionId: string, phaseId: string) {
  const questions = await loadPhaseQuestions(phaseId);
  const answers = await prisma.answer.findMany({
    where: { sessionId, questionId: { in: questions.map((q) => q.id) }, isComplete: true },
  });
  return { total: questions.length, completed: answers.length };
}
