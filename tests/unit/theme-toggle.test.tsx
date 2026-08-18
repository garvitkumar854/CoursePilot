import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ThemeToggle from "@/components/theme/theme-toggle";

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("zero-lag theme toggle", () => {
  it("commits the theme synchronously while the transition kill-switch is active", async () => {
    document.documentElement.dataset.theme = "light";

    render(<ThemeToggle />);
    screen.getByRole("button", { name: "Toggle light and dark theme" }).click();

    // The theme swap happens in the same task as the click: `.no-transitions`
    // is still on the root and the new theme is already committed.
    expect(document.documentElement).toHaveClass("no-transitions");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");

    // One microtask later the kill-switch is gone, so hover/fade polish works
    // again — without ever having transitioned the theme colors.
    await act(tick);
    expect(document.documentElement).not.toHaveClass("no-transitions");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggles back to light and persists the preference", async () => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.classList.add("dark");

    render(<ThemeToggle />);
    screen.getByRole("button", { name: "Toggle light and dark theme" }).click();

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("coursepilot-theme")).toBe("light");

    await act(tick);
    expect(document.documentElement).not.toHaveClass("no-transitions");
  });
});
