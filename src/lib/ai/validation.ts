import type { Question } from "@prisma/client";

export type ValidationResult = { valid: boolean; reason?: string };

/**
 * Deterministic server-side check, independent of what the model claims.
 * If this fails, the caller must force isComplete=false regardless of the
 * model's is_complete flag — this is what stops a bad extraction from
 * silently satisfying a required question.
 */
export function validateAnswerValue(question: Question, value: unknown): ValidationResult {
  if (value === null || value === undefined || value === "") {
    return { valid: !question.required, reason: "empty value" };
  }

  const rules = (question.validationRules as Record<string, unknown> | null) ?? {};

  switch (question.responseType) {
    case "URL": {
      const urls = Array.isArray(value) ? value : [value];
      const regex = new RegExp((rules.regex as string) ?? "^https?://");
      const allValid = urls.every((u) => typeof u === "string" && regex.test(u));
      return { valid: allValid, reason: allValid ? undefined : "not a valid URL" };
    }
    case "NUMBER":
    case "CURRENCY": {
      const num = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
      return { valid: Number.isFinite(num), reason: Number.isFinite(num) ? undefined : "not a number" };
    }
    case "SINGLE_CHOICE": {
      return { valid: typeof value === "string" && value.length > 0 };
    }
    case "MULTI_CHOICE": {
      return { valid: Array.isArray(value) && value.length > 0 };
    }
    case "TEXT":
    case "LONG_TEXT":
    case "VOICE":
    case "VIDEO":
    case "FILE_UPLOAD":
    default: {
      if (rules.regex) {
        const regex = new RegExp(rules.regex as string);
        const valid = regex.test(String(value));
        return { valid, reason: valid ? undefined : "failed validation pattern" };
      }
      return { valid: typeof value === "string" ? value.trim().length > 0 : true };
    }
  }
}
