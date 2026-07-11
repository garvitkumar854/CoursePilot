import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Check, Trash2, Calendar, BookOpen, Trash, Sparkles } from "lucide-react";
import api from "../../api/axios";
import { fetcher } from "../../utils/fetcher";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: response, mutate } = useSWR("/notifications", fetcher, {
    refreshInterval: 10000, // Auto-refresh every 10 seconds for real-time updates
  });

  const notifications = response?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      mutate();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete("/notifications/clear-all");
      mutate();
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read in backend
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        mutate();
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    setOpen(false);

    // Route if there's a link
    if (notif.subjectSlug) {
      const targetPath = `/subject/${notif.subjectSlug}`;
      const hash = notif.assignmentId ? `#assignment-${notif.assignmentId}` : "";
      
      if (location.pathname === targetPath) {
        // If already on the page, manually trigger hash-scrolling
        if (hash) {
          window.location.hash = hash;
          const element = document.getElementById(`assignment-${notif.assignmentId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.remove("highlight-pulse");
            // Force reflow
            void element.offsetWidth;
            element.classList.add("highlight-pulse");
          }
        }
      } else {
        navigate(`${targetPath}${hash}`);
      }
    }
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 6000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    }
    const days = Math.floor(diffMins / 1440);
    if (days === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getIcon = (type) => {
    switch (type) {
      case "subject_created":
        return <BookOpen size={16} className="text-blue-600" />;
      case "subject_updated":
        return <BookOpen size={16} className="text-amber-500" />;
      case "subject_deleted":
        return <Trash size={16} className="text-red-500" />;
      case "assignment_created":
        return <Calendar size={16} className="text-emerald-500" />;
      case "assignment_updated":
        return <Calendar size={16} className="text-violet-500" />;
      case "assignment_deleted":
        return <Trash2 size={16} className="text-red-500" />;
      default:
        return <Sparkles size={16} className="text-slate-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "subject_created":
        return "bg-blue-50";
      case "subject_updated":
        return "bg-amber-50";
      case "subject_deleted":
        return "bg-red-50";
      case "assignment_created":
        return "bg-emerald-50";
      case "assignment_updated":
        return "bg-violet-50";
      case "assignment_deleted":
        return "bg-red-50";
      default:
        return "bg-slate-50";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
        aria-label="Open notifications"
      >
        <Bell size={18} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 z-50 w-80 sm:w-96 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Mark all as read"
                    >
                      <Check size={14} />
                      <span className="hidden sm:inline">Read All</span>
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                      title="Clear all"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
                    <Check size={20} className="text-emerald-500" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">You're all caught up!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Any new course and syllabus modifications will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex w-full items-start gap-3.5 px-4 py-3 text-left hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      !notif.isRead ? "bg-blue-50/20" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getBgColor(notif.type)}`}>
                      {getIcon(notif.type)}
                    </div>

                    {/* Meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold text-slate-950 truncate ${!notif.isRead ? "text-slate-950 font-bold" : "text-slate-800"}`}>
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] font-medium text-slate-400">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed break-words">
                        {notif.body}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
