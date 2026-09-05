"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/admin-provider";
import NavbarBrand from "@/components/navbar-brand";
import ThemeToggle from "@/components/theme/theme-toggle";
import { useDismissable } from "@/lib/use-dismissable";

const NOTIFICATION_STORAGE_KEY = "coursepilot-notifications-v1";
const EMPTY_PREFERENCES = { readIds: [], clearedAt: null };

const NOTIFICATION_TONES = {
    subject_created: { dot: "bg-blue-500", ring: "bg-blue-50 text-blue-600" },
    subject_updated: { dot: "bg-amber-500", ring: "bg-amber-50 text-amber-600" },
    subject_deleted: { dot: "bg-rose-500", ring: "bg-rose-50 text-rose-600" },
    assignment_created: { dot: "bg-emerald-500", ring: "bg-emerald-50 text-emerald-600" },
    assignment_updated: { dot: "bg-amber-500", ring: "bg-amber-50 text-amber-600" },
    assignment_deleted: { dot: "bg-rose-500", ring: "bg-rose-50 text-rose-600" },
    assignments_imported: { dot: "bg-violet-500", ring: "bg-violet-50 text-violet-600" },
};

function readNotificationPreferences() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "null");
        return {
            readIds: Array.isArray(parsed?.readIds) ? parsed.readIds.map(String).slice(-250) : [],
            clearedAt: typeof parsed?.clearedAt === "string" ? parsed.clearedAt : null,
        };
    } catch {
        return EMPTY_PREFERENCES;
    }
}

function toneFor(type) {
    return NOTIFICATION_TONES[type] ?? { dot: "bg-slate-400", ring: "bg-slate-100 text-slate-500" };
}

function relativeTime(value) {
    if (!value) return "";

    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return "";

    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(time));
}

function notificationHref(notification) {
    if (!notification.subjectSlug || notification.type === "subject_deleted") return null;

    const base = `/subjects/${encodeURIComponent(notification.subjectSlug)}`;
    const linksToAssignment = ["assignment_created", "assignment_updated"].includes(notification.type);

    if (linksToAssignment && notification.assignmentId) {
        const id = encodeURIComponent(notification.assignmentId);
        return `${base}?assignment=${id}#assignment-${id}`;
    }

    return base;
}

function BellIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[1.8] sm:h-5 sm:w-5">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.5 17a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[1.9]">
            <path d="M15 17v1.5A1.5 1.5 0 0 1 13.5 20h-7A1.5 1.5 0 0 1 5 18.5v-13A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V7M10 12h10m0 0-3-3m3 3-3 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 stroke-[2.2]">
            <path d="M5 12h14m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function EmptyBell() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 stroke-[1.5] text-slate-300">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.5 17a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

