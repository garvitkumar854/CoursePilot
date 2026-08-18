"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function useActiveTheme(): Theme {
  return useSyncExternalStore(subscribeToTheme, getTheme, () => "light");
}

export type NavbarBrandProps = Readonly<{
  appName?: string;
  href?: string;
  priority?: boolean;
  className?: string;
}>;

/**
 * A CLS-safe brand lockup. The logo is decorative because the adjacent text
 * supplies the accessible brand name.
 */
export function NavbarBrand({
  appName = "CoursePilot",
  href = "/",
  priority = true,
  className = "",
}: NavbarBrandProps) {
  const theme = useActiveTheme();

  return (
    <Link
      href={href}
      aria-label={`${appName} home`}
      data-active-theme={theme}
      className={`inline-flex min-w-0 shrink-0 items-center gap-2.5 ${className}`}
    >
      <span className="relative block size-8 shrink-0 sm:size-9" aria-hidden="true">
        <Image
          src="/branding/light_logo.svg"
          alt=""
          fill
          priority={priority}
          sizes="36px"
          className="brand-logo-light object-cover object-left"
        />
        <Image
          src="/branding/dark_logo.svg"
          alt=""
          fill
          priority={priority}
          sizes="36px"
          className="brand-logo-dark object-cover object-left"
        />
      </span>
      <span className="font-poppins truncate text-[clamp(1rem,2.5vw,1.2rem)] font-bold tracking-[-0.025em] text-slate-900">
        {appName}
      </span>
    </Link>
  );
}

export default NavbarBrand;
