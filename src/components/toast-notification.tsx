"use client";

import { useEffect, type ReactNode } from "react";

export type ToastTone = "success" | "info" | "warning" | "error";

export type ToastNotificationProps = Readonly<{
  id: string;
  title: string;
  message?: string;
  tone?: ToastTone;
  duration?: number;
  exiting?: boolean;
  action?: ReactNode;
  onDismiss: (id: string) => void;
}>;

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-200 text-emerald-700",
  info: "border-blue-200 text-blue-700",
  warning: "border-amber-200 text-amber-700",
  error: "border-rose-200 text-rose-700",
};

export function ToastNotification({
  id,
  title,
  message,
  tone = "info",
  duration = 4_000,
  exiting = false,
  action,
  onDismiss,
}: ToastNotificationProps) {
  useEffect(() => {
    if (duration <= 0 || exiting) return;

    const timer = window.setTimeout(() => onDismiss(id), duration);
    return () => window.clearTimeout(timer);
  }, [duration, exiting, id, onDismiss]);

  return (
    <article
      role={tone === "error" ? "alert" : "status"}
      aria-atomic="true"
      data-state={exiting ? "closed" : "open"}
      className={`toast-notification pointer-events-none grid min-h-20 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-card border bg-white/95 p-3.5 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur-xl ${toneStyles[tone]}`}
    >
      <span
        className="mt-1 size-2.5 shrink-0 rounded-full bg-current shadow-[0_0_0_5px_currentColor] opacity-75"
        aria-hidden="true"
      />
      <span className="min-w-0 text-slate-900">
        <strong className="font-poppins block text-sm font-semibold leading-5">
          {title}
        </strong>
        {message ? (
          <span className="mt-0.5 block text-xs leading-5 text-slate-500">
            {message}
          </span>
        ) : null}
        {action ? <span className="pointer-events-auto mt-2 block">{action}</span> : null}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="pointer-events-auto -mr-1 -mt-1 grid size-8 cursor-pointer place-items-center rounded-full text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={`Dismiss ${title}`}
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="m7 7 10 10M17 7 7 17"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </button>
    </article>
  );
}

/** Fixed stacking context; it never participates in application layout. */
export function ToastViewport({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <aside
      className="toast-viewport pointer-events-none fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] ml-auto flex w-auto max-w-sm flex-col gap-2.5 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[min(24rem,calc(100vw-2.5rem))]"
      aria-label="Notifications"
      aria-live="polite"
    >
      {children}
    </aside>
  );
}

export default ToastNotification;
