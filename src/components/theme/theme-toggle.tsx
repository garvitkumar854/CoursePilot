"use client";

import { useEffect } from "react";

const STORAGE_KEY = "coursepilot-theme";
type Theme = "light" | "dark";

function applyTheme(theme: string | null): Theme {
    const nextTheme: Theme = theme === "dark" ? "dark" : "light";
    const root = document.documentElement;

    // Keep transition suppression active for the paint that contains the color
    // change. No layout read or synchronous React update is needed.
    root.classList.add("theme-switching");
    root.dataset.theme = nextTheme;
    root.classList.toggle("dark", nextTheme === "dark");
    root.style.colorScheme = nextTheme;

    requestAnimationFrame(() => root.classList.remove("theme-switching"));
    return nextTheme;
}

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[1.8]">
            <circle cx="12" cy="12" r="3.75" fill="none" stroke="currentColor" />
            <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[1.8]">
            <path d="M20 15.2A8.2 8.2 0 0 1 8.8 4a8.2 8.2 0 1 0 11.2 11.2Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function ThemeToggle() {
    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === STORAGE_KEY) applyTheme(event.newValue);
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const toggleTheme = () => {
        const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        const nextTheme = current === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle light and dark theme"
            title="Toggle light and dark theme"
            className="theme-toggle relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-blue-600 active:scale-95 sm:h-10 sm:w-10"
        >
            <span className="theme-sun absolute transition-all duration-300"><SunIcon /></span>
            <span className="theme-moon absolute transition-all duration-300"><MoonIcon /></span>
        </button>
    );
}
