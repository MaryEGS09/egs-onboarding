import { Resend } from "resend";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendResumeCodeEmail(params: {
  to: string;
  businessName: string;
  resumeCode: string;
}): Promise<void> {
  const client = getClient();
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@egs-solutions.com";

  if (!client) {
    // No API key configured yet — log so local dev/testing can still see the code.
    console.log(`[resend:stub] Resume code for ${params.to} (${params.businessName}): ${params.resumeCode}`);
    return;
  }

  await client.emails.send({
    from,
    to: params.to,
    subject: "Your EGS Marketing Solutions onboarding resume code",
    text: `Hi,

Here is your resume code for the EGS Marketing Solutions onboarding questionnaire for ${params.businessName}:

${params.resumeCode}

You can use this code, along with your email and business name, to pick up where you left off at any time.

— EGS Marketing Solutions`,
  });
}
