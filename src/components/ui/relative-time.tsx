"use client";

import { useSyncExternalStore } from "react";

import { formatRelativeIso } from "@/lib/relative-time";

/**
 * One shared clock for every relative timestamp on the page: a single 30s
 * interval that only runs while at least one `<RelativeTime>` is mounted.
 */
const listeners = new Set<() => void>();
let tick = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function emit() {
  tick += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (!timer) {
    timer = setInterval(emit, 30_000);
    document.addEventListener("visibilitychange", emit);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", emit);
      timer = null;
    }
  };
}

const getClientSnapshot = () => tick;
/** Server snapshot is a sentinel: it selects the SSR-safe fallback label. */
const getServerSnapshot = () => -1;

export type RelativeTimeProps = Readonly<{
  /** ISO timestamp coming from trusted server data. */
  value: string | null | undefined;
  /** Server-rendered label used for the first paint (hydration-safe). */
  fallback?: string;
  className?: string;
}>;

/**
 * Renders an accurate relative time ("5 minutes ago", "Yesterday", "3 months
 * ago"). The server and the hydration pass both render `fallback`, so there is
 * never a mismatch; the browser-computed value takes over on the first client
 * snapshot and refreshes on the shared clock.
 */
export function RelativeTime({ value, fallback, className }: RelativeTimeProps) {
  const snapshot = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const label = snapshot < 0 ? (fallback ?? "Recently") : formatRelativeIso(value);

  return (
    <time className={className} dateTime={value ?? undefined} suppressHydrationWarning>
      {label}
    </time>
  );
}

export default RelativeTime;
