import argon2 from "argon2";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Crockford-ish, no ambiguous chars

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Generates a human-typeable resume code like "3F7-K9P2-QXR4". */
export function generateResumeCode(): string {
  return `${randomSegment(3)}-${randomSegment(4)}-${randomSegment(4)}`;
}

export async function hashResumeCode(code: string): Promise<string> {
  return argon2.hash(normalizeCode(code));
}

export async function verifyResumeCode(hash: string, code: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, normalizeCode(code));
  } catch {
    return false;
  }
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
