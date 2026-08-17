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

/**
 * Sends the client's onboarding review document (PDF) to the internal EGS
 * team inbox, so the team always has a copy regardless of whether the client
 * ever downloads it themselves. Used both automatically on finalize and via
 * an on-demand admin "resend" action.
 */
export type SendResult = { sent: true; to: string } | { sent: false; reason: string };

export async function sendReviewDocumentToTeam(params: {
  businessName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  pdfBuffer: Buffer;
  reason: "client_finalized" | "admin_requested";
}): Promise<SendResult> {
  const client = getClient();
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@egs-solutions.com";
  const teamEmail = process.env.EGS_TEAM_NOTIFICATION_EMAIL;
  const label = params.businessName ?? params.contactName ?? "Unnamed client";

  // Report honestly rather than silently pretending to send — a missing key or
  // recipient is a config problem the admin needs told about, not hidden.
  if (!client || !teamEmail) {
    const missing = [!client ? "RESEND_API_KEY" : null, !teamEmail ? "EGS_TEAM_NOTIFICATION_EMAIL" : null]
      .filter((v): v is string => v !== null)
      .join(", ");
    console.log(
      `[resend:stub] Would email onboarding document for "${label}" (reason: ${params.reason}). Not configured: ${missing}.`,
    );
    return { sent: false, reason: `Email is not configured on this environment (missing ${missing}).` };
  }

  const reasonLine =
    params.reason === "client_finalized"
      ? "This client just finished and confirmed their onboarding questionnaire."
      : "This copy was requested manually from the admin dashboard.";

  await client.emails.send({
    from,
    to: teamEmail,
    subject: `Onboarding document — ${label}`,
    text: `${reasonLine}

Business: ${params.businessName ?? "—"}
Contact: ${params.contactName ?? "—"}
Email: ${params.contactEmail ?? "—"}

The completed onboarding document is attached.

— EGS Onboarding Platform`,
    attachments: [
      {
        filename: `egs-onboarding-${(params.businessName ?? "client").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
        content: params.pdfBuffer,
      },
    ],
  });

  return { sent: true, to: teamEmail };
}
