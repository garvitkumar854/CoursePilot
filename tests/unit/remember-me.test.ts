import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  REMEMBERED_SESSION_MAX_AGE,
  STANDARD_SESSION_MAX_AGE,
  getPersistentCookieExpiry,
  getSessionMaxAge,
} from "@/lib/session-duration";

const signJwt = vi.fn(() => "signed-session-token");
const findOne = vi.fn();

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn(async () => true) },
}));
vi.mock("@/lib/jwt", () => ({ signJwt }));
vi.mock("@/lib/mongodb", () => ({
  getDatabase: vi.fn(async () => ({
    collection: vi.fn(() => ({ findOne })),
  })),
}));

describe("30-day remembered admin session", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-with-sufficient-entropy";
    findOne.mockResolvedValue({
      _id: "admin-id",
      name: "Admin",
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      password: "password-hash",
    });
  });

  it("calculates exactly 30 days in seconds and milliseconds", () => {
    const now = Date.UTC(2026, 7, 18, 12, 0, 0);
    const expiry = getPersistentCookieExpiry(true, now);

    expect(REMEMBERED_SESSION_MAX_AGE).toBe(2_592_000);
    expect(getSessionMaxAge(true)).toBe(2_592_000);
    expect(expiry).toBeInstanceOf(Date);
    expect(expiry!.getTime() - now).toBe(30 * 24 * 60 * 60 * 1_000);
  });

  it("writes an HTTP-only cookie and matching JWT lifetime", async () => {
    const { POST } = await import("@/app/api/admin/login/route");
    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "admin",
        password: "secret",
        rememberMe: true,
      }),
    });

    const response = await POST(request);
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(signJwt).toHaveBeenCalledWith(
      expect.objectContaining({ role: "admin" }),
      process.env.JWT_SECRET,
      REMEMBERED_SESSION_MAX_AGE,
    );
    expect(cookie).toContain("coursepilot_admin_session=signed-session-token");
    expect(cookie).toMatch(/Max-Age=2592000/i);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Expires=/i);
  });

  it("keeps unchecked sessions as browser-session cookies", async () => {
    const { POST } = await import("@/app/api/admin/login/route");
    const response = await POST(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "admin",
          password: "secret",
          rememberMe: false,
        }),
      }),
    );
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(getSessionMaxAge(false)).toBe(STANDARD_SESSION_MAX_AGE);
    expect(cookie).not.toMatch(/Max-Age=/i);
    expect(signJwt).toHaveBeenLastCalledWith(
      expect.any(Object),
      process.env.JWT_SECRET,
      STANDARD_SESSION_MAX_AGE,
    );
  });
});
