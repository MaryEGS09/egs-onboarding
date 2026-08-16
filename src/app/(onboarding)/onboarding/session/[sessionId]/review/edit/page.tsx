"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { getReviewDocument, reopenQuestions } from "@/lib/api/onboarding-client";
import { REVIEW_SELECTION_COPY } from "@/lib/copy/onboarding-copy";
import type { ReviewSnapshot } from "@/components/review/review-document-view";
import { toast } from "sonner";

export default function ReviewEditPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<ReviewSnapshot | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const data = (await getReviewDocument(sessionId)) as ReviewSnapshot;
      setSnapshot(data);
    })();
  }, [sessionId]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      await reopenQuestions(sessionId, Array.from(selected));
      router.push(`/onboarding/session/${sessionId}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!snapshot) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <Skeleton className="h-8 w-1/2" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{REVIEW_SELECTION_COPY.heading}</h1>

      <div className="flex flex-col gap-6">
        {snapshot.phases.map((phase) => (
          <div key={phase.phaseKey}>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{phase.phaseName}</h2>
            <div className="flex flex-col gap-2">
              {phase.sections.flatMap((s) => s.questions).map((q) => (
                <label key={q.questionKey} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40">
                  <Checkbox checked={selected.has(q.questionKey)} onCheckedChange={() => toggle(q.questionKey)} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{q.prompt}</p>
                    <p className="text-xs text-muted-foreground">{q.answer ?? "No answer yet"}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 border-t bg-background py-4">
        <Button className="w-full" disabled={selected.size === 0 || submitting} onClick={handleSubmit}>
          {REVIEW_SELECTION_COPY.submitLabel} {selected.size > 0 ? `(${selected.size})` : ""}
        </Button>
      </div>
    </main>
  );
}
