import { MoreVertical, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Draggable } from "@hello-pangea/dnd";

import useAuth from "../../hooks/useAuth";
import ModalShell from "../ui/ModalShell";

export default function AssignmentItem({
  index,
  assignment,
  isAdmin = false,
  canMoveUp = false,
  canMoveDown = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onReorder,
  isLast = false,
}) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <Draggable draggableId={assignment._id} index={index} isDragDisabled={!isAuthenticated || !isAdmin}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          id={`assignment-${assignment._id}`}
          className={`relative flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 transition-all duration-200 bg-white ${
            snapshot.isDragging ? "shadow-xl border border-blue-200 z-[50] rounded-2xl" : ""
          } ${isLast && !snapshot.isDragging ? "rounded-b-[26px]" : ""}`}
          style={provided.draggableProps.style}
        >
          {isAuthenticated && isAdmin && (
            <div className="flex flex-col items-center gap-0.5 shrink-0 text-slate-400">
              <button
                type="button"
                onClick={() => onMoveUp?.(assignment._id)}
                disabled={!canMoveUp}
                className={`rounded-md p-1 transition hover:bg-slate-100 hover:text-slate-700 ${
                  !canMoveUp ? "opacity-20 cursor-not-allowed" : "cursor-pointer"
                }`}
                title="Move up"
              >
                <ChevronUp size={15} />
              </button>
              <div 
                className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-600 p-0.5"
                {...provided.dragHandleProps}
              >
                <GripVertical size={15} />
              </div>
              <button
                type="button"
                onClick={() => onMoveDown?.(assignment._id)}
                disabled={!canMoveDown}
                className={`rounded-md p-1 transition hover:bg-slate-100 hover:text-slate-700 ${
                  !canMoveDown ? "opacity-20 cursor-not-allowed" : "cursor-pointer"
                }`}
                title="Move down"
              >
                <ChevronDown size={15} />
              </button>
            </div>
          )}

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--cp-accent)/12 text-sm font-semibold text-(--cp-accent)">
        {assignment.assignmentNumber}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-(--cp-fg) sm:text-[15px]">
          {assignment.title}
        </h3>

        {assignment.description && (
          <p className="mt-1 max-w-3xl text-xs leading-5 text-black/55 sm:text-sm">
            {assignment.description}
          </p>
        )}
      </div>

      {isAuthenticated && isAdmin && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-2 text-black/45 transition hover:bg-black/5 hover:text-black/75 cursor-pointer"
            aria-label="Open assignment actions"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={18} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.9, y: -4, filter: 'blur(4px)' }}
                transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
                className="absolute right-0 top-11 z-[999] w-40 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_16px_36px_rgba(15,23,42,0.14)] origin-top-right divide-y divide-slate-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(assignment);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 cursor-pointer text-slate-700 font-medium transition-colors"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(assignment);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer font-medium transition-colors"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setInfoOpen(true);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 cursor-pointer text-slate-700 font-medium transition-colors"
                >
                  Info
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {infoOpen && (
        <ModalShell
          title="Assignment Details"
          description="Metadata overview."
          onClose={() => setInfoOpen(false)}
          maxWidth="max-w-md"
        >
          <div className="space-y-3 text-sm text-[#0f172a]">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">Number</span>
                <p className="bg-slate-50 rounded-xl px-3 py-1.5 font-mono text-xs border border-slate-100 font-bold text-(--cp-accent)">#{assignment.assignmentNumber}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">Assigned Date</span>
                <p className="bg-slate-50 rounded-xl px-3 py-1.5 text-xs border border-slate-100 font-medium">
                  {new Date(assignment.assignedDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">Title</span>
              <p className="bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-100 text-[#0f172a]">{assignment.title}</p>
            </div>

            {assignment.description && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">Description</span>
                <p className="bg-slate-50/50 rounded-xl px-3 py-1.5 text-xs text-[#475569] border border-slate-100/80 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">{assignment.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">Created At</span>
                <p className="bg-slate-50/40 rounded-xl px-3 py-1.5 text-[11px] text-[#64748b] border border-slate-100">{new Date(assignment.createdAt).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">Updated At</span>
                <p className="bg-slate-50/40 rounded-xl px-3 py-1.5 text-[11px] text-[#64748b] border border-slate-100">{new Date(assignment.updatedAt).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Updated By</span>
                <p className="text-xs font-semibold text-slate-700">{assignment.updatedBy || "System"}</p>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="rounded-full bg-[#2563eb] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#1d4ed8] cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </ModalShell>
      )}
        </div>
      )}
    </Draggable>
  );
}

