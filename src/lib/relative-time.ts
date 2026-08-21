/**
 * Shared relative-time formatting.
 *
 * Pure and deterministic: `now` is always injected, so the server can render a
 * first-paint label and the browser can recompute the exact value after
 * hydration without a mismatch warning.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

function plural(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

export function formatRelativeFromNow(
  timestamp: number | null | undefined,
  now: number = Date.now(),
): string {
  if (timestamp === null || timestamp === undefined || Number.isNaN(timestamp)) {
    return "Recently";
  }

  const diff = now - timestamp;

  // Clock skew or a future timestamp: never show a negative duration.
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return plural(Math.floor(diff / MINUTE), "minute");
  if (diff < DAY) return plural(Math.floor(diff / HOUR), "hour");

  const days = Math.floor(diff / DAY);
  if (days === 1) return "Yesterday";
  if (diff < WEEK) return plural(days, "day");
  if (diff < MONTH) return plural(Math.floor(diff / WEEK), "week");
  if (diff < YEAR) return plural(Math.floor(diff / MONTH), "month");

  return plural(Math.floor(diff / YEAR), "year");
}

export function formatRelativeIso(
  iso: string | null | undefined,
  now: number = Date.now(),
): string {
  if (!iso) return "Recently";
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? "Recently" : formatRelativeFromNow(time, now);
}

export function formatAbsoluteIso(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
