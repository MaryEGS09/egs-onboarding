"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { getSessionStatus, sendAnswer as sendAnswerApi } from "@/lib/api/onboarding-client";
import { WELCOME_MESSAGE } from "@/lib/copy/onboarding-copy";

type SessionProgress = {
  totalPhases: number;
  currentPhaseIndex: number;
  currentPhaseName: string | null;
  currentQuestion: { key: string; prompt: string; responseType: string; required: boolean } | null;
  status: string;
  recentMessages: { role: "CLIENT" | "ASSISTANT" | "SYSTEM"; content: string }[];
};

export function useOnboardingConversation(sessionId: string) {
  const store = useOnboardingStore();
  const router = useRouter();
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [sending, setSending] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    (async () => {
      try {
        const status = (await getSessionStatus(sessionId)) as SessionProgress;
        setProgress(status);
        store.setCurrentQuestion(
          status.currentQuestion
            ? { key: status.currentQuestion.key, prompt: status.currentQuestion.prompt, responseType: status.currentQuestion.responseType, required: status.currentQuestion.required }
            : null,
        );

        if (status.recentMessages.length > 0) {
          for (const m of status.recentMessages) {
            store.addMessage({
              role: m.role === "CLIENT" ? "client" : m.role === "ASSISTANT" ? "assistant" : "system",
              content: m.content,
            });
          }
        } else {
          store.addMessage({ role: "assistant", content: WELCOME_MESSAGE });
          if (status.currentQuestion) {
            store.addMessage({ role: "assistant", content: status.currentQuestion.prompt, variant: "question" });
          }
        }
      } catch {
        toast.error("Couldn't load your session. Please try again.");
      } finally {
        setLoadingInitial(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function submitAnswer(content: string, mediaUploadId?: string, inputType: "text" | "transcript" = "text") {
    store.addMessage({ role: "client", content });
    setSending(true);
    store.setSaving(true);

    try {
      const result = await sendAnswerApi(sessionId, { inputType, content, mediaUploadId });

      const isDuplicateOfFollowUp = result.followUp && result.assistantMessage.trim() === result.followUp.text.trim();
      if (result.assistantMessage.trim() && !isDuplicateOfFollowUp) {
        store.addMessage({ role: "assistant", content: result.assistantMessage });
      }

      if (result.progressNudge) {
        store.addMessage({ role: "system", content: result.progressNudge });
      }

      if (result.followUp) {
        store.addMessage({ role: "assistant", content: result.followUp.text, variant: "followup" });
      } else if (result.phaseComplete && !result.sessionComplete) {
        store.addMessage({ role: "system", content: "Moving to the next section…" });
        if (result.nextQuestion) {
          store.addMessage({ role: "assistant", content: result.nextQuestion.prompt, variant: "question" });
        }
      } else if (result.nextQuestion) {
        store.addMessage({ role: "assistant", content: result.nextQuestion.prompt, variant: "question" });
      }

      store.setCurrentQuestion(result.nextQuestion);
      store.markSaved();

      if (result.sessionComplete) {
        store.setSessionComplete(true);
        router.push(`/onboarding/session/${sessionId}/review`);
        return;
      }

      const status = (await getSessionStatus(sessionId)) as SessionProgress;
      setProgress(status);
    } catch {
      toast.error("Something went wrong sending your answer. Please try again.");
      store.setSaving(false);
    } finally {
      setSending(false);
    }
  }

  return {
    messages: store.messages,
    currentQuestion: store.currentQuestion,
    progress,
    loadingInitial,
    sending,
    isSaving: store.isSaving,
    lastSavedAt: store.lastSavedAt,
    submitAnswer,
  };
}
