import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UploadAssignmentsModal from "@/components/subjects/upload-assignments-modal";

vi.mock("@/lib/assignment-import", () => ({
  IMPORT_FORMAT_SAMPLE: "Required format sample",
  groupAssignmentsByDate: (assignments: Array<{ assignedDate: string }>) => [
    { date: "2026-01-01", label: "Group", assignments },
  ],
  parseAssignmentFile: () => ({
    assignments: [
      {
        key: "row-1",
        title: "Original title",
        description: "",
        assignedDate: "2026-01-01",
      },
    ],
    errors: [],
  }),
  validateImportAssignments: () => [],
}));

describe("uncontrolled upload preview", () => {
  it("imports keystroke-edited values without controlled re-render state", async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { container } = render(
      <UploadAssignmentsModal
        open
        subjectName="Math"
        subjectSlug="math"
        onClose={onClose}
        onImport={onImport}
      />,
    );

    // Drop a file: parsing populates the draft ref via commitList().
    const dropzone = container.querySelector("label");
    expect(dropzone).not.toBeNull();
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        dropEffect: "copy",
        files: [{ text: async () => "ignored" }],
      },
    });

    await waitFor(() => screen.getByDisplayValue("Original title"));

    // Edit the row: the input is uncontrolled, the draft record is mutated
    // in place and no React state tracks the keystroke.
    fireEvent.input(screen.getByDisplayValue("Original title"), {
      target: { value: "Edited title" },
    });
    fireEvent.input(screen.getByPlaceholderText("Optional description"), {
      target: { value: "  Edited description  " },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Import 1 assignment/ }),
    );

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith("math", [
      {
        number: 1,
        title: "Edited title",
        description: "Edited description",
        assignedDate: "2026-01-01",
      },
    ]);
    expect(onClose).toHaveBeenCalled();
  });
});
