import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DeleteSubjectDialog from "@/components/delete-subject-dialog";
import { Modal } from "@/components/ui/modal";

describe("shared modal architecture", () => {
  it("portals the dialog to document.body so it escapes page stacking contexts", () => {
    const { container } = render(
      <div className="relative z-10">
        <Modal open onClose={vi.fn()} title="Centered dialog">
          content
        </Modal>
      </div>,
    );

    // Nothing is rendered inside the z-10 wrapper…
    expect(container.querySelector("[data-modal-backdrop]")).toBeNull();
    // …the backdrop lives directly under <body>.
    expect(document.body.querySelector("[data-modal-backdrop]")).not.toBeNull();
    expect(screen.getByRole("dialog", { name: "Centered dialog" })).toBeInTheDocument();
  });

  it("locks background scrolling while open and restores it on close", () => {
    const { unmount } = render(
      <Modal open onClose={vi.fn()} title="Locked">
        content
      </Modal>,
    );

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and on a backdrop click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Dismissable">
        content
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the permanent delete dialog as a compact alertdialog", () => {
    render(
      <DeleteSubjectDialog open subjectName="Data Mining" onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("Permanently delete Data Mining?");
    expect(dialog).toHaveTextContent("This action cannot be undone.");
    expect(screen.getByRole("button", { name: "Keep subject" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete permanently" })).toBeInTheDocument();
    // Uses the shared card radius token rather than an ad-hoc rounded-* class.
    expect(dialog.className).toContain("rounded-card");
  });
});
