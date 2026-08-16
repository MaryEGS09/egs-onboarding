/**
 * The resume code's plaintext is never persisted (only its argon2 hash is).
 * At session creation we don't yet know the client's email — that's collected
 * conversationally during the General Information phase — so we hold the
 * plaintext briefly in memory to email it out once the email becomes known.
 * The code is also always shown on-screen immediately at creation as the
 * durable fallback, so losing this cache (TTL expiry, server restart) is not
 * data loss, just a missed convenience email.
 */

const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours — comfortably longer than one sitting through Phase 1
const cache = new Map<string, { code: string; expiresAt: number }>();

export function stashPlaintextResumeCode(sessionId: string, code: string): void {
  cache.set(sessionId, { code, expiresAt: Date.now() + TTL_MS });
}

export function takePlaintextResumeCode(sessionId: string): string | null {
  const entry = cache.get(sessionId);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(sessionId);
    return null;
  }
  return entry.code;
}
