"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resumeSession, requestResumeCode } from "@/lib/api/onboarding-client";
import { toast } from "sonner";

export function ResumeLookupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [resumeCode, setResumeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await resumeSession({ email, businessName, resumeCode });
      router.push("/dashboard");
    } catch {
      toast.error("We couldn't find a matching session. Please double-check your details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestCode() {
    if (!email || !businessName) {
      toast.info("Enter your email and business name first, then we can send a new code.");
      return;
    }
    setRequestingCode(true);
    try {
      await requestResumeCode({ email, businessName });
      toast.success("If that matches a record, we've sent a new resume code to your email.");
    } finally {
      setRequestingCode(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="businessName">Business name</Label>
        <Input id="businessName" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resumeCode">Resume code</Label>
        <Input id="resumeCode" required value={resumeCode} onChange={(e) => setResumeCode(e.target.value)} placeholder="XXX-XXXX-XXXX" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Looking up your session…" : "Continue"}
      </Button>
      <Button type="button" variant="link" size="sm" onClick={handleRequestCode} disabled={requestingCode}>
        I don&apos;t have my resume code
      </Button>
    </form>
  );
}
