import type { Question } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAnthropicClient, getModel } from "./anthropic-client";
import { CONVERSATION_TOOLS, type RecordAnswerInput, type AskFollowupInput, type ReviseAnswerInput, type AdvanceCursorInput } from "./tools";
import { loadPhaseQuestions, findNextIncompleteQuestion, loadAllPhasesOrdered } from "./question-graph";
import { upsertAnswer } from "./answers";

const MAX_MESSAGES_BEFORE_ROLLING_SUMMARY = 20;

export type ProcessTurnInput = {
  sessionId: string;
  inputType: "text" | "transcript";
  content: string;
  mediaUploadId?: string;
};

export type NextStepDescriptor = {
  assistantMessage: string;
  followUp?: { questionKey: string; text: string };
  answeredQuestions: string[];
  nextQuestion: SerializedQuestion | null;
  phaseComplete: boolean;
  sessionComplete: boolean;
};

type SerializedQuestion = {
  key: string;
  prompt: string;
  helpText: string | null;
  responseType: Question["responseType"];
  required: boolean;
  voiceEnabled: boolean;
  videoEnabled: boolean;
  allowFileUpload: boolean;
  options: { value: string; label: string; allowFreeText: boolean }[];
};

function serializeQuestion(q: Awaited<ReturnType<typeof loadPhaseQuestions>>[number]): SerializedQuestion {
  return {
    key: q.key,
    prompt: q.prompt,
    helpText: q.helpText,
    responseType: q.responseType,
    required: q.required,
    voiceEnabled: q.voiceEnabled,
    videoEnabled: q.videoEnabled,
    allowFileUpload: q.allowFileUpload,
    options: q.options.map((o) => ({ value: o.value, label: o.label, allowFreeText: o.allowFreeText })),
  };
}

type AnsweredInfo = { textValue: string | null; jsonValue: unknown; numberValue: unknown };

function buildSystemPrompt(
  questions: Awaited<ReturnType<typeof loadPhaseQuestions>>,
  phaseName: string,
  currentQuestionKey: string | undefined,
  answeredByQuestionId: Map<string, AnsweredInfo>,
): string {
  const questionBlock = questions
    .map((q) => {
      const options = q.options.length
        ? ` Options: ${q.options.map((o) => `${o.value}="${o.label}"${o.allowFreeText ? " (allows free text)" : ""}`).join(", ")}.`
        : "";
      const answer = answeredByQuestionId.get(q.id);
      const status =
        q.key === currentQuestionKey
          ? "[CURRENT — the client's next message answers THIS question unless it clearly corrects a different, already-answered one]"
          : answer
            ? `[ALREADY ANSWERED: "${answer.textValue ?? JSON.stringify(answer.jsonValue ?? answer.numberValue)}"]`
            : "[not yet asked]";
      return `- key="${q.key}" ${status} | required=${q.required} | type=${q.responseType} | prompt="${q.prompt}" | ai_instructions="${q.aiInstructions}"${options}`;
    })
    .join("\n");

  return `You are a warm, professional AI onboarding specialist for EGS Marketing Solutions, guiding a client through the "${phaseName}" section of their onboarding.

Rules:
1. Every structured answer you record must be attached to one of the exact question keys below via the record_answer tool. Never invent new questions.
2. The question marked [CURRENT] below is what the client is replying to right now. Unless their message is unmistakably about a different, already-answered question (a correction), attribute their answer to the CURRENT question — do not guess it belongs to an already-answered one just because the wording is ambiguous or looks unusual.
3. If the client's response also answers other not-yet-asked questions in this phase, include them as secondary_answers on the same record_answer call rather than asking about them again later.
4. If an answer is too vague or generic per that question's ai_instructions, call ask_followup instead of record_answer — write the follow-up question itself in the ask_followup tool call's followup_text field, short and specific.
5. Only call revise_answer when the client is explicitly correcting a previously-given answer (e.g. "actually, my budget is..."). Do not use it just because the current answer doesn't fit the CURRENT question's expected format — if it looks malformed (e.g. not a valid email), treat it as an incomplete/invalid answer to the CURRENT question (ask_followup) rather than rerouting it elsewhere.
6. Your visible text reply is ONLY a brief warm acknowledgment of what the client just said (1 sentence, e.g. "Thanks, Mark!" or "Got it, that's helpful context."). Do NOT restate, rephrase, or ask the next question yourself in your text reply — the interface displays the next question separately. Do NOT leave the text reply empty; always include at least a short acknowledgment.
7. Do not repeat information the client already gave you.

Questions in this phase:
${questionBlock}`;
}

