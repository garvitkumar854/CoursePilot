"use client";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** A small, device-local preference cookie. Never use this for credentials. */
export function readClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie.split("; ").find((value) => value.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

export function writeClientCookie(name: string, value: string, maxAge = THIRTY_DAYS): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

export function removeClientCookie(name: string): void {
  writeClientCookie(name, "", 0);
}
