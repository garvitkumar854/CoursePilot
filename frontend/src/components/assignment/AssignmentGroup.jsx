import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { Droppable } from "@hello-pangea/dnd";

import AssignmentItem from "./AssignmentItem";

export default function AssignmentGroup({ date, label, assignments, allAssignments = [], onEdit, onDelete, onMoveUp, onMoveDown, onReorder }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-linear-to-r from-slate-50 to-white px-4 py-4 text-left sm:px-6 cursor-pointer transition-colors duration-200"
      >
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-950 sm:text-base">
            {label || date}
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {assignments.length} Assignment{assignments.length === 1 ? "" : "s"}
          </p>
        </div>

        <motion.div
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-slate-500" />
        </motion.div>
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-rows,opacity] ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <Droppable droppableId={date}>
            {(provided) => (
              <div 
                className="divide-y divide-slate-200 border-t border-slate-200"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {assignments.map((assignment, index) => {
                  const globalIndex = allAssignments.findIndex((a) => a._id === assignment._id);
                  const canMoveUp = globalIndex > 0;
                  const canMoveDown = globalIndex < allAssignments.length - 1;
                  const isLast = index === assignments.length - 1;
                  return (
                    <AssignmentItem
                      key={assignment._id}
                      index={index}
                      assignment={assignment}
                      isAdmin
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
        </div>
      </div>
    </div>
  );
}
