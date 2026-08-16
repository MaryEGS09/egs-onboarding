"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewDocumentView, type ReviewSnapshot } from "@/components/review/review-document-view";

type ClientProfile = {
  client: { businessName: string | null; primaryContactName: string | null; primaryContactEmail: string | null };
  progress: {
    status: string;
    reviewStatus: string;
    totalPhases: number;
    completedPhaseCount: number;
    mode: string;
    startedAt: string;
    completedAt: string | null;
  };
  snapshot: ReviewSnapshot;
  auditLog: { id: string; action: string; createdAt: string; actorType: string }[];
  versionHistory: { id: string; question: { prompt: string }; textValue: string | null; supersededAt: string; supersededReason: string | null }[];
};

export function AdminClientProfile({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-client", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/clients/${sessionId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<ClientProfile>;
    },
  });

  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  const { client, progress, snapshot, auditLog, versionHistory } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{client.businessName ?? "Unnamed business"}</h1>
          <p className="text-sm text-muted-foreground">
            {client.primaryContactName ?? "—"} · {client.primaryContactEmail ?? "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{progress.status}</Badge>
          <Badge variant="outline">{progress.mode}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Progress</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {progress.completedPhaseCount} of {progress.totalPhases} phases completed · Started{" "}
          {new Date(progress.startedAt).toLocaleDateString()}
          {progress.completedAt ? ` · Completed ${new Date(progress.completedAt).toLocaleDateString()}` : ""}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Full Questionnaire</h2>
        <ReviewDocumentView snapshot={snapshot} />
      </div>

      {versionHistory.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Answer History</h2>
          <div className="flex flex-col gap-2">
            {versionHistory.map((v) => (
              <div key={v.id} className="rounded border p-2 text-xs text-muted-foreground">
                <span className="font-medium">{v.question.prompt}</span> — previously: &ldquo;{v.textValue ?? "—"}&rdquo;
                <span className="ml-2 text-[10px]">
                  ({v.supersededReason ?? "updated"}, {new Date(v.supersededAt).toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Audit Log</h2>
        <div className="flex flex-col gap-1">
          {auditLog.map((a) => (
            <div key={a.id} className="text-xs text-muted-foreground">
              {new Date(a.createdAt).toLocaleString()} — {a.actorType} — {a.action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
