import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config.mjs";

/**
 * Next 16 returns 403 for any `/_next/*` request whose `Origin` is not in
 * `allowedDevOrigins`. Client chunks are module scripts, so they always send
 * `Origin`: behind a proxy on another host every chunk 403s, the page still
 * renders and looks correct, but React never hydrates and every click handler
 * (theme toggle, copy button) is silently dead.
 */
describe("dev origin allowlist", () => {
  it("allowlists the proxied preview host so client chunks are not 403", () => {
    const allowed: string[] = nextConfig.allowedDevOrigins ?? [];

    expect(allowed.length).toBeGreaterThan(0);
    expect(allowed).toContain("*.e2b.app");
  });
});
