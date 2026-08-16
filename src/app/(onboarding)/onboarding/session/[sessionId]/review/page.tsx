"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewDocumentView, type ReviewSnapshot } from "@/components/review/review-document-view";
import { ReviewCorrectionChat } from "@/components/review/review-correction-chat";
import { getReviewDocument, finalizeSession, getPdfUrl } from "@/lib/api/onboarding-client";
import { REVIEW_INTRO_COPY, FINAL_CONFIRMATION_COPY } from "@/lib/copy/onboarding-copy";
import { toast } from "sonner";
import { Download, Pencil } from "lucide-react";
import { EgsLogoHeader } from "@/components/onboarding/egs-logo-header";
import { ResumeCodeBanner } from "@/components/review/resume-code-banner";

export default function ReviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [finalizing, setFinalizing] = useState(false);

  const {
    data: snapshot,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["review-document", sessionId],
    queryFn: () => getReviewDocument(sessionId) as Promise<ReviewSnapshot>,
  });

  async function handleConfirm() {
    setFinalizing(true);
    try {
      await finalizeSession(sessionId);
      router.push(`/onboarding/session/${sessionId}/complete`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Please answer all required questions before confirming.");
    } finally {
      setFinalizing(false);
    }
  }

  if (loading || !snapshot) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <EgsLogoHeader />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Here&apos;s what we&apos;ve learned about your business</h1>
        <p className="mt-2 text-muted-foreground">{REVIEW_INTRO_COPY}</p>
      </div>

      {snapshot.resumeCode && <ResumeCodeBanner resumeCode={snapshot.resumeCode} />}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={getPdfUrl(sessionId)} target="_blank" rel="noreferrer">
            <Download className="mr-1 size-4" /> Download document
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.push(`/onboarding/session/${sessionId}/review/edit`)}>
          <Pencil className="mr-1 size-4" /> Select answers to update
        </Button>
      </div>

      <ReviewDocumentView snapshot={snapshot} />

      <ReviewCorrectionChat sessionId={sessionId} onCorrected={() => refetch()} />

      <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-background py-4 sm:flex-row">
        <Button className="flex-1" onClick={handleConfirm} disabled={finalizing}>
          {finalizing ? "Finalizing…" : FINAL_CONFIRMATION_COPY.confirmLabel}
        </Button>
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => router.push(`/onboarding/session/${sessionId}/review/edit`)}
        >
          {FINAL_CONFIRMATION_COPY.moreChangesLabel}
        </Button>
      </div>
    </main>
  );
}
