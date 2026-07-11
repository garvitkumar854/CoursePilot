import AssignmentGroup from "./AssignmentGroup";
import { DragDropContext } from "@hello-pangea/dnd";

export default function AssignmentList({ assignments, onEdit, onDelete, onMoveUp, onMoveDown, onReorder }) {
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

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const draggedId = result.draggableId;
    const isDifferentGroup = source.droppableId !== destination.droppableId;
    const newDate = isDifferentGroup ? destination.droppableId : null;
    
    const destGroup = groupedAssignments[destination.droppableId]?.items || [];
    
    let targetId = null;
    if (destGroup.length > 0) {
      if (destination.index < destGroup.length) {
        targetId = destGroup[destination.index]._id;
      } else {
        targetId = destGroup[destGroup.length - 1]._id; // Append to end
      }
    } else {
      targetId = draggedId;
    }
    
    if (targetId || newDate) {
      onReorder?.(draggedId, targetId || draggedId, newDate);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-3 sm:space-y-4">
        {Object.entries(groupedAssignments)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, group]) => (
            <AssignmentGroup
              key={date}
              date={date} // droppableId
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
