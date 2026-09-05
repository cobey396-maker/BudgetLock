import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "crypto";
import { env } from "./env";

// Plaid access tokens are long-lived bearer credentials for a user's bank
// connection, so they are encrypted at rest with AES-256-GCM rather than being
// stored as plaintext. The key is derived from AUTH_SECRET via HKDF with a
// purpose-specific info string, so rotating AUTH_SECRET invalidates them
// together with sessions.

const VERSION = "v1";
const IV_BYTES = 12;

let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;
  if (!env.authSecret) {
    throw new Error("AUTH_SECRET is not set — cannot encrypt or decrypt stored credentials");
  }
  cachedKey = Buffer.from(
    hkdfSync("sha256", Buffer.from(env.authSecret, "utf8"), Buffer.alloc(0), "budgetlock:plaid-token:v1", 32)
  );
  return cachedKey;
}

/** Encrypts a secret for storage. Output: `v1.<iv>.<tag>.<ciphertext>` (base64url). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(".");
}

/**
 * Decrypts a value produced by {@link encryptSecret}.
 *
 * Rows written before encryption was introduced hold a bare Plaid token, which
 * has no `v1.` prefix; those are passed through unchanged so existing bank
 * connections keep working until they are re-linked.
 */
export function decryptSecret(stored: string): string {
  if (!stored.startsWith(`${VERSION}.`)) return stored;
  const [, ivB64, tagB64, ctB64] = stored.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Malformed encrypted value");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64url")), decipher.final()]).toString("utf8");
}
