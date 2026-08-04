import crypto from "node:crypto";

const algorithm = "aes-256-gcm";

export const EncryptionHelper = {
  decrypt(value: string, encodedKey: string): string {
    const [version, encodedIv, encodedCiphertext, encodedTag] = value.split(".");
    if (version !== "v1" || !encodedIv || !encodedCiphertext || !encodedTag) {
      throw new Error("Invalid encrypted value");
    }

    const decipher = crypto.createDecipheriv(algorithm, readKey(encodedKey), Buffer.from(encodedIv, "base64url"));
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encodedCiphertext, "base64url")), decipher.final()]).toString("utf8");
  },

  encrypt(value: string, encodedKey: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, readKey(encodedKey), iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

    return ["v1", iv.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
  },
};

function readKey(encodedKey: string) {
  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }

  return key;
}
