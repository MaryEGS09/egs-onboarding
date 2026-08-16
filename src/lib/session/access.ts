import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, CLIENT_SESSION_COOKIE_NAME } from "./client-session-cookie";

export type SessionAccessResult = { ok: true } | { ok: false; response: NextResponse };

/** Confirms the request's signed session cookie authorizes access to this sessionId. */
export async function requireSessionAccess(req: NextRequest, sessionId: string): Promise<SessionAccessResult> {
  const cookieValue = req.cookies.get(CLIENT_SESSION_COOKIE_NAME)?.value;
  const authorizedSessionId = verifySessionCookieValue(cookieValue);

  if (!authorizedSessionId || authorizedSessionId !== sessionId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true };
}
