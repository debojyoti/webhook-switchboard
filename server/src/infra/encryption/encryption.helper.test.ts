import { describe, expect, it } from "vitest";
import { EncryptionHelper } from "./encryption.helper.js";

const key = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

describe("EncryptionHelper", () => {
  it("round-trips values without retaining plaintext in ciphertext", () => {
    const plaintext = "route-secret-value";
    const encrypted = EncryptionHelper.encrypt(plaintext, key);

    expect(encrypted).not.toContain(plaintext);
    expect(EncryptionHelper.decrypt(encrypted, key)).toBe(plaintext);
  });
});
