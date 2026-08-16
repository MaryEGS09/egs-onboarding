"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendAnswer } from "@/lib/api/onboarding-client";
import { toast } from "sonner";

export function ReviewCorrectionChat({ sessionId, onCorrected }: { sessionId: string; onCorrected: () => void }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setSending(true);
    try {
      const result = await sendAnswer(sessionId, { inputType: "text", content: value.trim() });
      setReply(result.assistantMessage);
      setValue("");
      onCorrected();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <p className="mb-2 text-sm font-medium">Something wrong or missing?</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. My answer about our marketing budget was wrong…"
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !value.trim()}>
          Update
        </Button>
      </form>
      {reply && <p className="mt-2 text-sm text-muted-foreground">{reply}</p>}
    </div>
  );
}
