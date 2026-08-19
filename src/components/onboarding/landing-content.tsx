import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function LandingContent() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-secondary/40 to-background px-6 py-24 text-center">
      <Image src="/brand/egs-logo-stacked-tagline.png" alt="EGS Marketing Solutions" width={280} height={168} className="mb-6 h-auto w-56 sm:w-64" priority />
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Let&apos;s get to know your business.
      </h1>
      <p className="mt-5 max-w-xl text-balance text-muted-foreground">
        A guided, AI-assisted onboarding experience so our team can build marketing, SEO, content, and branding
        strategies that are genuinely tailored to your business.
      </p>

      {/* Welcome video — 16:9 source (1280x720). preload="metadata" keeps the
          initial page load light while still showing a first frame. */}
      <video
        className="mt-8 aspect-video w-full max-w-2xl rounded-xl border bg-muted shadow-sm"
        controls
        playsInline
        preload="metadata"
      >
        <source src="/brand/egs-welcome-video.mp4" type="video/mp4" />
        Your browser doesn&apos;t support embedded video. You can continue with the onboarding below.
      </video>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/onboarding/start">Start Onboarding</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/onboarding/resume">Resume a session</Link>
        </Button>
      </div>
    </main>
  );
}
