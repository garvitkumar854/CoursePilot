import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import AssignmentItem from "./AssignmentItem";

export default function AssignmentGroup({ date, assignments }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-linear-to-r from-slate-50 to-white px-4 py-4 text-left sm:px-6"
      >
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-950 sm:text-base">
            {date}
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
          </p>
        </div>

        {open ? <ChevronDown /> : <ChevronRight />}
      </button>

      {open && (
        <div className="divide-y divide-slate-200 border-t border-slate-200">
          {assignments.map((assignment) => (
            <AssignmentItem
              key={assignment._id}
              assignment={assignment}
              isAdmin
            />
          ))}
        </div>
      )}
    </div>
  );
}
