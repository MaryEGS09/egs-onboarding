import { prisma } from "@/lib/db/prisma";
import { loadAllPhasesOrdered, loadPhaseQuestions } from "@/lib/ai/question-graph";

export type ReviewDocumentSnapshot = {
  generatedAt: string;
  phases: {
    phaseKey: string;
    phaseName: string;
    sections: {
      sectionName: string;
      questions: {
        questionKey: string;
        prompt: string;
        answer: string | null;
        isComplete: boolean;
        followUps: { aiQuestionText: string; clientResponseText: string | null }[];
        mediaUrl: string | null;
      }[];
    }[];
  }[];
};

function formatAnswerValue(answer: {
  textValue: string | null;
  jsonValue: unknown;
  numberValue: unknown;
}): string | null {
  if (answer.textValue) return answer.textValue;
  if (answer.jsonValue) return JSON.stringify(answer.jsonValue);
  if (answer.numberValue !== null && answer.numberValue !== undefined) return String(answer.numberValue);
  return null;
}

export async function buildReviewSnapshot(sessionId: string): Promise<ReviewDocumentSnapshot> {
  const phases = await loadAllPhasesOrdered();

  const phaseBlocks = await Promise.all(
    phases.map(async (phase) => {
      const sections = await prisma.section.findMany({
        where: { phaseId: phase.id },
        orderBy: { order: "asc" },
        include: {
          questions: {
            where: { archived: false },
            orderBy: { order: "asc" },
          },
        },
      });

      const questionIds = sections.flatMap((s) => s.questions.map((q) => q.id));
      const answers = await prisma.answer.findMany({
        where: { sessionId, questionId: { in: questionIds } },
        include: { mediaUpload: true },
      });
      const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));

      const followUps = await prisma.followUpExchange.findMany({
        where: { sessionId, questionId: { in: questionIds } },
        orderBy: { order: "asc" },
      });
      const followUpsByQuestionId = new Map<string, typeof followUps>();
      for (const f of followUps) {
        const list = followUpsByQuestionId.get(f.questionId) ?? [];
        list.push(f);
        followUpsByQuestionId.set(f.questionId, list);
      }

      return {
        phaseKey: phase.key,
        phaseName: phase.name,
        sections: sections.map((section) => ({
          sectionName: section.name,
          questions: section.questions.map((question) => {
            const answer = answerByQuestionId.get(question.id);
            return {
              questionKey: question.key,
              prompt: question.prompt,
              answer: answer ? formatAnswerValue(answer) : null,
              isComplete: answer?.isComplete ?? false,
              followUps: (followUpsByQuestionId.get(question.id) ?? []).map((f) => ({
                aiQuestionText: f.aiQuestionText,
                clientResponseText: f.clientResponseText,
              })),
              mediaUrl: answer?.mediaUpload ? `/api/media/file/${encodeURIComponent(answer.mediaUpload.storagePath)}` : null,
            };
          }),
        })),
      };
    }),
  );

  return { generatedAt: new Date().toISOString(), phases: phaseBlocks };
}

export async function countIncompleteRequiredQuestions(sessionId: string): Promise<number> {
  const phases = await loadAllPhasesOrdered();
  let incomplete = 0;
  for (const phase of phases) {
    const questions = await loadPhaseQuestions(phase.id);
    const requiredIds = questions.filter((q) => q.required).map((q) => q.id);
    if (requiredIds.length === 0) continue;
    const completeCount = await prisma.answer.count({
      where: { sessionId, questionId: { in: requiredIds }, isComplete: true },
    });
    incomplete += requiredIds.length - completeCount;
  }
  return incomplete;
}
