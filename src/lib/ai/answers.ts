import type { Question, AnswerSource } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { validateAnswerValue } from "./validation";

export type UpsertAnswerParams = {
  sessionId: string;
  question: Question;
  value: unknown;
  isCompleteClaim: boolean;
  confidence: number;
  source: AnswerSource;
  extractedFromAnswerId?: string;
  supersededReason?: string;
};

function toStorableFields(question: Question, value: unknown) {
  switch (question.responseType) {
    case "NUMBER":
    case "CURRENCY":
      return { numberValue: Number(typeof value === "number" ? value : String(value).replace(/[^0-9.-]/g, "")) };
    case "MULTI_CHOICE":
      return { jsonValue: Array.isArray(value) ? value : [value] };
    case "URL":
      return Array.isArray(value) ? { jsonValue: value } : { textValue: String(value) };
    default:
      return { textValue: typeof value === "string" ? value : JSON.stringify(value) };
  }
}

/**
 * Upserts an Answer, versioning any prior value into AnswerVersionHistory first.
 * Used by record_answer, secondary_answers, and revise_answer alike so every
 * correction path shares one audit trail.
 */
export async function upsertAnswer(params: UpsertAnswerParams) {
  const { sessionId, question, value, isCompleteClaim, confidence, source, extractedFromAnswerId, supersededReason } =
    params;

  const validation = validateAnswerValue(question, value);
  const isComplete = isCompleteClaim && validation.valid && confidence >= question.minConfidence;

  const existing = await prisma.answer.findUnique({
    where: { sessionId_questionId: { sessionId, questionId: question.id } },
  });

  const storable = toStorableFields(question, value);

  if (existing) {
    await prisma.answerVersionHistory.create({
      data: {
        sessionId,
        questionId: question.id,
        answerId: existing.id,
        versionNumber: existing.version,
        textValue: existing.textValue,
        jsonValue: existing.jsonValue ?? undefined,
        numberValue: existing.numberValue,
        currencyCode: existing.currencyCode,
        mediaUploadId: existing.mediaUploadId,
        source: existing.source,
        extractedFromAnswerId: existing.extractedFromAnswerId,
        supersededReason: supersededReason ?? "superseded by new answer",
      },
    });

    // Anything AI-extracted from this answer can no longer be trusted blindly.
    await prisma.answer.updateMany({
      where: { extractedFromAnswerId: existing.id },
      data: { isComplete: false },
    });
  }

  const updated = await prisma.answer.upsert({
    where: { sessionId_questionId: { sessionId, questionId: question.id } },
    update: {
      ...storable,
      source,
      extractedFromAnswerId,
      confidence,
      isComplete,
      version: (existing?.version ?? 0) + 1,
      answeredAt: new Date(),
    },
    create: {
      sessionId,
      questionId: question.id,
      ...storable,
      source,
      extractedFromAnswerId,
      confidence,
      isComplete,
      version: 1,
    },
  });

  return { answer: updated, validation };
}