export async function processTurn(input: ProcessTurnInput): Promise<NextStepDescriptor> {
  const session = await prisma.onboardingSession.findUniqueOrThrow({
    where: { id: input.sessionId },
    include: { currentPhase: true },
  });

  if (!session.currentPhaseId || !session.currentPhase) {
    throw new Error("Session has no active phase — cannot process a turn.");
  }

  const phase = session.currentPhase;
  const questions = await loadPhaseQuestions(phase.id);

  const existingAnswers = await prisma.answer.findMany({
    where: { sessionId: session.id, questionId: { in: questions.map((q) => q.id) }, isComplete: true },
  });
  const answeredByQuestionId = new Map(existingAnswers.map((a) => [a.questionId, a]));
  const currentQuestionKey = questions.find((q) => q.id === session.currentQuestionId)?.key;

  const phaseSummaries = await prisma.phaseSummary.findMany({
    where: { sessionId: session.id },
    include: { phase: true },
    orderBy: { phase: { order: "asc" } },
  });

  await prisma.conversationMessage.create({
    data: {
      sessionId: session.id,
      phaseId: phase.id,
      role: "CLIENT",
      content: input.content,
      relatedQuestionId: session.currentQuestionId,
    },
  });

  const history = await prisma.conversationMessage.findMany({
    where: { sessionId: session.id, phaseId: phase.id, archivedFromContext: false },
    orderBy: { createdAt: "asc" },
  });

  await maybeCompactPhaseHistory(session.id, phase.id, history.length);

  const anthropic = getAnthropicClient();
  const systemPrompt = buildSystemPrompt(questions, phase.name, currentQuestionKey, answeredByQuestionId);

  const contextParts: string[] = [];
  if (phaseSummaries.length > 0) {
    contextParts.push(
      "Summary of completed phases so far:\n" + phaseSummaries.map((s) => `[${s.phase.name}] ${s.summaryText}`).join("\n"),
    );
  }

  const conversationMessages: { role: "user" | "assistant"; content: string }[] = [];
  for (const msg of history) {
    const role = msg.role === "ASSISTANT" ? "assistant" : "user";
    const last = conversationMessages[conversationMessages.length - 1];
    if (last && last.role === role) {
      last.content += "\n" + msg.content;
    } else {
      conversationMessages.push({ role, content: msg.content });
    }
  }

  if (contextParts.length > 0 && conversationMessages[0]?.role === "user") {
    conversationMessages[0].content = contextParts.join("\n\n") + "\n\n" + conversationMessages[0].content;
  } else if (contextParts.length > 0) {
    conversationMessages.unshift({ role: "user", content: contextParts.join("\n\n") });
  }

  const response = await anthropic.messages.create({
    model: getModel(),
    max_tokens: 1024,
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: conversationMessages,
    tools: CONVERSATION_TOOLS,
    tool_choice: { type: "auto" },
  });

  let assistantMessage = "";
  const answeredQuestions: string[] = [];
  let followUp: NextStepDescriptor["followUp"];
  let explicitNextKey: string | null | undefined;

  const questionByKey = new Map(questions.map((q) => [q.key, q]));

  for (const block of response.content) {
    if (block.type === "text") {
      assistantMessage += (assistantMessage ? "\n" : "") + block.text;
    } else if (block.type === "tool_use") {
      if (block.name === "record_answer") {
        const args = block.input as RecordAnswerInput;
        await handleRecordAnswer(session.id, questionByKey, args);
        answeredQuestions.push(args.question_key);
        for (const secondary of args.secondary_answers ?? []) {
          answeredQuestions.push(secondary.question_key);
        }
      } else if (block.name === "ask_followup") {
        const args = block.input as AskFollowupInput;
        await handleAskFollowup(session.id, questionByKey, args);
        followUp = { questionKey: args.question_key, text: args.followup_text };
      } else if (block.name === "revise_answer") {
        const args = block.input as ReviseAnswerInput;
        await handleReviseAnswer(session.id, questionByKey, args);
        answeredQuestions.push(args.question_key);
      } else if (block.name === "advance_cursor") {
        const args = block.input as AdvanceCursorInput;
        explicitNextKey = args.next_question_key;
      }
    }
  }

  if (!assistantMessage.trim()) {
    assistantMessage = followUp?.text ?? "Thanks — noted. Let's continue.";
  }

  await prisma.conversationMessage.create({
    data: { sessionId: session.id, phaseId: phase.id, role: "ASSISTANT", content: assistantMessage },
  });

  const stayOnCurrentQuestion = Boolean(followUp) && explicitNextKey === undefined;

  let nextQuestionRow = stayOnCurrentQuestion
    ? questions.find((q) => q.id === session.currentQuestionId)
    : undefined;

  if (!stayOnCurrentQuestion) {
    if (explicitNextKey) {
      nextQuestionRow = questionByKey.get(explicitNextKey);
    }
    if (!nextQuestionRow) {
      nextQuestionRow = (await findNextIncompleteQuestion(session.id, phase.id)) ?? undefined;
    }
  }

  let phaseComplete = false;
  let sessionComplete = false;
  let nextQuestionSerialized: SerializedQuestion | null = null;

  if (nextQuestionRow && !stayOnCurrentQuestion) {
    await prisma.onboardingSession.update({
      where: { id: session.id },
      data: {
        currentQuestionId: nextQuestionRow.id,
        currentSectionId: nextQuestionRow.sectionId,
        lastActivityAt: new Date(),
      },
    });
    nextQuestionSerialized = serializeQuestion(nextQuestionRow);
    await prisma.conversationMessage.create({
      data: { sessionId: session.id, phaseId: phase.id, role: "ASSISTANT", content: nextQuestionRow.prompt },
    });
  } else if (nextQuestionRow) {
    // stayOnCurrentQuestion (a follow-up is pending) — cursor unchanged, nothing new to persist.
    nextQuestionSerialized = serializeQuestion(nextQuestionRow);
  } else {
    phaseComplete = true;
    await summarizePhase(session.id, phase.id, phase.name);

    const allPhases = await loadAllPhasesOrdered();
    const nextPhase = allPhases.find((p) => p.order === phase.order + 1);

    if (nextPhase) {
      const nextPhaseQuestions = await loadPhaseQuestions(nextPhase.id);
      const firstQuestion = nextPhaseQuestions[0];
      await prisma.onboardingSession.update({
        where: { id: session.id },
        data: {
          currentPhaseId: nextPhase.id,
          currentSectionId: firstQuestion?.sectionId,
          currentQuestionId: firstQuestion?.id,
          lastActivityAt: new Date(),
        },
      });
      if (firstQuestion) {
        nextQuestionSerialized = serializeQuestion(firstQuestion);
        await prisma.conversationMessage.create({
          data: { sessionId: session.id, phaseId: nextPhase.id, role: "ASSISTANT", content: firstQuestion.prompt },
        });
      }
    } else {
      sessionComplete = true;
      await prisma.onboardingSession.update({
        where: { id: session.id },
        data: { status: "PENDING_REVIEW", lastActivityAt: new Date() },
      });
    }
  }

  return {
    assistantMessage,
    followUp,
    answeredQuestions,
    nextQuestion: nextQuestionSerialized,
    phaseComplete,
    sessionComplete,
  };
}

