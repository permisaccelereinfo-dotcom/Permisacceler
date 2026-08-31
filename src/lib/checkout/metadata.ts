import type { Json } from "@/lib/supabase/database.types";

// Fields from the checkout form that are safe to persist on the booking.
// Anything not on this list (notably `password`) is dropped before the
// metadata ever reaches the database.
const ALLOWED_METADATA_KEYS = [
  "prenom",
  "nom",
  "email",
  "telephone",
  "dateNaissance",
  "villeNaissance",
  "adresse",
  "complementAdresse",
  "codePostal",
  "handicap",
  "logement",
  "dejaPassePermis",
  "aLeCode",
  "neph",
  "raison",
  "attestation20h",
] as const;

const FORBIDDEN_METADATA_KEYS = new Set(["password", "confirmPassword"]);

/**
 * Whitelist-sanitize checkout form data before it is stored as booking
 * metadata. Guarantees secrets such as the account password are never
 * persisted, regardless of what the client sends.
 */
export function sanitizeCheckoutMetadata(input: Json | null | undefined): Json | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const source = input as Record<string, Json | undefined>;
  const result: Record<string, Json> = {};

  for (const key of ALLOWED_METADATA_KEYS) {
    if (FORBIDDEN_METADATA_KEYS.has(key)) continue;
    const value = source[key];
    if (value === undefined) continue;
    result[key] = value;
  }

  return result;
}
