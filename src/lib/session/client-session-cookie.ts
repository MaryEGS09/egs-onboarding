import crypto from "crypto";

const COOKIE_NAME = "egs_session";
const MAX_AGE_SECONDS = 60 * 60 * 24; // 24h, refreshed on each successful resume/interaction

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set.");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionCookieValue(sessionId: string): string {
  const payload = Buffer.from(JSON.stringify({ sessionId, issuedAt: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionCookieValue(value: string | undefined): string | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sessionId: string };
    return decoded.sessionId ?? null;
  } catch {
    return null;
  }
}

export const CLIENT_SESSION_COOKIE_NAME = COOKIE_NAME;
export const CLIENT_SESSION_COOKIE_MAX_AGE = MAX_AGE_SECONDS;
