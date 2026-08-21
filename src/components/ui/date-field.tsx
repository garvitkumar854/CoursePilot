"use client";

import { useEffect, useId, useRef, useState } from "react";

import InlineCalendar from "@/components/inline-calendar";

export type DateFieldProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  /** Optional hidden input name so the value is part of FormData. */
  name?: string;
  label?: string;
  min?: string;
  max?: string;
}>;

function formatDisplay(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Select a date";

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * ONE compact calendar trigger.
 *
 * The previous Add Assignment form shipped two controls for the same value: a
 * native `<input type="date">` *and* a full-width "Choose from calendar"
 * button that expanded a second oversized calendar. This field is a single
 * row — the formatted date plus an inline calendar icon — that toggles one
 * calendar panel. Full date-picker functionality is preserved.
 */
export function DateField({
  value,
  onChange,
  name,
  label = "Assigned date",
  min,
  max,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && !containerRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <span id={`${id}-label`} className="mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>

      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${id}-value`}
        className="rounded-control flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 border border-slate-200 bg-white px-3 text-left transition-shadow hover:border-slate-300 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)] focus:outline-none"
      >
        <span
          id={`${id}-value`}
          className={`truncate text-sm ${value ? "font-medium text-slate-800" : "font-normal text-slate-400"}`}
        >
          {formatDisplay(value)}
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 shrink-0 stroke-[1.8] text-slate-400">
          <rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" />
          <path d="M8 3.5v3M16 3.5v3M3.5 10h17" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="mt-2">
          <InlineCalendar
            value={value}
            min={min}
            max={max}
            label={label}
            onChange={(next) => {
              onChange(next);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default DateField;
