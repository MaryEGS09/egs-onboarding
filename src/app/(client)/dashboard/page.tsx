import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookieValue, CLIENT_SESSION_COOKIE_NAME } from "@/lib/session/client-session-cookie";
import { getSessionProgress } from "@/lib/session/progress";
import { getDisplayStatus } from "@/lib/session/status-label";
import { DashboardStatusCard } from "@/components/dashboard/dashboard-status-card";
import { DashboardActionsGrid } from "@/components/dashboard/dashboard-actions-grid";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionId = verifySessionCookieValue(cookieStore.get(CLIENT_SESSION_COOKIE_NAME)?.value);

  if (!sessionId) {
    redirect("/onboarding/resume");
  }

  const progress = await getSessionProgress(sessionId);
  const displayStatus = getDisplayStatus({
    status: progress.status,
    reviewStatus: progress.reviewStatus,
    completedPhaseCount: progress.completedPhaseCount,
  });

  const canContinue = displayStatus === "In Progress" || displayStatus === "Not Started" || displayStatus === "Changes Required";
  const canReview = displayStatus !== "Not Started";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div>
        <Image src="/brand/egs-logo-horizontal.png" alt="EGS Marketing Solutions" width={220} height={64} className="mb-3 h-auto w-44" />
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your onboarding dashboard</h1>
      </div>

      <DashboardStatusCard
        status={displayStatus}
        completedPhaseCount={progress.completedPhaseCount}
        totalPhases={progress.totalPhases}
      />

      <DashboardActionsGrid sessionId={sessionId} canContinue={canContinue} canReview={canReview} />

      <p className="text-xs text-muted-foreground">
        Last activity: {new Date(progress.lastActivityAt).toLocaleString()}
      </p>
    </main>
  );
}
