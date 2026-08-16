"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Question = { id: string; prompt: string; key: string };

export function ArchivedQuestionsPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-archived-questions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/questionnaire/questions?includeArchived=true");
      const all = (await res.json()) as (Question & { archived: boolean })[];
      return all.filter((q) => q.archived);
    },
  });

  async function restore(id: string) {
    try {
      const res = await fetch(`/api/admin/questionnaire/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["admin-archived-questions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-questionnaire"] });
      toast.success("Question restored.");
    } catch {
      toast.error("Couldn't restore this question.");
    }
  }

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No archived questions.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((q) => (
        <div key={q.id} className="flex items-center justify-between rounded border p-3">
          <p className="text-sm">{q.prompt}</p>
          <Button size="sm" variant="outline" onClick={() => restore(q.id)}>
            Restore
          </Button>
        </div>
      ))}
    </div>
  );
}
