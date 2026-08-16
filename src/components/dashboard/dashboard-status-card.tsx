import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DisplayStatus } from "@/lib/session/status-label";

const STATUS_VARIANT: Record<DisplayStatus, "outline" | "default" | "secondary" | "destructive"> = {
  "Not Started": "outline",
  "In Progress": "secondary",
  "Ready for Review": "default",
  "Changes Required": "destructive",
  Completed: "default",
};

export function DashboardStatusCard({
  status,
  completedPhaseCount,
  totalPhases,
}: {
  status: DisplayStatus;
  completedPhaseCount: number;
  totalPhases: number;
}) {
  const percent = totalPhases > 0 ? Math.round((completedPhaseCount / totalPhases) * 100) : 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Onboarding Status</CardTitle>
        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {completedPhaseCount} of {totalPhases} sections completed
        </p>
        <Progress value={percent} />
      </CardContent>
    </Card>
  );
}
