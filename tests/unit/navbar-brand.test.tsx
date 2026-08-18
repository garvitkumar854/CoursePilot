import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NavbarBrand } from "@/components/navbar-brand";

describe("dynamic themed branding", () => {
  it("switches visible assets without replacing the fixed logo box", async () => {
    const style = document.createElement("style");
    style.textContent = `
      .brand-logo-dark { display: none; }
      html[data-theme="dark"] .brand-logo-light { display: none; }
      html[data-theme="dark"] .brand-logo-dark { display: block; }
    `;
    document.head.append(style);
    document.documentElement.dataset.theme = "light";

    render(<NavbarBrand appName="CoursePilot" />);

    const link = screen.getByRole("link", { name: "CoursePilot home" });
    const brandText = screen.getByText("CoursePilot");
    const lightLogo = document.querySelector<HTMLImageElement>(
      'img[src*="light_logo.svg"]',
    );
    const darkLogo = document.querySelector<HTMLImageElement>(
      'img[src*="dark_logo.svg"]',
    );
    const logoBox = lightLogo?.parentElement;

    expect(link).toHaveAttribute("data-active-theme", "light");
    expect(brandText).toHaveClass("font-poppins", "font-bold");
    expect(logoBox).toHaveClass("relative", "size-8", "shrink-0");
    expect(lightLogo).toBeVisible();
    expect(darkLogo).not.toBeVisible();

    const logoBoxReference = logoBox;
    act(() => {
      document.documentElement.dataset.theme = "dark";
    });

    await waitFor(() => expect(link).toHaveAttribute("data-active-theme", "dark"));
    expect(lightLogo).not.toBeVisible();
    expect(darkLogo).toBeVisible();
    expect(lightLogo?.parentElement).toBe(logoBoxReference);
    expect(darkLogo?.parentElement).toBe(logoBoxReference);
    expect(document.querySelectorAll('img[src*="_logo.svg"]')).toHaveLength(2);

    style.remove();
  });
});
