import { ModeChoiceCards } from "@/components/onboarding/mode-choice-cards";
import { EgsLogoHeader } from "@/components/onboarding/egs-logo-header";

export default function OnboardingStartPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <EgsLogoHeader />
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Get Started</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">How would you like to complete your onboarding?</h1>
        <p className="mt-2 text-muted-foreground">You can switch input types later — this just sets the overall experience.</p>
      </div>
      <ModeChoiceCards />
    </main>
  );
}
