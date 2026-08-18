import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssignmentModal } from "@/components/admin/admin-provider";

const databaseMocks = vi.hoisted(() => ({
  subjectFindOne: vi.fn(),
  assignmentFindOne: vi.fn(),
}));

vi.mock("@/lib/admin-session", () => ({
  getAdminSession: vi.fn(async () => ({ role: "admin", username: "admin" })),
}));
vi.mock("@/lib/course-db", () => ({
  getCourseCatalog: vi.fn(async () => []),
}));
vi.mock("@/lib/mongodb", () => ({
  getDatabase: vi.fn(async () => ({
    collection: vi.fn((name: string) => {
      if (name === "subjects") return { findOne: databaseMocks.subjectFindOne };
      if (name === "assignments") return { findOne: databaseMocks.assignmentFindOne };
      throw new Error(`Unexpected collection: ${name}`);
    }),
  })),
}));

describe("assignment sequence integration", () => {
  beforeEach(() => {
    databaseMocks.subjectFindOne.mockResolvedValue({ _id: "subject-id" });
    databaseMocks.assignmentFindOne.mockResolvedValue({ assignmentNumber: 3 });
  });

  it("reads the maximum MongoDB sequence and returns the next integer", async () => {
    const { GET } = await import("@/app/api/subjects/[slug]/assignments/route");
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "mathematics" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ nextNumber: 4 });
    expect(databaseMocks.assignmentFindOne).toHaveBeenCalledWith(
      { subjectId: "subject-id", isActive: { $ne: false } },
      expect.objectContaining({
        sort: { assignmentNumber: -1 },
        projection: { assignmentNumber: 1 },
      }),
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("auto-fills the assignment form with a read-only next number", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ nextNumber: 4 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <AssignmentModal
          open
          subjectName="Mathematics"
          subjectSlug="mathematics"
          fallbackNumber={1}
          onClose={vi.fn()}
          onCreate={vi.fn()}
        />
      </QueryClientProvider>,
    );

    const numberInput = await screen.findByDisplayValue("4");
    expect(numberInput).toHaveAttribute("readonly");
    expect(numberInput).toHaveAttribute("aria-readonly", "true");
    await waitFor(() => expect(numberInput).not.toHaveValue("3"));
  });
});