export default function Navbar() {
    const { isAdmin, openLogin, logout } = useAdmin();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [preferences, setPreferences] = useState(() =>
        typeof window === "undefined" ? EMPTY_PREFERENCES : readNotificationPreferences(),
    );

    const panelRef = useDismissable(notificationsOpen, () => setNotificationsOpen(false));

    const savePreferences = (next) => {
        setPreferences(next);
        window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
    };

    useEffect(() => {
        let active = true;
        const controller = new AbortController();

        async function loadNotifications({ quiet = false } = {}) {
            if (!quiet) setNotificationsLoading(true);

            try {
                const response = await fetch("/api/notifications", {
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error("Unable to load notifications");
                const data = await response.json();
                if (active) setNotifications(data.notifications ?? []);
            } catch (error) {
                if (active && error.name !== "AbortError" && !quiet) setNotifications([]);
            } finally {
                if (active && !quiet) setNotificationsLoading(false);
            }
        }

        loadNotifications();
        const interval = window.setInterval(() => loadNotifications({ quiet: true }), 60_000);

        const handleVisibility = () => {
            if (document.visibilityState === "visible") loadNotifications({ quiet: true });
        };

        const handleStorage = (event) => {
            if (event.key === NOTIFICATION_STORAGE_KEY) setPreferences(readNotificationPreferences());
        };

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("storage", handleStorage);
        window.addEventListener("coursepilot:notifications-changed", handleVisibility);

        return () => {
            active = false;
            controller.abort();
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("coursepilot:notifications-changed", handleVisibility);
        };
    }, []);

    const visibleNotifications = useMemo(() => {
        const clearedAt = preferences.clearedAt ? new Date(preferences.clearedAt).getTime() : 0;
        return notifications.filter((notification) => {
            const createdAt = new Date(notification.createdAt || 0).getTime();
            return !clearedAt || Number.isNaN(createdAt) || createdAt > clearedAt;
        });
    }, [notifications, preferences.clearedAt]);

    const readIds = useMemo(() => new Set(preferences.readIds), [preferences.readIds]);
    const unreadCount = visibleNotifications.filter((notification) => !readIds.has(notification.id)).length;

    const markNotificationRead = (id) => {
        if (readIds.has(id)) return;
        const nextIds = [...preferences.readIds.filter((item) => item !== id), id].slice(-250);
        savePreferences({ ...preferences, readIds: nextIds });
    };

    const markAllRead = () => {
        const ids = new Set(preferences.readIds);
        visibleNotifications.forEach((notification) => ids.add(notification.id));
        savePreferences({ ...preferences, readIds: Array.from(ids).slice(-250) });
    };

    const clearAll = () => {
        const latestTime = visibleNotifications.reduce((latest, notification) => {
            const value = new Date(notification.createdAt || 0).getTime();
            return Number.isNaN(value) ? latest : Math.max(latest, value);
        }, Date.now());

        savePreferences({ readIds: [], clearedAt: new Date(latestTime).toISOString() });
    };

    return (
        <header className="sticky top-0 z-40 px-2.5 pt-2.5 sm:px-6 sm:pt-4 lg:px-8">
            <div
                className="mx-auto flex w-full items-center justify-between gap-1.5 rounded-[22px] border border-slate-200/90 bg-white/95 px-2.5 py-2 shadow-md backdrop-blur-md sm:gap-3 sm:rounded-full sm:px-4 sm:py-2.5"
                style={{ maxWidth: 1180 }}
            >
                <NavbarBrand />

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                    <ThemeToggle />

                    <div className="relative" ref={panelRef}>
                        <button
                            type="button"
                            aria-label="Notifications"
                            aria-expanded={notificationsOpen}
                            onClick={() => setNotificationsOpen((current) => !current)}
                            className={`relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-gpu hover:-translate-y-0.5 sm:h-10 sm:w-10 ${notificationsOpen
                                ? "border-slate-300 bg-slate-900 text-white shadow-md"
                                : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                                }`}
                        >
                            <BellIcon />
                            {unreadCount > 0 ? (
                                <span className="badge-pop absolute -right-1 -top-1 flex min-w-[1.15rem] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[0.6rem] font-black leading-4 text-white" aria-label={`${unreadCount} unread notifications`}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            ) : null}
                        </button>

                        {notificationsOpen ? (
                            // Drawer/panel motion is pure CSS (`.gpu-enter-scale`):
                            // opacity + translate3d only. The Tailwind translate
                            // utilities use the independent `translate` property,
                            // so they compose with the keyframe transform.
                            <div
                                role="dialog"
                                aria-label="Notifications"
                                className="gpu-enter-scale fixed left-1/2 top-[4.2rem] z-50 w-[calc(100vw-1rem)] max-w-[23rem] -translate-x-1/2 overflow-hidden rounded-[22px] border border-slate-200/90 bg-white/95 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:absolute sm:left-auto sm:right-0 sm:top-13 sm:w-92 sm:translate-x-0 sm:rounded-3xl"
                            >
                                    <div className="border-b border-slate-100 px-3.5 py-3 sm:px-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <p className="truncate text-sm font-black tracking-[-0.02em] text-slate-900">Notifications</p>
                                                {visibleNotifications.length ? (
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.66rem] font-black text-slate-500">
                                                        {visibleNotifications.length}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[2]"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" /></svg>
                                            </button>
                                        </div>

                                        {visibleNotifications.length ? (
                                            <div className="mt-2.5 flex items-center gap-2">
                                                <button type="button" onClick={markAllRead} disabled={!unreadCount} className="cursor-pointer rounded-full border border-slate-200 px-2.5 py-1 text-[0.68rem] font-black text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-default disabled:opacity-45">
                                                    Mark all read
                                                </button>
                                                <button type="button" onClick={clearAll} className="cursor-pointer rounded-full border border-rose-200 px-2.5 py-1 text-[0.68rem] font-black text-rose-500 transition-colors hover:bg-rose-50">
                                                    Clear all
                                                </button>
                                                <span className="ml-auto text-[0.65rem] font-bold text-slate-400">This device</span>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="contain-scroll max-h-[min(64vh,28rem)] overflow-y-auto p-2" aria-live="polite">
                                        {notificationsLoading ? (
                                            <div className="space-y-2 p-1">
                                                {[0, 1, 2].map((row) => (
                                                    <div key={row} className="flex animate-pulse items-start gap-3 rounded-2xl p-2.5">
                                                        <span className="h-8 w-8 shrink-0 rounded-full bg-slate-100" />
                                                        <div className="min-w-0 flex-1 space-y-2"><span className="block h-3 w-2/5 rounded-full bg-slate-100" /><span className="block h-2.5 w-4/5 rounded-full bg-slate-100" /></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : visibleNotifications.length ? (
                                            <ul className="space-y-1">
                                                {visibleNotifications.map((notification, index) => {
                                                    const tone = toneFor(notification.type);
                                                    const href = notificationHref(notification);
                                                    const isUnread = !readIds.has(notification.id);
                                                    const content = (
                                                        <>
                                                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.ring}`}>
                                                                <span className={`h-2 w-2 rounded-full ${isUnread ? tone.dot : "bg-slate-300"}`} />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="flex items-baseline justify-between gap-2">
                                                                    <span className={`truncate text-[0.82rem] text-slate-800 ${isUnread ? "font-black" : "font-bold"}`}>{notification.title}</span>
                                                                    <span className="shrink-0 text-[0.65rem] font-bold text-slate-400">{relativeTime(notification.createdAt)}</span>
                                                                </span>
                                                                <span className="mt-0.5 block text-[0.72rem] leading-5 text-slate-500">{notification.body}</span>
                                                            </span>
                                                            {href ? <ArrowIcon /> : null}
                                                        </>
                                                    );

                                                    return (
                                                        <li
                                                            key={notification.id}
                                                            className="gpu-enter"
                                                            style={{ animationDelay: `${Math.min(index, 6) * 35}ms` }}
                                                        >
                                                            {href ? (
                                                                <Link href={href} onClick={() => { markNotificationRead(notification.id); setNotificationsOpen(false); }} className={`flex items-start gap-2.5 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-slate-50 ${isUnread ? "bg-blue-50/50" : ""}`}>
                                                                    {content}
                                                                </Link>
                                                            ) : (
                                                                <button type="button" onClick={() => markNotificationRead(notification.id)} className={`flex w-full cursor-pointer items-start gap-2.5 rounded-2xl px-2.5 py-2.5 text-left transition-colors hover:bg-slate-50 ${isUnread ? "bg-blue-50/50" : ""}`}>
                                                                    {content}
                                                                </button>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                                                <EmptyBell />
                                                <p className="text-sm font-black text-slate-600">You are all caught up</p>
                                                <p className="max-w-[16rem] text-xs leading-5 text-slate-400">New subject and assignment activity will appear here on this device.</p>
                                            </div>
                                        )}
                                    </div>
                            </div>
                        ) : null}
                    </div>

                    {isAdmin ? (
                        <button type="button" onClick={logout} title="Sign out of admin" className="group inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-black text-slate-600 shadow-sm transition-gpu hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.97] sm:h-10 sm:px-4 sm:text-sm">
                            <LogoutIcon /><span className="hidden sm:inline">Logout</span>
                        </button>
                    ) : (
                        <button type="button" onClick={openLogin} className="inline-flex h-9 cursor-pointer items-center rounded-full bg-slate-900 px-3 text-xs font-black tracking-[-0.02em] text-white shadow-md transition-transform hover:-translate-y-0.5 active:scale-[0.97] sm:h-10 sm:px-5 sm:text-sm">
                            Admin
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
