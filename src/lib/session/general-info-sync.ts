import { prisma } from "@/lib/db/prisma";
import { sendResumeCodeEmail } from "@/lib/email/resend";
import { syncClientToPlutio } from "@/lib/integrations/plutio";
import { takePlaintextResumeCode } from "@/lib/session/resume-code-cache";

const GENERAL_INFO_KEY_MAP: Record<string, string> = {
  general_full_name: "primaryContactName",
  general_email: "primaryContactEmail",
  general_company_name: "businessName",
  general_street_address: "streetAddress",
  general_city: "city",
  general_state: "state",
  general_country: "country",
  general_postal_code: "postalCode",
  general_phone: "phone",
  general_website: "website",
  general_primary_industry: "primaryIndustry",
  general_secondary_industry: "secondaryIndustry",
};

/**
 * The General Information phase is collected conversationally rather than via
 * an upfront form, so the Client record (used for resume lookup, the admin
 * table, and Plutio sync) is populated opportunistically as those specific
 * questions get answered — not at session creation time.
 */
export async function syncGeneralInfoToClient(sessionId: string, answeredQuestionKeys: string[]): Promise<void> {
  const relevantKeys = answeredQuestionKeys.filter((k) => k in GENERAL_INFO_KEY_MAP);
  if (relevantKeys.length === 0) return;

  const session = await prisma.onboardingSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { client: true },
  });

  const answers = await prisma.answer.findMany({
    where: { sessionId, question: { key: { in: relevantKeys } } },
    include: { question: true },
  });

  const updateData: Record<string, string> = {};
  for (const answer of answers) {
    const field = GENERAL_INFO_KEY_MAP[answer.question.key];
    if (field && answer.textValue) {
      updateData[field] = answer.textValue;
    }
  }
  if (Object.keys(updateData).length === 0) return;

  const hadEmailBefore = Boolean(session.client.primaryContactEmail);

  await prisma.client.update({ where: { id: session.clientId }, data: updateData });

  const nowHasEmail = updateData.primaryContactEmail ?? session.client.primaryContactEmail;
  if (!hadEmailBefore && nowHasEmail) {
    const client = await prisma.client.findUniqueOrThrow({ where: { id: session.clientId } });
    const resumeCode = takePlaintextResumeCode(sessionId);
    if (resumeCode && client.primaryContactEmail) {
      await sendResumeCodeEmail({
        to: client.primaryContactEmail,
        businessName: client.businessName ?? "your business",
        resumeCode,
      });
    }
    if (client.businessName && client.primaryContactName && client.primaryContactEmail) {
      await syncClientToPlutio({
        sessionId,
        clientId: client.id,
        businessName: client.businessName,
        contactName: client.primaryContactName,
        contactEmail: client.primaryContactEmail,
        phone: client.phone,
      });
    }
  }
}
