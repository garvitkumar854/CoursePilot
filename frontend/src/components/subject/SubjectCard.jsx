import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Copy,
  MoreVertical,
  PencilLine,
  Trash2,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { motion, AnimatePresence } from "motion/react";

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

const SUBJECT_COLORS = [
  "#2563eb", // vibrant blue
  "#8b5cf6", // premium purple
  "#ec4899", // lively pink
  "#10b981", // fresh emerald
  "#f59e0b", // warm amber
  "#3b82f6", // clear indigo-blue
  "#14b8a6", // sleek teal
  "#f97316", // bold orange
  "#f43f5e", // elegant rose
  "#06b6d4", // bright cyan
  "#6366f1", // deep indigo
  "#d946ef", // bright fuchsia
];

function getSubjectColor(idOrName) {
  if (!idOrName) return SUBJECT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < idOrName.length; i++) {
    hash = idOrName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
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
  const copyTimeoutRef = useRef(null);
  const menuRef = useRef(null);
  
  const cardColor = getSubjectColor(subject._id || subject.name);

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

  const [copied, setCopied] = useState(false);

  useEffect(() => () => clearTimeout(copyTimeoutRef.current), []);

  const handleCopy = async () => {
    try {
      const { data: res } = await api.get(`/assignments/subject/${subject._id}`);
      const assignments = res.data || [];

      let copyText = `${subject.name}\n`;
      assignments.forEach((assignment, idx) => {
        copyText += `${idx + 1}. ${assignment.title}\n`;
        if (assignment.description) {
          copyText += `   ${assignment.description}\n`;
        }
      });

      await navigator.clipboard.writeText(copyText.trim());
      setCopied(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="group relative overflow-visible rounded-[30px] border border-black/6 bg-white/80 p-6 shadow-[0_14px_40px_rgba(17,24,39,0.07)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(17,24,39,0.12)]">
      {/* Wrapper to clip the dynamic line to the container's rounded top corners */}
      <div className="absolute inset-0 overflow-hidden rounded-[30px] pointer-events-none" style={{ transform: "translateZ(0)" }}>
        {/* Base trace line */}
        <div className="absolute inset-x-0 top-0 h-[4px] bg-slate-100/70" />
        {/* Dynamic line expanding center to outside on hover */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[4px] w-12 group-hover:w-full transition-all duration-500 ease-out"
          style={{
            backgroundColor: cardColor,
          }}
        />
      </div>

      {isAdmin ? (
        <div className="absolute right-5 top-5" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-full p-2 text-black/55 transition hover:bg-black/5 cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.color = cardColor}
            onMouseLeave={(e) => e.currentTarget.style.color = ""}
            aria-label="Open subject actions"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={18} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -12, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -12, rotate: -2 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="absolute right-0 top-11 z-[99] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_50px_rgba(15,23,42,0.14)] origin-top-right"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(subject);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                >
                  <PencilLine size={16} className="text-slate-500" />
                  Edit subject
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(subject);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}

      <div className="pr-8">
        <h3 className="text-[22px] font-bold tracking-tight text-[#0f172a] capitalize">
          {subject.name}
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#64748b]">
          <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-semibold text-[#0f172a]">
            {subjectNumber}
          </span>

          <span
            className="rounded-full px-3 py-1 font-semibold"
            style={{ backgroundColor: "rgba(100, 116, 139, 0.12)", color: cardColor }}
          >
            Total Assignments {subject.assignmentCount || 0}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50/50 px-3 py-1 text-xs text-slate-500 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Updated {timeAgo(subject.lastUpdated || subject.updatedAt)}
          </span>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <motion.button
          type="button"
          onClick={handleCopy}
          whileHover={{ y: -1, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="relative flex h-10 w-10 items-center justify-center overflow-visible rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition-[background-color,color,box-shadow] cursor-pointer hover:bg-slate-100/80 hover:shadow-md"
          aria-label={copied ? "Subject assignments copied" : "Copy subject assignments"}
          title={copied ? "Copied" : "Copy subject assignments"}>
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.div
                key="copied"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex items-center justify-center"
              >
                <Check size={18} className="text-emerald-600" />
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.14 }}
                  className="absolute left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-emerald-100 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm"
                >
                  Copied
                </motion.span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onMouseEnter={(e) => e.currentTarget.style.color = cardColor}
                onMouseLeave={(e) => e.currentTarget.style.color = ""}
              >
                <Copy size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>


        <Link
          to={`/subject/${subject.slug}`}
          className="group inline-flex items-center gap-2 text-[15px] font-semibold text-[#0f172a] transition-colors duration-200"
          onMouseEnter={(e) => e.currentTarget.style.color = cardColor}
          onMouseLeave={(e) => e.currentTarget.style.color = '#0f172a'}
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
