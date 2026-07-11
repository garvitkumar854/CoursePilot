import {
  MoreVertical,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Draggable } from "@hello-pangea/dnd";
import useAuth from "../../hooks/useAuth";
import ModalShell from "../ui/ModalShell";

// ✅ Menu animation variants outside component
const menuVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -4 },
};

const menuTransition = {
  type: "spring",
  stiffness: 400,
  damping: 28,
};

function AssignmentItem({
  index,
  assignment,
  canMoveUp = false,
  canMoveDown = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isLast = false,
}) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const menuRef = useRef(null);

  // ✅ Stable callbacks — prevent child re-renders
  const handleMoveUp = useCallback(() => {
    onMoveUp?.(assignment._id);
  }, [onMoveUp, assignment._id]);

  const handleMoveDown = useCallback(() => {
    onMoveDown?.(assignment._id);
  }, [onMoveDown, assignment._id]);

  const handleEdit = useCallback(() => {
    setMenuOpen(false);
    onEdit?.(assignment);
  }, [onEdit, assignment]);

  const handleDelete = useCallback(() => {
    setMenuOpen(false);
    onDelete?.(assignment);
  }, [onDelete, assignment]);

  const handleInfo = useCallback(() => {
    setMenuOpen(false);
    setInfoOpen(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <Draggable
      draggableId={assignment._id}
      index={index}
      isDragDisabled={!isAuthenticated}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          id={`assignment-${assignment._id}`}
          className={`relative flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 bg-white transition-[background-color,box-shadow] duration-200 ${
            snapshot.isDragging
              ? "shadow-xl border border-blue-200 z-[50] rounded-2xl"
              : ""
          } ${isLast && !snapshot.isDragging ? "rounded-b-[26px]" : ""}`}
          style={provided.draggableProps.style}
        >
          {/* Move + Drag controls */}
          {isAuthenticated && (
            <div className="flex flex-col items-center gap-0.5 shrink-0 text-slate-400">
              <button
                type="button"
                onClick={handleMoveUp}
                disabled={!canMoveUp}
                className={`rounded-md p-1 transition hover:bg-slate-100 hover:text-slate-700 ${
                  !canMoveUp
                    ? "opacity-20 cursor-not-allowed"
                    : "cursor-pointer"
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
                onClick={handleMoveDown}
                disabled={!canMoveDown}
                className={`rounded-md p-1 transition hover:bg-slate-100 hover:text-slate-700 ${
                  !canMoveDown
                    ? "opacity-20 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                title="Move down"
              >
                <ChevronDown size={15} />
              </button>
            </div>
          )}

          {/* Assignment number badge */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--cp-accent)/12 text-sm font-semibold text-(--cp-accent)">
            {assignment.assignmentNumber}
          </div>

          {/* Content */}
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

          {/* Actions menu */}
          {isAuthenticated && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="rounded-full p-2 text-black/45 transition hover:bg-black/5 hover:text-black/75 cursor-pointer"
                aria-label="Open assignment actions"
                aria-expanded={menuOpen}
              >
                <MoreVertical size={18} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={menuTransition}
                    className="absolute right-0 top-11 z-[999] w-40 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.12)] origin-top-right divide-y divide-slate-100"
                  >
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 cursor-pointer text-slate-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer font-medium transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={handleInfo}
                      className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 cursor-pointer text-slate-700 font-medium transition-colors"
                    >
                      Info
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ✅ Info modal via portal — outside Draggable DOM tree */}
          {infoOpen &&
            createPortal(
              <ModalShell
                title="Assignment Details"
                description="Metadata overview."
                onClose={() => setInfoOpen(false)}
                maxWidth="max-w-md"
              >
                <div className="space-y-3 text-sm text-[#0f172a]">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">
                        Number
                      </span>
                      <p className="bg-slate-50 rounded-xl px-3 py-1.5 font-mono text-xs border border-slate-100 font-bold text-(--cp-accent)">
                        #{assignment.assignmentNumber}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">
                        Assigned Date
                      </span>
                      <p className="bg-slate-50 rounded-xl px-3 py-1.5 text-xs border border-slate-100 font-medium">
                        {new Date(assignment.assignedDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">
                      Title
                    </span>
                    <p className="bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-100 text-[#0f172a]">
                      {assignment.title}
                    </p>
                  </div>

                  {assignment.description && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-0.5">
                        Description
                      </span>
                      <p className="bg-slate-50/50 rounded-xl px-3 py-1.5 text-xs text-[#475569] border border-slate-100/80 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                        {assignment.description}
                      </p>
                    </div>
                  )}
                </div>
              </ModalShell>,
              document.body
            )}
        </div>
      )}
    </Draggable>
  );
}

// ✅ Memo comparator unchanged — was already good
export default React.memo(AssignmentItem, (prevProps, nextProps) => {
  return (
    prevProps.index === nextProps.index &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.canMoveUp === nextProps.canMoveUp &&
    prevProps.canMoveDown === nextProps.canMoveDown &&
    prevProps.assignment._id === nextProps.assignment._id &&
    prevProps.assignment.title === nextProps.assignment.title &&
    prevProps.assignment.description === nextProps.assignment.description &&
    prevProps.assignment.assignmentNumber ===
      nextProps.assignment.assignmentNumber &&
    prevProps.assignment.assignedDate === nextProps.assignment.assignedDate
  );
});