"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PROGRESS_SAVED_LABEL } from "@/lib/copy/onboarding-copy";

export function AutoSaveIndicator({ lastSavedAt }: { lastSavedAt: number | null }) {
  if (!lastSavedAt) return null;
  // Remount on every save via `key` so each toast starts fresh and visible=true needs no effect-driven setState.
  return <SavedToast key={lastSavedAt} />;
}

function SavedToast() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-1.5 rounded-full bg-foreground/90 px-3 py-1.5 text-xs text-background shadow-lg">
        <Check className="size-3.5" />
        {PROGRESS_SAVED_LABEL.replace("✓ ", "")}
      </div>
    </div>
  );
}
