import { prisma } from "@/lib/db/prisma";

export type QuestionWithOptions = Awaited<ReturnType<typeof loadPhaseQuestions>>[number];

/** Loads every non-archived question in a phase, ordered by section then question order. */
export async function loadPhaseQuestions(phaseId: string) {
  const sections = await prisma.section.findMany({
    where: { phaseId },
    orderBy: { order: "asc" },
    include: {
      questions: {
        where: { archived: false },
        orderBy: { order: "asc" },
        include: { options: { where: { archived: false }, orderBy: { order: "asc" } } },
      },
    },
  });

  return sections.flatMap((section) =>
    section.questions.map((question) => ({ ...question, sectionName: section.name })),
  );
}

export async function loadAllPhasesOrdered() {
  return prisma.phase.findMany({ orderBy: { order: "asc" } });
}

export async function findQuestionByKey(key: string) {
  return prisma.question.findUnique({ where: { key }, include: { options: true, section: { include: { phase: true } } } });
}

/** First non-archived, required-or-optional question in canonical order that has no complete Answer yet, within a phase. */
export async function findNextIncompleteQuestion(sessionId: string, phaseId: string) {
  const questions = await loadPhaseQuestions(phaseId);
  const answers = await prisma.answer.findMany({
    where: { sessionId, questionId: { in: questions.map((q) => q.id) } },
  });
  const completedIds = new Set(answers.filter((a) => a.isComplete).map((a) => a.questionId));
  return questions.find((q) => !completedIds.has(q.id)) ?? null;
}
