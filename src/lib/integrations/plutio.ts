import { prisma } from "@/lib/db/prisma";

/**
 * Fire-and-forget sync of onboarding clients into Plutio's CRM. Uses Plutio's
 * REST API directly with an API key configured for this app — NOT the MCP
 * connector available in the Claude session, which the running app can't reach.
 * Failures are logged to AuditLog and never block the client's onboarding flow.
 *
 * NOTE: exact Plutio REST endpoint/field shape should be confirmed against
 * Plutio's API docs for the account in use; this follows their documented
 * entity-based REST pattern (people/companies/projects) as a best-effort default.
 */

type PlutioSyncParams = {
  sessionId: string;
  clientId: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  phone?: string | null;
};

function getConfig() {
  const apiKey = process.env.PLUTIO_API_KEY;
  const baseUrl = process.env.PLUTIO_API_BASE_URL ?? "https://api.plutio.com/v1";
  if (!apiKey) return null;
  return { apiKey, baseUrl };
}

async function plutioRequest(baseUrl: string, apiKey: string, path: string, body: unknown) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Plutio request to ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function syncClientToPlutio(params: PlutioSyncParams): Promise<void> {
  const config = getConfig();
  if (!config) {
    console.log(`[plutio:stub] Would sync client ${params.businessName} to Plutio CRM.`);
    return;
  }

  try {
    const client = await prisma.client.findUniqueOrThrow({ where: { id: params.clientId } });

    let companyId = client.plutioCompanyId;
    if (!companyId) {
      const company = (await plutioRequest(config.baseUrl, config.apiKey, "/companies", {
        name: params.businessName,
      })) as { _id: string };
      companyId = company._id;
    }

    let personId = client.plutioPersonId;
    if (!personId) {
      const person = (await plutioRequest(config.baseUrl, config.apiKey, "/people", {
        name: params.contactName,
        email: params.contactEmail,
        phone: params.phone ?? undefined,
        company: companyId,
      })) as { _id: string };
      personId = person._id;
    }

    const project = (await plutioRequest(config.baseUrl, config.apiKey, "/projects", {
      name: `${params.businessName} — EGS Onboarding`,
      company: companyId,
      person: personId,
    })) as { _id: string };

    await prisma.client.update({
      where: { id: params.clientId },
      data: { plutioCompanyId: companyId, plutioPersonId: personId },
    });
    await prisma.onboardingSession.update({
      where: { id: params.sessionId },
      data: { plutioProjectId: project._id },
    });

    await prisma.auditLog.create({
      data: {
        sessionId: params.sessionId,
        actorType: "SYSTEM",
        action: "plutio_sync_success",
      },
    });
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        sessionId: params.sessionId,
        actorType: "SYSTEM",
        action: "plutio_sync_failed",
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
    });
  }
}
