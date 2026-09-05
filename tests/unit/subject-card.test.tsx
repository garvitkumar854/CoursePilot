import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SubjectCard from "@/components/subjects/subject-card";

vi.mock("@/components/admin/admin-provider", () => ({
  useAdmin: () => ({
    isAdmin: false,
    openAddSubject: vi.fn(),
    deleteSubject: vi.fn(),
    openLogin: vi.fn(),
  }),
}));

const SUBJECT = {
  slug: "data-mining",
  name: "Data Mining",
  accentColor: "#10b981",
  tint: "rgba(16, 185, 129, 0.12)",
  assignmentCount: 8,
  lastUpdatedLabel: "12 days ago",
  lastUpdatedDisplay: "16 August 2026",
  lastUpdatedAt: new Date().toISOString(),
  dateGroups: [
    {
      label: "30 July 2026",
      assignments: [{ number: 1, title: "What is Data Mining?" }],
    },
  ],
};

// The dark-theme fix and the motion primitives live in plain CSS, which jsdom
// never evaluates. Reading the shipped stylesheet lets these assertions guard
// the actual rules instead of a copy of them. Vitest's root is the repo root.
const GLOBALS_CSS = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
);

describe("subject card accent line", () => {
  it("exposes the accent to the card and renders a single expanding bar", () => {
    const { container } = render(<SubjectCard subject={SUBJECT} rank={2} />);

    const card = container.querySelector("article");
    const bar = container.querySelector(".subject-accent-bar");

    // The glow is driven by this variable, so it must be declared on the card
    // root rather than only on the "Open subject" link.
    expect(card?.getAttribute("style")).toContain("--subject-accent");
    expect(card?.getAttribute("style")).toContain("#10b981");
    expect(bar).not.toBeNull();
    expect(bar).toHaveClass("group-hover:scale-x-100", "group-hover:opacity-100");

    // The sheen sweep was removed: the growth itself is the animation now.
    expect(container.querySelector(".subject-accent-sheen")).toBeNull();
    expect(bar?.childElementCount).toBe(0);
  });

  it("animates the accent bar in both directions", () => {
    const strip = (rule: string) => rule.replace(/\/\*[\s\S]*?\*\//g, "");
    const baseRule = strip(
      GLOBALS_CSS.match(/\.subject-accent-bar\s*{[^}]*}/)?.[0] ?? "",
    );
    const hoverRule = strip(
      GLOBALS_CSS.match(
        /\.group:hover \.subject-accent-bar,\s*\.group:focus-within \.subject-accent-bar\s*{[^}]*}/,
      )?.[0] ?? "",
    );
    const ms = (rule: string, prop: string) =>
      Number(rule.match(new RegExp(`(^|[\\s;])${prop} (\\d+)ms`))?.[2]);

    // Tailwind v4 `scale-x-*` drives the independent `scale` property.
    expect(baseRule).toMatch(/(^|[\s;])scale\s/);
    expect(baseRule).toMatch(/(^|[\s;])transform\s/);
    // No layout-forcing property may interpolate.
    expect(baseRule).not.toMatch(
      /(^|[;{\s])(width|height|left|right|top|bottom|margin)\s*:/,
    );

    // A transition uses the timings of the state it moves *to*: the base rule is
    // the hover-OUT ramp, the :hover rule is the hover-in ramp. Both must exist,
    // or one direction snaps.
    expect(hoverRule).toMatch(/transition/);

    // Exit: opacity has to stay up while the bar retracts, otherwise the shrink
    // is invisible and the line looks like it vanishes.
    expect(ms(baseRule, "scale")).toBeGreaterThanOrEqual(400);
    expect(ms(baseRule, "opacity")).toBeGreaterThanOrEqual(300);

    // Enter: opacity resolves fast so the bar is solid while it is still
    // growing — you watch the line lengthen, not fade in.
    expect(ms(hoverRule, "opacity")).toBeLessThanOrEqual(150);
    expect(ms(hoverRule, "opacity")).toBeLessThan(ms(hoverRule, "scale"));

    // The sheen keyframes must be gone, not just unused.
    expect(GLOBALS_CSS).not.toMatch(/accent-sheen/);
  });
});

describe("subject card updated capsule", () => {
  it("keeps the bg-white/80 hook that the dark theme remaps", () => {
    const { container } = render(<SubjectCard subject={SUBJECT} rank={2} />);

    const capsule = container.querySelector('[class~="bg-white/80"]');
    expect(capsule).not.toBeNull();
    expect(capsule?.textContent).toContain("Updated");

    // Regression guard for the dark-mode fix: the capsule used to stay a bright
    // white pill on the dark panel because only `.bg-white` was remapped.
    const darkRule = GLOBALS_CSS.match(
      /html\[data-theme="dark"\][^{]*\{[^}]*background-color:[^}]*}/g,
    );
    const remapped = (darkRule ?? []).some((rule) =>
      rule.includes('bg-white/80'),
    );
    expect(remapped).toBe(true);
  });
});

describe("subject card copy button", () => {
  it("marks up the glyph so hover can separate the two sheets", () => {
    const { container } = render(<SubjectCard subject={SUBJECT} rank={2} />);

    const button = screen.getByRole("button", { name: "Copy assignments" });
    expect(button).toHaveClass("copy-button");
    expect(button.querySelector("svg.copy-glyph")).not.toBeNull();
    expect(button.querySelector("rect.copy-sheet")).not.toBeNull();
    expect(container.querySelector(".copy-pulse")).toBeNull();
  });

  it("confirms a copy with the tooltip and the one-shot pulse ring", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const { container } = render(<SubjectCard subject={SUBJECT} rank={2} />);
    const button = screen.getByRole("button", { name: "Copy assignments" });

    await userEvent.click(button);

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("Assignments for Data Mining:"),
    );
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Copied!");
    expect(container.querySelector(".copy-pulse")).not.toBeNull();

    const pulseRule = GLOBALS_CSS.match(/\.copy-pulse\s*{[^}]*}/)?.[0] ?? "";
    const pulseKeyframes =
      GLOBALS_CSS.match(/@keyframes copy-pulse\s*{[\s\S]*?\n}/)?.[0] ?? "";
    // `currentColor` keeps the ring in sync with the emerald success state in
    // both themes without an extra dark-mode rule.
    expect(pulseRule).toMatch(/currentColor/);
    expect(pulseKeyframes).toMatch(/opacity/);
    expect(pulseKeyframes).toMatch(/scale\(/);
  });
});
