"use client";

import { useEffect } from "react";

const STORAGE_KEY = "coursepilot-theme";
const NO_TRANSITIONS_CLASS = "no-transitions";
type Theme = "light" | "dark";

function applyTheme(theme: string | null): Theme {
    const nextTheme: Theme = theme === "dark" ? "dark" : "light";
    const root = document.documentElement;

    // 1. Suppress every CSS transition/animation in the tree (see
    //    `.no-transitions *` in globals.css) so the swap commits as one paint.
    root.classList.add(NO_TRANSITIONS_CLASS);

    // 2. Switch the theme attributes. No React state, no layout read.
    root.dataset.theme = nextTheme;
    root.classList.toggle("dark", nextTheme === "dark");
    root.style.colorScheme = nextTheme;

    // 3. Force a single style/layout pass while suppression is active. This
    //    locks the new colors into computed style before any transition can
    //    start, so the whole switch lands in one frame (well under 8ms).
    void root.offsetHeight;

    // 4. Re-enable transitions on the next microtask. Nothing fades after
    //    this: the color change was already committed in step 3, so there is
    //    no trailing animation to catch up with the click.
    window.setTimeout(() => root.classList.remove(NO_TRANSITIONS_CLASS), 0);

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
            className="theme-toggle relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-blue-600 active:scale-95 sm:h-10 sm:w-10"
        >
            {/* Sun/moon crossfade is declared once in globals.css (`.theme-toggle
                .theme-sun/.theme-moon`) and only animates transform + opacity. */}
            <span className="theme-sun absolute"><SunIcon /></span>
            <span className="theme-moon absolute"><MoonIcon /></span>
        </button>
    );
}
