export const REMEMBERED_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const STANDARD_SESSION_MAX_AGE = 60 * 60 * 12;

/** Shared by JWT issuance and cookie persistence to prevent expiry drift. */
export function getSessionMaxAge(rememberMe: boolean): number {
  return rememberMe ? REMEMBERED_SESSION_MAX_AGE : STANDARD_SESSION_MAX_AGE;
}

export function getPersistentCookieExpiry(
  rememberMe: boolean,
  now = Date.now(),
): Date | undefined {
  if (!rememberMe) return undefined;
  return new Date(now + REMEMBERED_SESSION_MAX_AGE * 1_000);
}
