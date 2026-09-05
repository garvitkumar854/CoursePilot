import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const GLOBALS_CSS = readFileSync(resolve(ROOT, "src/app/globals.css"), "utf8");

/** Every component source, so the consistency checks cover new files too. */
function componentSources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return componentSources(full);
    return /\.(js|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const SOURCES = [
  ...componentSources(resolve(ROOT, "src/components")),
  resolve(ROOT, "src/app/page.js"),
].map((file) => ({ file, code: readFileSync(file, "utf8") }));

describe("motion tokens", () => {
  it("overrides Tailwind's default transition duration and easing", () => {
    const theme = GLOBALS_CSS.match(/@theme\s*{[^}]*}/)?.[0] ?? "";

    // Tailwind's stock defaults are 150ms with a symmetric
    // cubic-bezier(0.4, 0, 0.2, 1), which reads as hesitant on hover/press.
    expect(theme).toMatch(/--default-transition-duration:\s*200ms/);
    expect(theme).toMatch(
      /--default-transition-timing-function:\s*cubic-bezier\(0\.22, 1, 0\.36, 1\)/,
    );
  });

  it("keeps a single curve by not hardcoding easings in components", () => {
    const offenders = SOURCES.filter(({ code }) => /\bease-out\b/.test(code)).map(
      ({ file }) => file,
    );

    // Any explicit `ease-out` overrides the shared token for that element, so
    // two different curves end up on screen at once.
    expect(offenders).toEqual([]);
  });

  it("keeps a single duration by not restating the default", () => {
    const offenders = SOURCES.filter(({ code }) => /\bduration-200\b/.test(code)).map(
      ({ file }) => file,
    );

    expect(offenders).toEqual([]);
  });

  it("only uses sanctioned press depths", () => {
    const depths = new Set<string>();
    for (const { code } of SOURCES) {
      for (const match of code.matchAll(/active:scale-(\[[^\]]*\]|\d+)/g)) {
        depths.add(match[1]);
      }
    }

    // Press depth scales inversely with element size: small icon buttons,
    // standard controls, then full-width surfaces. See globals.css.
    expect([...depths].sort()).toEqual(["[0.96]", "[0.97]", "[0.99]"]);
  });
});

describe("abruptly appearing UI is animated in", () => {
  it("eases the notification badge instead of popping it", () => {
    const navbar = readFileSync(
      resolve(ROOT, "src/components/layout/navbar.js"),
      "utf8",
    );
    expect(navbar).toMatch(/badge-pop[^"]*-top-1/);
    expect(GLOBALS_CSS).toMatch(/@keyframes badge-pop/);
  });

  it("eases the admin-only Add Subject button in", () => {
    const page = readFileSync(resolve(ROOT, "src/app/page.js"), "utf8");
    expect(page).toMatch(/gpu-enter[^"]*rounded-full bg-blue-600/);
  });
});

describe("reduced motion is still honoured", () => {
  it("keeps the global animation kill switch", () => {
    expect(GLOBALS_CSS).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(GLOBALS_CSS).toMatch(/animation-duration: 0\.01ms !important/);
    expect(GLOBALS_CSS).toMatch(/transition-duration: 0\.01ms !important/);
  });
});
