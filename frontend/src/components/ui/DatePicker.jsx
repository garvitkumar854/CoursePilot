import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function DatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial value (YYYY-MM-DD)
  const selectedDate = value ? new Date(value + "T12:00:00") : new Date();
  
  // Current month/year view in calendar
  const [viewDate, setViewDate] = useState(selectedDate);

  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + "T12:00:00"));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // First day of current month (day of week: 0 for Sun, 1 for Mon, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Generate calendar grid
  const days = [];
  // Empty spaces for previous month's days
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    const formatted = date.toISOString().split("T")[0];
    onChange(formatted);
    setIsOpen(false);
  };

  const setPreset = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const formatted = d.toISOString().split("T")[0];
    onChange(formatted);
    setIsOpen(false);
  };

  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const formattedSelected = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl border border-[#dbe4ee] bg-[#f8fbff] px-4 py-3 text-left text-[#0f172a] outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10 cursor-pointer"
      >
        <span className="text-sm font-medium">{formattedSelected}</span>
        <CalendarIcon className="h-5 w-5 text-[#64748b]" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-80 rounded-[24px] border border-[#e2e8f0] bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.15)]">
          {/* Presets */}
          <div className="mb-3 flex gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setPreset(0)}
              className="flex-1 rounded-lg bg-slate-50 py-1.5 text-xs font-semibold text-[#0f172a] transition hover:bg-slate-100 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPreset(1)}
              className="flex-1 rounded-lg bg-slate-50 py-1.5 text-xs font-semibold text-[#0f172a] transition hover:bg-slate-100 cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                const day = d.getDay();
                const offset = (8 - day) % 7 || 7;
                setPreset(offset);
              }}
              className="flex-1 rounded-lg bg-slate-50 py-1.5 text-xs font-semibold text-[#0f172a] transition hover:bg-slate-100 cursor-pointer"
            >
              Next Mon
            </button>
          </div>

          {/* Month/Year selector header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-[#0f172a]">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#64748b] mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} />;
              }

              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`aspect-square rounded-full text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? "bg-[#2563eb] text-white"
                      : isToday
                      ? "bg-blue-50 text-[#2563eb] border border-[#2563eb]/20"
                      : "text-[#0f172a] hover:bg-slate-50"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
