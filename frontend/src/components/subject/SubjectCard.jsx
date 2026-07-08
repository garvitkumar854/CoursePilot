import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Copy,
  MoreVertical,
  PencilLine,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

function timeAgo(dateString) {
  if (!dateString) return "Unknown";

  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffSec < 60) return "less than a minute ago";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

export default function SubjectCard({
  subject,
  index = 0,
  isAdmin = false,
  onEdit,
  onDelete,
}) {
  const subjectNumber = `#${String(index + 1).padStart(2, "0")}`;
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subject.slug);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-[30px] border border-black/6 bg-white/80 p-6 shadow-[0_14px_40px_rgba(17,24,39,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(17,24,39,0.12)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#2563eb]" />

      {isAdmin ? (
        <div className="absolute right-5 top-5" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-full p-2 text-black/55 transition hover:bg-black/5 hover:text-[#2563eb]"
            aria-label="Open subject actions"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-11 z-10 w-44 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-2 shadow-[0_16px_50px_rgba(15,23,42,0.14)]">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(subject);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#0f172a] transition hover:bg-black/5"
              >
                <PencilLine size={16} />
                Edit subject
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(subject);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#b91c1c] transition hover:bg-red-50"
              >
                <Trash2 size={16} />
                Delete subject
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="pr-8">
        <h3 className="text-[22px] font-bold tracking-tight text-[#0f172a]">
          {subject.name}
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#64748b]">
          <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-semibold text-[#0f172a]">
            {subjectNumber}
          </span>

          <span
            className="rounded-full px-3 py-1 font-semibold text-[#b7791f]"
            style={{ backgroundColor: "rgba(100, 116, 139, 0.12)" }}
          >
            Total Assignments {subject.assignmentCount || 0}
          </span>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl p-2 text-black/55 transition hover:bg-black/5 hover:text-[#2563eb]"
          aria-label="Copy subject index"
        >
          <Copy size={20} />
        </button>

        <Link
          to={`/subject/${subject.slug}`}
          className="group inline-flex items-center gap-2 text-[15px] font-semibold text-[#0f172a] transition hover:text-[#2563eb]"
        >
          View
          <ArrowRight
            className="transition-transform duration-300 group-hover:translate-x-1"
            size={18}
          />
        </Link>
      </div>
    </div>
  );
}
