import { ResumeLookupForm } from "@/components/resume/resume-lookup-form";
import { EgsLogoHeader } from "@/components/onboarding/egs-logo-header";

export default function ResumePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <EgsLogoHeader />
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-muted-foreground">Enter your details to pick up where you left off.</p>
      </div>
      <ResumeLookupForm />
    </main>
  );
}
