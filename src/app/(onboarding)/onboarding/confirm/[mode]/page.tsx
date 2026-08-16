"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  MODE_CONFIRMATION_COPY,
  AI_SPECIALIST_AVATAR,
  AI_SPECIALIST_NAME,
  AI_SPECIALIST_TITLE,
  type OnboardingMode,
} from "@/lib/copy/onboarding-copy";
import { startSession } from "@/lib/api/onboarding-client";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { EgsLogoHeader } from "@/components/onboarding/egs-logo-header";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function ModeConfirmPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode: rawMode } = use(params);
  const mode = (rawMode === "interview" ? "interview" : "chat") as OnboardingMode;
  const copy = MODE_CONFIRMATION_COPY[mode];
  const router = useRouter();
  const setSession = useOnboardingStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [resumeCode, setResumeCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await startSession(mode === "interview" ? "INTERVIEW" : "CHAT");
      setSession(result.sessionId, result.mode as "CHAT" | "INTERVIEW");
      setPendingSessionId(result.sessionId);
      setResumeCode(result.resumeCode);
    } catch {
      toast.error("Something went wrong starting your session. Please try again.");
      setLoading(false);
    }
  }

  function handleContinueToSession() {
    if (pendingSessionId) router.push(`/onboarding/session/${pendingSessionId}`);
  }

  async function handleCopyCode() {
    if (!resumeCode) return;
    await navigator.clipboard.writeText(resumeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <EgsLogoHeader />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{copy.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="text-muted-foreground">{copy.body}</p>
          <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
            <Avatar size="lg">
              <AvatarImage src={AI_SPECIALIST_AVATAR} alt={AI_SPECIALIST_NAME} />
              <AvatarFallback>{AI_SPECIALIST_NAME[0]}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">
              You&apos;ll be guided by <span className="font-medium text-foreground">{AI_SPECIALIST_NAME}</span>, your{" "}
              {AI_SPECIALIST_TITLE}.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={handleConfirm} disabled={loading}>
              {loading ? "Starting…" : "Confirm & Continue"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => router.push("/onboarding/start")} disabled={loading}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(resumeCode)} onOpenChange={(open) => !open && handleContinueToSession()}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Save your resume code</DialogTitle>
            <DialogDescription>
              Write this down or copy it somewhere safe. You&apos;ll need it — along with your email and business
              name — to pick up where you left off if you leave before finishing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-secondary/50 p-4">
            <span className="font-mono text-lg font-semibold tracking-wide">{resumeCode}</span>
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              {copied ? <Check className="mr-1 size-4" /> : <Copy className="mr-1 size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={handleContinueToSession}>
              I&apos;ve saved it — let&apos;s begin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
