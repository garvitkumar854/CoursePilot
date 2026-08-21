import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FloatingMenu } from "@/components/ui/floating-menu";

describe("assignment action menu portal", () => {
  it("renders in document.body so overflow on neighboring rows cannot clip it", () => {
    const anchor = document.createElement("button");
    document.body.append(anchor);
    const anchorRef = createRef<HTMLButtonElement>();
    Object.defineProperty(anchorRef, "current", { value: anchor, writable: true });

    const { container } = render(
      <div style={{ overflow: "hidden", height: 24 }}>
        <FloatingMenu open onClose={vi.fn()} anchorRef={anchorRef}>
          <button type="button">Edit</button>
        </FloatingMenu>
      </div>,
    );

    const menu = screen.getByRole("menu");
    expect(menu.parentElement).toBe(document.body);
    expect(container.contains(menu)).toBe(false);
    // Above the navbar (z-40) but below the modal backdrop (z-100).
    expect(menu.className).toMatch(/z-\[90\]/);
    anchor.remove();
  });
});