async function handleRecordAnswer(
  sessionId: string,
  questionByKey: Map<string, Question>,
  args: RecordAnswerInput,
) {
  const primaryQuestion = questionByKey.get(args.question_key);
  if (!primaryQuestion) return;

  const { answer: primaryAnswer } = await upsertAnswer({
    sessionId,
    question: primaryQuestion,
    value: args.value,
    isCompleteClaim: args.is_complete,
    confidence: args.confidence,
    source: "TEXT_INPUT",
  });

  for (const secondary of args.secondary_answers ?? []) {
    const secondaryQuestion = questionByKey.get(secondary.question_key);
    if (!secondaryQuestion) continue;
    await upsertAnswer({
      sessionId,
      question: secondaryQuestion,
      value: secondary.value,
      isCompleteClaim: secondary.is_complete,
      confidence: secondary.confidence,
      source: "AI_EXTRACTED",
      extractedFromAnswerId: primaryAnswer.id,
    });
  }
}

async function handleAskFollowup(sessionId: string, questionByKey: Map<string, Question>, args: AskFollowupInput) {
  const question = questionByKey.get(args.question_key);
  if (!question) return;

  const existingAnswer = await prisma.answer.findUnique({
    where: { sessionId_questionId: { sessionId, questionId: question.id } },
  });

  const priorCount = await prisma.followUpExchange.count({ where: { sessionId, questionId: question.id } });

  await prisma.followUpExchange.create({
    data: {
      sessionId,
      questionId: question.id,
      answerId: existingAnswer?.id,
      order: priorCount,
      aiQuestionText: args.followup_text,
    },
  });
}

