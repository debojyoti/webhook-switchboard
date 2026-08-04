import { describe, expect, it } from "vitest";
import { RouteUrlSecurityError, RouteUrlSecurityHelper } from "./route-url-security.helper.js";

describe("RouteUrlSecurityHelper", () => {
  it.each(["http://127.0.0.1:3000", "http://10.0.0.1", "http://169.254.169.254", "http://[::1]"])(
    "blocks internal target %s",
    async (url) => {
      await expect(RouteUrlSecurityHelper.assertAllowed(url, false)).rejects.toBeInstanceOf(RouteUrlSecurityError);
    },
  );

  it("rejects non-HTTP protocols", async () => {
    await expect(RouteUrlSecurityHelper.assertAllowed("file:///tmp/test", false)).rejects.toBeInstanceOf(RouteUrlSecurityError);
  });
});
