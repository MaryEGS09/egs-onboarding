import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPLETION_MESSAGE } from "@/lib/copy/onboarding-copy";
import { EgsLogoHeader } from "@/components/onboarding/egs-logo-header";

export default function CompletePage() {
  const [title, ...bodyParagraphs] = COMPLETION_MESSAGE.split("\n\n");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <EgsLogoHeader />
      <CheckCircle2 className="size-14 text-primary" />
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="flex flex-col gap-3 text-muted-foreground">
        {bodyParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <Button asChild size="lg">
        <Link href="/dashboard">Go to your dashboard</Link>
      </Button>
    </main>
  );
}
