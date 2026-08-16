import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPdfUrl } from "@/lib/api/onboarding-client";

export function DashboardActionsGrid({
  sessionId,
  canContinue,
  canReview,
}: {
  sessionId: string;
  canContinue: boolean;
  canReview: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {canContinue && (
        <Button asChild>
          <Link href={`/onboarding/session/${sessionId}`}>Continue Questionnaire</Link>
        </Button>
      )}
      {canReview && (
        <>
          <Button variant="outline" asChild>
            <Link href={`/onboarding/session/${sessionId}/review`}>Review Answers</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/onboarding/session/${sessionId}/review/edit`}>Edit Answers</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={getPdfUrl(sessionId)} target="_blank" rel="noreferrer">
              Download Review Document
            </a>
          </Button>
        </>
      )}
    </div>
  );
}
