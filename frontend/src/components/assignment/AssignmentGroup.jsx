import { ChevronDown } from "lucide-react";
import React, { useState, useCallback } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { motion } from "motion/react";
import AssignmentItem from "./AssignmentItem";

// ✅ Variants defined OUTSIDE component — never recreated
const collapseVariants = {
  open: {
    opacity: 1,
    height: "auto",
    transition: {
      height: {
        duration: 0.25,
        ease: [0.04, 0.62, 0.23, 0.98],
      },
      opacity: {
        duration: 0.2,
        ease: "linear",
      },
    },
  },
  collapsed: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        duration: 0.2,
        ease: [0.04, 0.62, 0.23, 0.98],
      },
      opacity: {
        duration: 0.15,
        ease: "linear",
      },
    },
  },
};

const chevronVariants = {
  open: { rotate: 0 },
  collapsed: { rotate: -90 },
};

function AssignmentGroup({
  date,
  label,
  assignments,
  allAssignments = [],
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onReorder,
}) {
  const [open, setOpen] = useState(true);

  // ✅ useCallback — stable function reference
  // prevents AssignmentItem re-renders when group toggles
  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <div className="relative rounded-[26px] border border-slate-200 bg-white isolate">
      {/* ✅ Shadow as separate div — not on animated element */}
      <div className="absolute inset-0 -z-10 rounded-[26px] shadow-[0_10px_30px_rgba(15,23,42,0.05)] pointer-events-none" />

      {/* ✅ Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between bg-linear-to-r from-slate-50 to-white px-4 py-4 text-left sm:px-6 cursor-pointer rounded-[25px]"
      >
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-950 sm:text-base">
            {label || date}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {assignments.length} Assignment{assignments.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* ✅ Chevron uses variants — no inline animate prop */}
        <motion.div
          variants={chevronVariants}
          animate={open ? "open" : "collapsed"}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-slate-500" />
        </motion.div>
      </button>

      {/* ✅ DOM-retention strategy: never unmount, just animate height */}
      <motion.div
        initial={false}
        animate={open ? "open" : "collapsed"}
        variants={collapseVariants}
        style={{
          overflow: "hidden",
          willChange: "height, opacity",
          pointerEvents: open ? "auto" : "none",
        }}
      >
            <Droppable droppableId={date}>
              {(provided, snapshot) => (
                <div
                  className={`divide-y divide-slate-200 pt-2 rounded-b-[26px] transition-colors duration-200 ${
                    snapshot.isDraggingOver ? "bg-blue-50/30" : ""
                  }`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {assignments.map((assignment, index) => {
                    const globalIndex = allAssignments.findIndex(
                      (a) => a._id === assignment._id
                    );
                    const canMoveUp = globalIndex > 0;
                    const canMoveDown = globalIndex < allAssignments.length - 1;
                    const isLast = index === assignments.length - 1;

                    return (
                      <AssignmentItem
                        key={assignment._id}
                        index={index}
                        assignment={assignment}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        onReorder={onReorder}
                        isLast={isLast}
                      />
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </motion.div>
    </div>
  );
}

// ✅ Fixed memo comparator — now includes allAssignments length
export default React.memo(AssignmentGroup, (prevProps, nextProps) => {
  // If allAssignments length changed — rerender needed
  // (affects canMoveUp/canMoveDown in items)
  if (prevProps.allAssignments.length !== nextProps.allAssignments.length) {
    return false; // re-render
  }

  if (
    prevProps.date !== nextProps.date ||
    prevProps.label !== nextProps.label ||
    prevProps.assignments.length !== nextProps.assignments.length
  ) {
    return false; // re-render
  }

  // Check each assignment field
  return prevProps.assignments.every((a, idx) => {
    const b = nextProps.assignments[idx];
    return (
      b &&
      a._id === b._id &&
      a.title === b.title &&
      a.description === b.description &&
      a.assignedDate === b.assignedDate &&
      a.assignmentNumber === b.assignmentNumber
    );
  });
});