import { strict as assert } from "node:assert";
import { test, describe, before } from "node:test";

process.env.AUTH_SECRET ||= "test-secret-that-is-long-enough-for-validation";

describe("encryptSecret / decryptSecret", () => {
  let encryptSecret: (s: string) => string;
  let decryptSecret: (s: string) => string;

  before(async () => {
    ({ encryptSecret, decryptSecret } = await import("./crypto"));
  });

  test("round-trips a Plaid access token", () => {
    const token = "access-sandbox-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
    assert.equal(decryptSecret(encryptSecret(token)), token);
  });

  test("produces a different ciphertext each time (random IV)", () => {
    assert.notEqual(encryptSecret("same"), encryptSecret("same"));
  });

  test("passes through legacy plaintext tokens written before encryption", () => {
    assert.equal(decryptSecret("access-sandbox-legacy"), "access-sandbox-legacy");
  });

  test("rejects a tampered ciphertext", () => {
    const enc = encryptSecret("secret");
    const parts = enc.split(".");
    parts[3] = Buffer.from("tampered-payload").toString("base64url");
    assert.throws(() => decryptSecret(parts.join(".")));
  });
});
