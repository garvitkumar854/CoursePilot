import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import useAuth from "../../hooks/useAuth";

export default function AssignmentItem({ assignment, isAdmin = false }) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div className="relative flex items-start gap-3 px-4 py-5 sm:gap-4 sm:px-6">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--cp-accent)/12 text-sm font-semibold text-(--cp-accent)">
        {assignment.assignmentNumber}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-(--cp-fg) sm:text-[15px]">
          {assignment.title}
        </h3>

        {assignment.description && (
          <p className="mt-1.5 max-w-3xl text-xs leading-5 text-black/55 sm:text-sm">
            {assignment.description}
          </p>
        )}
      </div>

      {isAuthenticated && isAdmin && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-2 text-black/45 transition hover:bg-black/5 hover:text-black/75"
            aria-label="Open assignment actions"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-40 overflow-hidden rounded-2xl border border-black/6 bg-white shadow-xl">
              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
              >
                Edit
              </button>

              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>

              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
              >
                Info
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
