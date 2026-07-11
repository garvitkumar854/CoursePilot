import { useMemo } from "react";
import AssignmentGroup from "./AssignmentGroup";
import { DragDropContext } from "@hello-pangea/dnd";

// ✅ Removed motion wrapper from list entirely
// Stagger was re-triggering on every group toggle — causing lag
// Groups animate themselves individually via AssignmentGroup

export default function AssignmentList({
  assignments,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onReorder,
}) {
  const sortedGroupedEntries = useMemo(() => {
    const groups = assignments.reduce((acc, assignment) => {
      const rawDate = assignment.assignedDate;
      const dateKey =
        typeof rawDate === "string"
          ? rawDate.slice(0, 10)
          : new Date(rawDate).toISOString().slice(0, 10);

      if (!acc[dateKey]) {
        // ✅ Use UTC date parts to avoid timezone label mismatch
        const [year, month, day] = dateKey.split("-").map(Number);
        const dateLabel = new Date(Date.UTC(year, month - 1, day))
          .toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC", // ✅ Force UTC — no timezone shift
          });

        acc[dateKey] = {
          label: dateLabel,
          items: [],
        };
      }

      acc[dateKey].items.push(assignment);
      return acc;
    }, {});

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [assignments]);

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

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const draggedId = result.draggableId;
    const isDifferentGroup = source.droppableId !== destination.droppableId;
    const newDate = isDifferentGroup ? destination.droppableId : null;

    const targetGroupData = sortedGroupedEntries.find(
      ([date]) => date === destination.droppableId
    );
    const destGroup = targetGroupData ? targetGroupData[1].items : [];

    let targetId = draggedId;
    if (destGroup.length > 0) {
      const clampedIndex = Math.min(destination.index, destGroup.length - 1);
      targetId = destGroup[clampedIndex]._id;
    }

    onReorder?.(draggedId, targetId, newDate);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* ✅ Plain div — no motion wrapper */}
      <div className="space-y-3 sm:space-y-4">
        {sortedGroupedEntries.map(([date, group]) => (
          <AssignmentGroup
            key={date}
            date={date}
            label={group.label}
            assignments={group.items}
            allAssignments={assignments}
            onEdit={onEdit}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onReorder={onReorder}
          />
        ))}
      </div>
    </DragDropContext>
  );
}