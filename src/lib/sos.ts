export const DEFAULT_SECRET_PHRASE = "It's really cold today";

/** Lowercase, drop apostrophes, turn other punctuation into spaces, collapse whitespace. */
export function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the spoken transcript contains the secret phrase as whole words. */
export function matchesSecretPhrase(transcript: string, phrase: string): boolean {
  const p = normalizePhrase(phrase);
  if (!p) return false;
  return ` ${normalizePhrase(transcript)} `.includes(` ${p} `);
}
