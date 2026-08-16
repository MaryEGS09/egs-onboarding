export type QuestionDescriptor = {
  key: string;
  prompt: string;
  helpText?: string | null;
  responseType: string;
  required: boolean;
  voiceEnabled?: boolean;
  videoEnabled?: boolean;
  allowFileUpload?: boolean;
  options?: { value: string; label: string; allowFreeText: boolean }[];
};

export type NextStepDescriptor = {
  assistantMessage: string;
  followUp?: { questionKey: string; text: string };
  answeredQuestions: string[];
  nextQuestion: QuestionDescriptor | null;
  phaseComplete: boolean;
  sessionComplete: boolean;
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request to ${url} failed`);
  }
  return res.json();
}

export function startSession(mode: "CHAT" | "INTERVIEW") {
  return jsonFetch<{ sessionId: string; resumeCode: string; mode: string; firstQuestion: QuestionDescriptor | null }>(
    "/api/onboarding/sessions",
    { method: "POST", body: JSON.stringify({ mode }) },
  );
}

export function getSessionStatus(sessionId: string) {
  return jsonFetch(`/api/onboarding/sessions/${sessionId}`);
}

export function pauseSession(sessionId: string) {
  return jsonFetch(`/api/onboarding/sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "PAUSED" }),
  });
}

export function sendAnswer(
  sessionId: string,
  input: { inputType: "text" | "transcript"; content: string; mediaUploadId?: string },
) {
  return jsonFetch<NextStepDescriptor>(`/api/onboarding/sessions/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function uploadMedia(
  sessionId: string,
  params: { file: Blob; filename: string; kind: "AUDIO" | "VIDEO" | "FILE"; questionKey?: string; transcriptText?: string },
) {
  const formData = new FormData();
  formData.append("file", params.file, params.filename);
  formData.append("kind", params.kind);
  if (params.questionKey) formData.append("questionKey", params.questionKey);
  if (params.transcriptText) formData.append("transcriptText", params.transcriptText);

  const res = await fetch(`/api/onboarding/sessions/${sessionId}/media`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json() as Promise<{ mediaUploadId: string; url: string; transcriptStatus: string; transcriptText: string | null }>;
}

export function resumeSession(params: { email: string; businessName: string; resumeCode: string }) {
  return jsonFetch<{ sessionId: string; progress: unknown }>("/api/onboarding/resume", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function requestResumeCode(params: { email: string; businessName: string }) {
  return jsonFetch("/api/onboarding/resume/request-code", { method: "POST", body: JSON.stringify(params) });
}

export function getReviewDocument(sessionId: string) {
  return jsonFetch(`/api/onboarding/sessions/${sessionId}/review`);
}

export function reopenQuestions(sessionId: string, questionKeys: string[]) {
  return jsonFetch(`/api/onboarding/sessions/${sessionId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ questionKeys }),
  });
}

export function finalizeSession(sessionId: string) {
  return jsonFetch(`/api/onboarding/sessions/${sessionId}/finalize`, { method: "POST" });
}

export function getPdfUrl(sessionId: string) {
  return `/api/onboarding/sessions/${sessionId}/pdf`;
}
