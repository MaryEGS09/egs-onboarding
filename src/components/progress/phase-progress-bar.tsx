import { Progress } from "@/components/ui/progress";

export function PhaseProgressBar({
  currentPhaseIndex,
  totalPhases,
  phaseName,
}: {
  currentPhaseIndex: number;
  totalPhases: number;
  phaseName: string | null;
}) {
  const percent = totalPhases > 0 ? Math.round(((currentPhaseIndex + 1) / totalPhases) * 100) : 0;

  return (
    <div className="w-full border-b bg-background/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between text-sm text-muted-foreground">
        <span>
          Phase {Math.min(currentPhaseIndex + 1, totalPhases)} of {totalPhases}
          {phaseName ? ` — ${phaseName}` : ""}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="mx-auto mt-2 max-w-2xl">
        <Progress value={percent} className="h-1.5" />
      </div>
    </div>
  );
}
