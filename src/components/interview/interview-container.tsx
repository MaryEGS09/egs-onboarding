"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageList } from "@/components/chat/message-list";
import { AnswerInput } from "@/components/chat/answer-input";
import { PhaseProgressBar } from "@/components/progress/phase-progress-bar";
import { AutoSaveIndicator } from "@/components/progress/auto-save-indicator";
import { SaveAndExitButton } from "@/components/progress/save-and-exit-button";
import { ResponseModeSwitcher } from "./response-mode-switcher";
import { VoiceCaptureControl } from "./voice-capture-control";
import { VideoCaptureControl } from "./video-capture-control";
import { useOnboardingConversation } from "@/hooks/use-onboarding-conversation";
import { uploadMedia } from "@/lib/api/onboarding-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AI_SPECIALIST_AVATAR, AI_SPECIALIST_NAME, AI_SPECIALIST_TITLE } from "@/lib/copy/onboarding-copy";

export function InterviewContainer({ sessionId }: { sessionId: string }) {
  const { messages, currentQuestion, progress, loadingInitial, sending, isSaving, lastSavedAt, submitAnswer } =
    useOnboardingConversation(sessionId);
  const [inputMode, setInputMode] = useState<"text" | "voice" | "video">("voice");

  if (loadingInitial) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  async function handleMediaAnswer(kind: "AUDIO" | "VIDEO", transcript: string, blob: Blob) {
    try {
      const upload = await uploadMedia(sessionId, {
        file: blob,
        filename: `${kind.toLowerCase()}-answer.webm`,
        kind,
        questionKey: currentQuestion?.key,
        transcriptText: transcript,
      });
      await submitAnswer(transcript, upload.mediaUploadId, "transcript");
    } catch {
      toast.error("We couldn't upload your recording. Please try again.");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <PhaseProgressBar
        currentPhaseIndex={progress?.currentPhaseIndex ?? 0}
        totalPhases={progress?.totalPhases ?? 7}
        phaseName={progress?.currentPhaseName ?? null}
      />

      {currentQuestion && (
        <Card className="mx-auto mt-4 flex w-full max-w-xl flex-col items-center gap-3 px-5 py-5 text-center">
          <Avatar size="lg">
            <AvatarImage src={AI_SPECIALIST_AVATAR} alt={AI_SPECIALIST_NAME} />
            <AvatarFallback>{AI_SPECIALIST_NAME[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {AI_SPECIALIST_NAME} · {AI_SPECIALIST_TITLE}
            </p>
            <p className="mt-1 text-base font-medium">{currentQuestion.prompt}</p>
          </div>
        </Card>
      )}

      <MessageList messages={messages} />

      <div className="border-t bg-background px-4 py-4">
        <div className="mx-auto flex max-w-xl flex-col gap-3">
          <ResponseModeSwitcher
            value={inputMode}
            onChange={setInputMode}
            voiceEnabled={currentQuestion?.responseType !== "FILE_UPLOAD"}
            videoEnabled={currentQuestion?.responseType !== "FILE_UPLOAD"}
          />

          {!currentQuestion ? (
            <p className="text-center text-sm text-muted-foreground">All done — preparing your review…</p>
          ) : inputMode === "voice" ? (
            <VoiceCaptureControl disabled={sending || isSaving} onUseAnswer={(t, b) => handleMediaAnswer("AUDIO", t, b)} />
          ) : inputMode === "video" ? (
            <VideoCaptureControl disabled={sending || isSaving} onUseAnswer={(t, b) => handleMediaAnswer("VIDEO", t, b)} />
          ) : (
            <AnswerInput question={currentQuestion} disabled={sending || isSaving} onSubmit={(v) => submitAnswer(v)} />
          )}

          <div className="flex justify-center">
            <SaveAndExitButton sessionId={sessionId} />
          </div>
        </div>
      </div>
      <AutoSaveIndicator lastSavedAt={lastSavedAt} />
    </div>
  );
}
