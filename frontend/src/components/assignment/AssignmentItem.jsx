import { MoreVertical, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import useAuth from "../../hooks/useAuth";
import ModalShell from "../ui/ModalShell";

export default function AssignmentItem({
  assignment,
  isAdmin = false,
  canMoveUp = false,
  canMoveDown = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onReorder,
}) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
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

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", assignment._id);
  };

  const handleDragOver = (e) => {
    if (isAuthenticated && isAdmin) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (isAuthenticated && isAdmin) {
      e.preventDefault();
      setIsDragOver(false);
      const draggedId = e.dataTransfer.getData("text/plain");
      if (draggedId && draggedId !== assignment._id) {
        onReorder?.(draggedId, assignment._id);
      }
    }
  };

  return (
    <div
      draggable={isAuthenticated && isAdmin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 transition-all duration-200 ${
        isDragOver ? "bg-blue-50 border-t-2 border-blue-400" : ""
      } ${isAuthenticated && isAdmin ? "cursor-grab active:cursor-grabbing" : ""}`}
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
          <div className="text-slate-300">
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
                initial={{ opacity: 0, scale: 0.92, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-11 z-[999] w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)] origin-top-right"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(assignment);
                  }}
                  className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50 cursor-pointer text-slate-700 font-medium transition-colors"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(assignment);
                  }}
                  className="block w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer font-medium transition-colors"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setInfoOpen(true);
                  }}
                  className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50 cursor-pointer text-slate-700 font-medium transition-colors"
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
          title="Assignment Info"
          description="Detailed metadata for this assignment."
          onClose={() => setInfoOpen(false)}
        >
          <div className="space-y-4 text-sm text-[#0f172a]">
            <div>
              <span className="font-semibold text-[#64748b] block mb-1">Assignment Number</span>
              <p className="bg-slate-50 rounded-xl px-4 py-2.5 font-mono text-xs border border-slate-100">#{assignment.assignmentNumber}</p>
            </div>
            <div>
              <span className="font-semibold text-[#64748b] block mb-1">Title</span>
              <p className="bg-slate-50 rounded-xl px-4 py-2.5 font-medium border border-slate-100">{assignment.title}</p>
            </div>
            {assignment.description && (
              <div>
                <span className="font-semibold text-[#64748b] block mb-1">Description</span>
                <p className="bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-[#475569] border border-slate-100 whitespace-pre-wrap">{assignment.description}</p>
              </div>
            )}
            <div>
              <span className="font-semibold text-[#64748b] block mb-1">Assigned Date</span>
              <p className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">{new Date(assignment.assignedDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-[#64748b] block mb-1">Created At</span>
                <p className="bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-[#475569] border border-slate-100">{new Date(assignment.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-semibold text-[#64748b] block mb-1">Updated At</span>
                <p className="bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-[#475569] border border-slate-100">{new Date(assignment.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            <div>
              <span className="font-semibold text-[#64748b] block mb-1">Updated by</span>
              <p className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100 font-medium text-blue-600">Admin</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

