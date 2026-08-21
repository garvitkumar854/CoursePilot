import { describe, expect, it } from "vitest";

import { formatRelativeFromNow } from "@/lib/relative-time";

const NOW = Date.parse("2026-08-21T12:00:00Z");
const ago = (ms: number) => formatRelativeFromNow(NOW - ms, NOW);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("relative time", () => {
  it("uses the documented labels", () => {
    expect(ago(20 * SECOND)).toBe("Just now");
    expect(ago(MINUTE)).toBe("1 minute ago");
    expect(ago(5 * MINUTE)).toBe("5 minutes ago");
    expect(ago(HOUR)).toBe("1 hour ago");
    expect(ago(3 * HOUR)).toBe("3 hours ago");
    expect(ago(DAY)).toBe("Yesterday");
    expect(ago(3 * DAY)).toBe("3 days ago");
    expect(ago(14 * DAY)).toBe("2 weeks ago");
    expect(ago(90 * DAY)).toBe("3 months ago");
    expect(ago(400 * DAY)).toBe("1 year ago");
  });

  it("never renders a negative duration for future or skewed clocks", () => {
    expect(formatRelativeFromNow(NOW + 5 * MINUTE, NOW)).toBe("Just now");
  });

  it("falls back safely for missing timestamps", () => {
    expect(formatRelativeFromNow(null)).toBe("Recently");
    expect(formatRelativeFromNow(undefined)).toBe("Recently");
  });
});