async function handleReviseAnswer(sessionId: string, questionByKey: Map<string, Question>, args: ReviseAnswerInput) {
  const question = questionByKey.get(args.question_key);
  if (!question) return;

  await upsertAnswer({
    sessionId,
    question,
    value: args.new_value,
    isCompleteClaim: true,
    confidence: args.confidence,
    source: "TEXT_INPUT",
    supersededReason: "client correction via conversation",
  });
}

async function maybeCompactPhaseHistory(sessionId: string, phaseId: string, currentCount: number) {
  if (currentCount < MAX_MESSAGES_BEFORE_ROLLING_SUMMARY) return;

  const oldest = await prisma.conversationMessage.findMany({
    where: { sessionId, phaseId, archivedFromContext: false },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
  if (oldest.length === 0) return;

  const anthropic = getAnthropicClient();
  const transcript = oldest.map((m) => `${m.role}: ${m.content}`).join("\n");
  const response = await anthropic.messages.create({
    model: getModel(),
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Summarize the following onboarding conversation excerpt in under 100 words, factually, no commentary:\n\n${transcript}`,
      },
    ],
  });
  const summaryText = response.content.find((b) => b.type === "text")?.text ?? "";

  await prisma.$transaction([
    prisma.conversationMessage.updateMany({
      where: { id: { in: oldest.map((m) => m.id) } },
      data: { archivedFromContext: true },
    }),
    prisma.conversationMessage.create({
      data: {
        sessionId,
        phaseId,
        role: "SYSTEM",
        content: `[Earlier in this phase]: ${summaryText}`,
        archivedFromContext: false,
      },
    }),
  ]);
}

async function summarizePhase(sessionId: string, phaseId: string, phaseName: string) {
  const messages = await prisma.conversationMessage.findMany({
    where: { sessionId, phaseId },
    orderBy: { createdAt: "asc" },
  });
  const phaseQuestions = await loadPhaseQuestions(phaseId);
  const phaseAnswers = await prisma.answer.findMany({
    where: { sessionId, questionId: { in: phaseQuestions.map((q) => q.id) } },
    include: { question: true },
  });

  const anthropic = getAnthropicClient();
  const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  const answerList = phaseAnswers
    .map((a) => `${a.question.key}: ${a.textValue ?? JSON.stringify(a.jsonValue ?? a.numberValue)}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: getModel(),
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Summarize this completed onboarding phase ("${phaseName}") in 150 words or fewer, factually, no commentary. Recorded answers:\n${answerList}\n\nConversation:\n${transcript}`,
      },
    ],
  });
  const summaryText = response.content.find((b) => b.type === "text")?.text ?? "";

  await prisma.phaseSummary.upsert({
    where: { sessionId_phaseId: { sessionId, phaseId } },
    update: { summaryText },
    create: { sessionId, phaseId, summaryText },
  });
}
