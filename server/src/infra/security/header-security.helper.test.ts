import { describe, expect, it } from "vitest";
import { HeaderSecurityHelper } from "./header-security.helper.js";

describe("HeaderSecurityHelper", () => {
  it.each(["Authorization", "Cookie", "X-Api-Key", "X-Webhook-Secret", "X-Signature-Token"])(
    "classifies %s as sensitive",
    (name) => {
      expect(HeaderSecurityHelper.isSensitive(name)).toBe(true);
    },
  );

  it("does not classify ordinary metadata as sensitive", () => {
    expect(HeaderSecurityHelper.isSensitive("Content-Type")).toBe(false);
  });
});
