import AssignmentGroup from "./AssignmentGroup";

export default function AssignmentList({ assignments }) {
  const groupedAssignments = assignments.reduce((groups, assignment) => {
    const dateKey = new Date(assignment.assignedDate)
      .toISOString()
      .slice(0, 10);
    const dateLabel = new Date(assignment.assignedDate).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );

    if (!groups[dateKey]) {
      groups[dateKey] = {
        label: dateLabel,
        items: [],
      };
    }

    groups[dateKey].items.push(assignment);

    return groups;
  }, {});

  if (assignments.length === 0) {
    return (
      <div className="rounded-4xl border border-dashed border-black/10 bg-white/80 py-14 text-center shadow-sm">
        <h2 className="text-base font-semibold text-[color:var(--cp-fg)] sm:text-lg">
          No Assignments Found
        </h2>

        <p className="mt-2 text-sm text-black/60">
          Try a different search or add assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {Object.entries(groupedAssignments)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, group]) => (
          <AssignmentGroup
            key={date}
            date={group.label}
            assignments={group.items}
          />
        ))}
    </div>
  );
}
