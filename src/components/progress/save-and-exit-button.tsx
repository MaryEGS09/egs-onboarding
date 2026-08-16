"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pauseSession } from "@/lib/api/onboarding-client";
import { SECTION_BREAK_COPY } from "@/lib/copy/onboarding-copy";
import { toast } from "sonner";

export function SaveAndExitButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  async function handleSaveAndExit() {
    try {
      await pauseSession(sessionId);
      toast.success("Your progress is saved. Come back anytime.");
      router.push("/dashboard");
    } catch {
      toast.error("Couldn't save right now, but your last answer is already stored. Please try again.");
    }
  }

  return (
    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSaveAndExit}>
      {SECTION_BREAK_COPY.saveAndExitLabel}
    </Button>
  );
}
