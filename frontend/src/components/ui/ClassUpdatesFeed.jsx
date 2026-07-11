import { useState, useEffect } from "react";
import useSWR from "swr";
import { Bell, BellOff, Calendar, PlusCircle, RefreshCw, Trash2, BookOpen } from "lucide-react";
import { fetcher } from "../../utils/fetcher";
import { motion, AnimatePresence } from "motion/react";

export default function ClassUpdatesFeed() {
  const [permission, setPermission] = useState(
    typeof window !== "undefined" ? Notification.permission : "default"
  );
  const [lastSeenId, setLastSeenId] = useState(
    typeof window !== "undefined" ? localStorage.getItem("last_seen_notification_id") || "" : ""
  );

  // Poll for class updates every 15 seconds to simulate push updates
  const { data: notifications = [], error } = useSWR("/notifications", fetcher, {
    refreshInterval: 15000,
  });

  // Track new notifications and trigger native push
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest._id !== lastSeenId) {
        // Only trigger browser notification if permission is granted and it's not the initial state
        if (permission === "granted" && lastSeenId) {
          try {
            new window.Notification(latest.title, {
              body: latest.body,
              icon: "/favicon.svg",
              badge: "/favicon.svg",
            });
          } catch (err) {
            console.warn("Browser Notification trigger error:", err);
          }
        }
        // Update last seen
        setLastSeenId(latest._id);
        localStorage.setItem("last_seen_notification_id", latest._id);
      }
    }
  }, [notifications, lastSeenId, permission]);

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);
    } catch (err) {
      console.error("Error requesting permission:", err);
    }
  }

  function getIcon(type) {
    switch (type) {
      case "create_subject":
        return <BookOpen size={14} className="text-teal-600 animate-bounce" />;
      case "create_assignment":
        return <PlusCircle size={14} className="text-emerald-600 animate-pulse" />;
      case "update_subject":
      case "update_assignment":
        return <RefreshCw size={14} className="text-amber-600" />;
      case "delete_subject":
      case "delete_assignment":
        return <Trash2 size={14} className="text-rose-600" />;
      default:
        return <Bell size={14} className="text-slate-600" />;
    }
  }

  function getColor(type) {
    switch (type) {
      case "create_subject":
        return "bg-teal-50 border-teal-100 text-teal-800";
      case "create_assignment":
        return "bg-emerald-50 border-emerald-100 text-emerald-800";
      case "update_subject":
      case "update_assignment":
        return "bg-amber-50 border-amber-100 text-amber-800";
      case "delete_subject":
      case "delete_assignment":
        return "bg-rose-50 border-rose-100 text-rose-800";
      default:
        return "bg-slate-50 border-slate-100 text-slate-800";
    }
  }

  return (
    <div className="flex flex-col h-full bg-white/65 border border-black/5 rounded-[28px] p-5 shadow-sm backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            Classroom Feed
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
            Realtime Activity
          </p>
        </div>

        {/* Browser Notification Switch */}
        <button
          onClick={requestNotificationPermission}
          className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold cursor-pointer transition-all border ${
            permission === "granted"
              ? "bg-teal-50 text-teal-700 border-teal-200/50"
              : "bg-slate-100 text-slate-600 border-slate-200/50 hover:bg-slate-200"
          }`}
          title={permission === "granted" ? "Class Notifications Active" : "Enable Browser Notifications"}
        >
          {permission === "granted" ? (
            <>
              <Bell size={12} className="animate-swing" />
              <span className="hidden sm:inline">Active</span>
            </>
          ) : (
            <>
              <BellOff size={12} />
              <span className="hidden sm:inline">Subscribe</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-3 custom-scrollbar">
        {error ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Could not retrieve recent updates.
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10">
            <Bell size={24} className="mx-auto text-slate-300 mb-2 animate-pulse" />
            <p className="text-xs text-slate-400 font-medium">No activity logged yet.</p>
            <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto mt-1 leading-normal">
              Admin updates will stream here automatically.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.slice(0, 6).map((notif, index) => (
              <motion.div
                key={notif._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 border rounded-2xl p-3 shadow-inner ${getColor(notif.type)}`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                  {getIcon(notif.type)}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold leading-snug">{notif.title}</p>
                  <p className="text-[11px] font-medium leading-relaxed opacity-90">{notif.body}</p>
                  <p className="text-[9px] font-mono opacity-60 flex items-center gap-1 mt-1">
                    <Calendar size={10} />
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
