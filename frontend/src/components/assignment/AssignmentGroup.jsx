import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import AssignmentItem from "./AssignmentItem";

export default function AssignmentGroup({ date, assignments, allAssignments = [], onEdit, onDelete, onMoveUp, onMoveDown, onReorder }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-t-[26px] bg-linear-to-r from-slate-50 to-white px-4 py-4 text-left sm:px-6 cursor-pointer"
      >
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-950 sm:text-base">
            {date}
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
          </p>
        </div>

        <motion.div
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-visible"
          >
            <div className="divide-y divide-slate-200 border-t border-slate-200">
              {assignments.map((assignment) => {
                const globalIndex = allAssignments.findIndex((a) => a._id === assignment._id);
                const canMoveUp = globalIndex > 0;
                const canMoveDown = globalIndex < allAssignments.length - 1;
                return (
                  <AssignmentItem
                    key={assignment._id}
                    assignment={assignment}
                    isAdmin
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    onReorder={onReorder}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
