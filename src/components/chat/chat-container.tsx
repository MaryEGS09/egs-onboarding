"use client";

import { MessageList } from "./message-list";
import { AnswerInput } from "./answer-input";
import { PhaseProgressBar } from "@/components/progress/phase-progress-bar";
import { AutoSaveIndicator } from "@/components/progress/auto-save-indicator";
import { SaveAndExitButton } from "@/components/progress/save-and-exit-button";
import { useOnboardingConversation } from "@/hooks/use-onboarding-conversation";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatContainer({ sessionId }: { sessionId: string }) {
  const { messages, currentQuestion, progress, loadingInitial, sending, isSaving, lastSavedAt, submitAnswer } =
    useOnboardingConversation(sessionId);

  if (loadingInitial) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-4/5" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        <PhaseProgressBar
          currentPhaseIndex={progress?.currentPhaseIndex ?? 0}
          totalPhases={progress?.totalPhases ?? 7}
          phaseName={progress?.currentPhaseName ?? null}
        />
      </div>
      <MessageList messages={messages} />
      <div className="border-t bg-background px-4 py-4">
        <div className="mx-auto max-w-2xl">
          {currentQuestion ? (
            <AnswerInput question={currentQuestion} disabled={sending || isSaving} onSubmit={(v) => submitAnswer(v)} />
          ) : (
            <p className="text-center text-sm text-muted-foreground">All done — preparing your review…</p>
          )}
          <div className="mt-3 flex justify-center">
            <SaveAndExitButton sessionId={sessionId} />
          </div>
        </div>
      </div>
      <AutoSaveIndicator lastSavedAt={lastSavedAt} />
    </div>
  );
}
