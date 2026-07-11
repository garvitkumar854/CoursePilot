import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, BookOpen, FileText, ChevronRight } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "../../utils/fetcher";
import { Link } from "react-router-dom";

export function GooeyInput({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
  mode = "global",
  showAssignments = false,
}) {
  const [isFocused, setIsFocused] = useState(false);

  // Fetch subjects and all active assignments for global instant search (only if active)
  const { data: subjects = [] } = useSWR("/subjects", fetcher);
  const { data: assignmentsData } = useSWR(showAssignments ? "/assignments" : null, fetcher);
  const assignments = assignmentsData?.data || [];

  const trimmedValue = (value || "").trim().toLowerCase();

  // Search filter
  const matchingSubjects = trimmedValue
    ? subjects.filter((sub) =>
        sub.name.toLowerCase().includes(trimmedValue) ||
        (sub.slug && sub.slug.toLowerCase().includes(trimmedValue))
      ).slice(0, 5)
    : [];

  const matchingAssignments = showAssignments && trimmedValue
    ? assignments.filter((assign) =>
        assign.title.toLowerCase().includes(trimmedValue) ||
        (assign.description && assign.description.toLowerCase().includes(trimmedValue))
      ).slice(0, 5)
    : [];

  const showDropdown = mode === "global" && isFocused && trimmedValue.length > 0;
  const hasResults = matchingSubjects.length > 0 || matchingAssignments.length > 0;

  const handleItemClick = () => {
    // Reset search string and collapse focus
    onChange({ target: { value: "" } });
    setIsFocused(false);
  };

  return (
    <div className={`relative w-full max-w-xl mx-auto px-1 ${className}`}>
      {/* Dynamic Liquid Glow Backdrop Aura */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, filter: "blur(12px)" }}
            animate={{ opacity: 0.16, scale: 1.04, filter: "blur(16px)" }}
            exit={{ opacity: 0, scale: 0.96, filter: "blur(12px)" }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl sm:rounded-full -z-10"
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          scale: isFocused ? 1.025 : 1,
          boxShadow: isFocused 
            ? "0 25px 50px -12px rgba(37, 99, 235, 0.22), 0 0 0 4px rgba(37, 99, 235, 0.12)"
            : "0 4px 12px -1px rgba(15, 23, 42, 0.04), 0 2px 6px -2px rgba(15, 23, 42, 0.03)",
        }}
        transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.7 }}
        className={`relative flex items-center h-12 sm:h-14 w-full rounded-2xl sm:rounded-full border transition-colors duration-200 bg-white overflow-hidden ${
          isFocused ? "border-blue-400" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {/* Dynamic sliding fluid background pill for the icon */}
        <motion.div
          layout
          initial={{ x: 12, borderRadius: "50%" }}
          animate={{
            x: isFocused ? 8 : 12,
            scale: isFocused ? 1.05 : 1,
            backgroundColor: isFocused ? "#2563eb" : "rgba(241, 245, 249, 0.7)",
            borderRadius: "50%",
          }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="absolute flex items-center justify-center z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full"
        >
          <motion.div
            animate={{
              color: isFocused ? "#ffffff" : "#64748b",
              scale: isFocused ? 1.1 : 1,
              rotate: isFocused ? 15 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <Search size={18} strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Keep a tiny delay to allow onMouseDown on links to resolve first
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder={placeholder}
          className="w-full h-full bg-transparent text-slate-900 pl-14 sm:pl-16 pr-12 outline-none font-medium placeholder:text-slate-400 text-sm sm:text-base border-none focus:ring-0 transition-all duration-200"
        />

        {/* Clear Button if value exists */}
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: -45 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              onClick={() => onChange({ target: { value: "" } })}
              type="button"
              className="absolute right-4 p-1.5 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X size={14} strokeWidth={3} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Global Instant Search Droplist Popup */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full mt-2.5 z-[100] max-h-[min(340px,50vh)] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.15)] space-y-0.5"
          >
            {hasResults ? (
              <>
                {/* Subjects Category Group */}
                {matchingSubjects.length > 0 && (
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Subjects
                  </div>
                )}
                {matchingSubjects.map((sub) => (
                  <Link
                    key={sub._id}
                    to={`/subject/${sub.slug}`}
                    onMouseDown={handleItemClick}
                    className="flex items-center justify-between rounded-xl px-3.5 py-2 transition-all hover:bg-slate-50 text-slate-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <BookOpen size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate capitalize text-slate-900">{sub.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">Go to subject view</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                        Subject
                      </span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </Link>
                ))}

                {/* Divider if both types exist */}
                {matchingSubjects.length > 0 && matchingAssignments.length > 0 && (
                  <div className="h-px bg-slate-100 my-1" />
                )}

                {/* Assignments Category Group */}
                {matchingAssignments.length > 0 && (
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assignments
                  </div>
                )}
                {matchingAssignments.map((assign) => (
                  <Link
                    key={assign._id}
                    to={`/subject/${assign.subjectId?.slug}#assignment-${assign._id}`}
                    onMouseDown={handleItemClick}
                    className="flex items-center justify-between rounded-xl px-3.5 py-2 transition-all hover:bg-slate-50 text-slate-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                        <FileText size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-slate-900">{assign.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          Assignment #{assign.assignmentNumber} {assign.subjectId?.name ? `in ${assign.subjectId.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-600">
                        Assignment
                      </span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </Link>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-slate-400">
                <Search size={22} className="stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No matching results found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Try looking for other subjects or assignments</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
