"use client";

import { useMemo, useState } from "react";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const fullDateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "full" });

function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfCalendarGrid(month: Date): Date {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  return new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
}

export type InlineCalendarProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  label?: string;
}>;

export function InlineCalendar({
  value,
  onChange,
  min,
  max,
  label = "Assigned date",
}: InlineCalendarProps) {
  const selected = parseDateKey(value);
  const initialMonth = selected ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );

  const days = useMemo(() => {
    const first = startOfCalendarGrid(visibleMonth);
    return Array.from({ length: 42 }, (_, index) =>
      new Date(first.getFullYear(), first.getMonth(), first.getDate() + index),
    );
  }, [visibleMonth]);

  const today = dateKey(new Date());
  const selectedKey = selected ? dateKey(selected) : "";
  const monthLabel = monthFormatter.format(visibleMonth);

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
      <legend className="px-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </legend>

      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-lg text-slate-600 transition-all duration-200 hover:border-blue-300 hover:text-blue-600 active:scale-95"
          aria-label="Previous month"
        >
          ‹
        </button>
        <output className="font-poppins min-w-0 truncate text-center text-sm font-bold text-slate-900 sm:text-base">
          {monthLabel}
        </output>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-lg text-slate-600 transition-all duration-200 hover:border-blue-300 hover:text-blue-600 active:scale-95"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7" aria-hidden="true">
        {weekdays.map((day) => (
          <span key={day} className="py-1.5 text-center text-[0.62rem] font-black uppercase text-slate-400 sm:text-[0.68rem]">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1" role="grid" aria-label={monthLabel}>
        {days.map((day) => {
          const key = dateKey(day);
          const outsideMonth = day.getMonth() !== visibleMonth.getMonth();
          const disabled = Boolean((min && key < min) || (max && key > max));
          const active = key === selectedKey;

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              disabled={disabled}
              aria-selected={active}
              aria-label={fullDateFormatter.format(day)}
              onClick={() => onChange(key)}
              className={`aspect-square min-h-10 rounded-xl text-xs font-bold transition-all duration-200 sm:min-h-11 sm:text-sm ${
                active
                  ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)]"
                  : key === today
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : outsideMonth
                      ? "text-slate-300 hover:bg-white hover:text-slate-500"
                      : "text-slate-700 hover:bg-white hover:text-blue-600"
              } disabled:pointer-events-none disabled:opacity-30`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default InlineCalendar;
