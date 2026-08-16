import type Anthropic from "@anthropic-ai/sdk";

/**
 * Strict tool schemas the conversation engine exposes to Claude. Every answer the
 * model records must go through one of these — free-form prose is never persisted
 * directly, which is what guarantees answers map back to real question keys.
 */
export const CONVERSATION_TOOLS: Anthropic.Tool[] = [
  {
    name: "record_answer",
    description:
      "Record the client's answer to the current (or another currently-visible) structured question. Use secondary_answers when the client's response also satisfies other questions in this phase.",
    input_schema: {
      type: "object",
      properties: {
        question_key: { type: "string", description: "The exact question 'key' this answer belongs to." },
        value: {
          description:
            "The extracted answer value. String for text/long_text/url/currency-as-string, number for number/currency, array of option values for multi_choice, single option value string for single_choice.",
        },
        is_complete: {
          type: "boolean",
          description: "True if this answer sufficiently satisfies the question per its AI instructions.",
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        secondary_answers: {
          type: "array",
          description: "Other questions in this phase that the same client response already answered.",
          items: {
            type: "object",
            properties: {
              question_key: { type: "string" },
              value: {},
              is_complete: { type: "boolean" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["question_key", "value", "is_complete", "confidence"],
            additionalProperties: false,
          },
        },
      },
      required: ["question_key", "value", "is_complete", "confidence"],
      additionalProperties: false,
    },
  },
  {
    name: "ask_followup",
    description:
      "Ask a natural, concise follow-up question because the client's answer to question_key was too vague or incomplete per its AI instructions.",
    input_schema: {
      type: "object",
      properties: {
        question_key: { type: "string" },
        followup_text: { type: "string", description: "The natural-language follow-up question to show the client." },
        reason: { type: "string", description: "Brief internal note on why a follow-up is needed." },
      },
      required: ["question_key", "followup_text", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "revise_answer",
    description:
      "The client is correcting a previously-answered question (e.g. 'actually my marketing budget is different'). Use this instead of record_answer so the prior value is versioned, not silently overwritten.",
    input_schema: {
      type: "object",
      properties: {
        question_key: { type: "string" },
        new_value: {},
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["question_key", "new_value", "confidence"],
      additionalProperties: false,
    },
  },
  {
    name: "advance_cursor",
    description:
      "Explicitly signal whether the conversation should move to the next question now, or stay on the current one (e.g. because a follow-up is pending).",
    input_schema: {
      type: "object",
      properties: {
        next_question_key: {
          type: ["string", "null"],
          description: "The key of the next question to ask, or null if staying on the current question / phase is done.",
        },
      },
      required: ["next_question_key"],
      additionalProperties: false,
    },
  },
];

export type RecordAnswerInput = {
  question_key: string;
  value: unknown;
  is_complete: boolean;
  confidence: number;
  secondary_answers?: { question_key: string; value: unknown; is_complete: boolean; confidence: number }[];
};

export type AskFollowupInput = { question_key: string; followup_text: string; reason: string };
export type ReviseAnswerInput = { question_key: string; new_value: unknown; confidence: number };
export type AdvanceCursorInput = { next_question_key: string | null };
