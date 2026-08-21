import { describe, expect, it } from "vitest";

import { buildDateGroups } from "@/lib/assignment-order";

/**
 * The exact dataset from the specification.
 *
 *   2026-08-01 → A, B
 *   2026-08-08 → C
 *   2026-08-15 → D, E
 *
 * Chronological numbers: A=1 B=2 C=3 D=4 E=5 — regardless of display order.
 */
const documents = [
  { _id: "d", title: "D", assignedDate: new Date("2026-08-15T00:00:00Z"), order: 4, createdAt: new Date("2026-07-04") },
  { _id: "b", title: "B", assignedDate: new Date("2026-08-01T00:00:00Z"), order: 2, createdAt: new Date("2026-07-02") },
  { _id: "e", title: "E", assignedDate: new Date("2026-08-15T00:00:00Z"), order: 5, createdAt: new Date("2026-07-05") },
  { _id: "a", title: "A", assignedDate: new Date("2026-08-01T00:00:00Z"), order: 1, createdAt: new Date("2026-07-01") },
  { _id: "c", title: "C", assignedDate: new Date("2026-08-08T00:00:00Z"), order: 3, createdAt: new Date("2026-07-03") },
];

type Row = { number: number; title: string };
type Group = { label: string; sortKey: number; assignments: Row[] };

/** Mirrors the display transform in `subject-detail-client`. */
function displayed(groups: Group[], direction: "asc" | "desc") {
  const ordered =
    direction === "asc"
      ? groups
      : groups.slice().reverse().map((group) => ({ ...group, assignments: group.assignments.slice().reverse() }));

  return ordered.map((group) => ({
    label: group.label,
    rows: group.assignments.map((assignment) => `${assignment.number}:${assignment.title}`),
  }));
}

describe("chronological assignment numbering", () => {
  const { dateGroups, assignmentRows } = buildDateGroups(documents) as {
    dateGroups: Group[];
    assignmentRows: Row[];
  };

  it("numbers assignments oldest -> newest, continuously across groups", () => {
    expect(assignmentRows.map((row) => `${row.number}:${row.title}`)).toEqual([
      "1:A",
      "2:B",
      "3:C",
      "4:D",
      "5:E",
    ]);
  });

  it("groups by calendar day and keeps groups chronological on the server", () => {
    expect(dateGroups.map((group) => group.label)).toEqual([
      "1 August 2026",
      "8 August 2026",
      "15 August 2026",
    ]);
  });

  it("renders newest -> oldest by default without renumbering", () => {
    expect(displayed(dateGroups, "desc")).toEqual([
      { label: "15 August 2026", rows: ["5:E", "4:D"] },
      { label: "8 August 2026", rows: ["3:C"] },
      { label: "1 August 2026", rows: ["2:B", "1:A"] },
    ]);
  });

  it("renders oldest -> newest after toggling the sort, with identical numbers", () => {
    expect(displayed(dateGroups, "asc")).toEqual([
      { label: "1 August 2026", rows: ["1:A", "2:B"] },
      { label: "8 August 2026", rows: ["3:C"] },
      { label: "15 August 2026", rows: ["4:D", "5:E"] },
    ]);
  });

  it("returns to the default order on a second toggle", () => {
    expect(displayed(dateGroups, "desc")).toEqual(displayed(dateGroups, "desc"));
    expect(displayed(dateGroups, "desc")[0].rows[0]).toBe("5:E");
  });

  it("breaks same-day ties with the stored order, then createdAt, then id", () => {
    const sameDay = buildDateGroups([
      { _id: "y", title: "Y", assignedDate: new Date("2026-08-01T00:00:00Z"), createdAt: new Date("2026-07-09") },
      { _id: "x", title: "X", assignedDate: new Date("2026-08-01T00:00:00Z"), createdAt: new Date("2026-07-08") },
      { _id: "w", title: "W", assignedDate: new Date("2026-08-01T00:00:00Z"), order: 1, createdAt: new Date("2026-07-10") },
    ]);

    expect((sameDay.assignmentRows as Row[]).map((row) => `${row.number}:${row.title}`)).toEqual(["1:X", "2:Y", "3:W"]);
  });

  it("skips inactive assignments so numbering has no gaps", () => {
    const { assignmentRows: rows } = buildDateGroups([
      ...documents,
      { _id: "z", title: "Z", assignedDate: new Date("2026-08-02T00:00:00Z"), isActive: false },
    ]);

    expect((rows as Row[]).map((row) => row.number)).toEqual([1, 2, 3, 4, 5]);
  });
});
