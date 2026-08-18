import type { ReactNode } from "react";

/**
 * App Router templates remount on navigation. This class uses compositor-only
 * opacity/transform animation and also names the surface for browsers that
 * support the native View Transitions API.
 */
export default function RouteTemplate({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <div className="route-transition">{children}</div>;
}
