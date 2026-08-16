"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionStatus } from "@/lib/api/onboarding-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ChatContainer } from "@/components/chat/chat-container";
import { InterviewContainer } from "@/components/interview/interview-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const setSession = useOnboardingStore((s) => s.setSession);
  const [mode, setMode] = useState<"CHAT" | "INTERVIEW" | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const status = (await getSessionStatus(sessionId)) as { mode: "CHAT" | "INTERVIEW"; status: string };
        setSession(sessionId, status.mode);
        if (status.status === "PENDING_REVIEW" || status.status === "COMPLETED") {
          router.replace(`/onboarding/session/${sessionId}/review`);
          return;
        }
        setMode(status.mode);
      } catch {
        setNotFound(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (notFound) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-medium">We couldn&apos;t find that session.</p>
        <p className="text-muted-foreground">It may have expired, or the link may be incorrect.</p>
      </main>
    );
  }

  if (!mode) {
    return (
      <main className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  return <main className="flex flex-1 flex-col">{mode === "CHAT" ? <ChatContainer sessionId={sessionId} /> : <InterviewContainer sessionId={sessionId} />}</main>;
}
