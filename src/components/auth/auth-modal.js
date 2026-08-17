"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EASE = [0.22, 1, 0.36, 1];
const LOGIN_PREFERENCE_KEY = "coursepilot-login-preferences";

function readLoginPreferences(initialIdentifier) {
    if (typeof window === "undefined") {
        return { identifier: initialIdentifier, rememberMe: false };
    }

    try {
        const saved = JSON.parse(window.localStorage.getItem(LOGIN_PREFERENCE_KEY) || "null");
        return {
            identifier: saved?.rememberMe && saved?.identifier ? saved.identifier : initialIdentifier,
            rememberMe: saved?.rememberMe === true,
        };
    } catch {
        return { identifier: initialIdentifier, rememberMe: false };
    }
}

function CloseIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[2]"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" /></svg>;
}

function UserIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[1.8]"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" /><path d="M5 20a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeLinecap="round" /></svg>;
}

function LockIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[1.8]"><rect x="5" y="10" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" /><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" fill="none" stroke="currentColor" strokeLinecap="round" /></svg>;
}

function ShieldIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[1.8]"><path d="M12 3 5.5 5.7v5.1c0 4.1 2.6 7.8 6.5 9.2 3.9-1.4 6.5-5.1 6.5-9.2V5.7L12 3Z" fill="none" stroke="currentColor" strokeLinejoin="round" /><path d="m9 11.5 2 2 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function EyeIcon({ visible }) {
    return visible ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[1.8]"><path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 0 0 3.8 3.8M7.4 7.6A9.7 9.7 0 0 0 2.5 12s3.5 6 9.5 6c1.8 0 3.4-.5 4.8-1.3M18.9 15A9.7 9.7 0 0 0 21.5 12S18 6 12 6c-1.2 0-2.3.2-3.3.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[1.8]"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" /></svg>
    );
}

function Spinner() {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 animate-spin"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity=".25" /><path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
}

export default function AuthModal({
    open,
    onClose,
    onLogin,
    initialIdentifier = "",
    title = "Welcome back",
    subtitle = "Sign in securely to manage subjects and assignments.",
}) {
    const identifierRef = useRef(null);
    const [defaults] = useState(() => readLoginPreferences(initialIdentifier));
    const [identifier, setIdentifier] = useState(defaults.identifier);
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(defaults.rememberMe);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const focusTimer = window.setTimeout(() => identifierRef.current?.focus(), 120);

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose, open]);

    const handleClose = () => {
        if (busy) return;
        setPassword("");
        setError("");
        onClose();
    };

    const submit = async (event) => {
        event.preventDefault();
        const cleanIdentifier = identifier.trim();

        if (!cleanIdentifier) {
            setError("Enter your admin email or username.");
            identifierRef.current?.focus();
            return;
        }

        if (!password) {
            setError("Enter your password.");
            return;
        }

        setBusy(true);
        setError("");

        try {
            const result = await onLogin({ identifier: cleanIdentifier, password, rememberMe });

            if (!result?.ok) {
                setError(result?.message || "Unable to sign in with those credentials.");
                setBusy(false);
                return;
            }

            if (rememberMe) {
                window.localStorage.setItem(LOGIN_PREFERENCE_KEY, JSON.stringify({ identifier: cleanIdentifier, rememberMe: true }));
            } else {
                window.localStorage.removeItem(LOGIN_PREFERENCE_KEY);
            }

            setPassword("");
            setBusy(false);
            onClose();
        } catch {
            setError("An unexpected error occurred. Check your connection and try again.");
            setBusy(false);
        }
    };

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="fixed inset-0 z-60 flex items-end justify-center bg-slate-950/45 px-2.5 py-3 backdrop-blur-[10px] sm:items-center sm:px-4 sm:py-8"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) handleClose();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: EASE }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-login-title"
                        className="relative max-h-[94vh] w-full max-w-[460px] overflow-y-auto rounded-[24px] border border-white/70 bg-white p-4.5 shadow-[0_40px_110px_rgba(15,23,42,0.28)] sm:rounded-[32px] sm:p-8"
                    >
                        <button type="button" onClick={handleClose} disabled={busy} className="absolute right-3.5 top-3.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:right-5 sm:top-5 sm:h-10 sm:w-10" aria-label="Close sign in">
                            <CloseIcon />
                        </button>

                        <div className="pr-11">
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.26)] sm:h-12 sm:w-12"><ShieldIcon /></div>
                            <p className="text-[0.62rem] font-black uppercase tracking-[0.26em] text-blue-600 sm:text-xs">Admin access</p>
                            <h2 id="admin-login-title" className="mt-1.5 text-[1.8rem] font-black tracking-[-0.055em] text-slate-900 sm:mt-2 sm:text-4xl">{title}</h2>
                            <p className="mt-2 max-w-md text-[0.8rem] leading-5.5 text-slate-500 sm:mt-3 sm:text-sm sm:leading-6">{subtitle}</p>
                        </div>

                        <form onSubmit={submit} className="mt-5 space-y-4 sm:mt-6 sm:space-y-5" noValidate>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-black text-slate-700 sm:mb-2 sm:text-sm">Email or username</span>
                                <span className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-400 shadow-sm transition-shadow focus-within:border-blue-300 focus-within:text-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.10)] sm:px-4 sm:py-3">
                                    <UserIcon />
                                    <input ref={identifierRef} type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="name@example.com" autoComplete="username" autoCapitalize="none" spellCheck="false" disabled={busy} className="min-w-0 w-full bg-transparent text-[0.88rem] font-semibold text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-70 sm:text-[0.98rem]" />
                                </span>
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-xs font-black text-slate-700 sm:mb-2 sm:text-sm">Password</span>
                                <span className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-400 shadow-sm transition-shadow focus-within:border-blue-300 focus-within:text-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.10)] sm:px-4 sm:py-3">
                                    <LockIcon />
                                    <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))} placeholder="Enter your password" autoComplete="current-password" disabled={busy} className="min-w-0 w-full bg-transparent text-[0.88rem] font-semibold text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-70 sm:text-[0.98rem]" />
                                    <button type="button" onClick={() => setShowPassword((current) => !current)} disabled={busy} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                                        <EyeIcon visible={showPassword} />
                                    </button>
                                </span>
                                {capsLock ? <span className="mt-1.5 block text-xs font-bold text-amber-600">Caps Lock is on</span> : null}
                            </label>

                            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 transition-colors hover:bg-slate-50">
                                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} disabled={busy} className="peer sr-only" />
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-300 bg-white text-white transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100">
                                    {rememberMe ? <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 stroke-[2.5]"><path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                                </span>
                                <span><span className="block text-xs font-black text-slate-700 sm:text-sm">Remember me on this device</span><span className="mt-0.5 block text-[0.68rem] leading-4.5 text-slate-500 sm:text-xs">Keeps your secure admin session for 30 days. Otherwise it ends when the browser session closes.</span></span>
                            </label>

                            {error ? <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs font-bold leading-5 text-rose-600 sm:text-sm">{error}</p> : null}

                            <button type="submit" disabled={busy} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-[0.88rem] font-black text-white shadow-[0_18px_35px_rgba(37,99,235,0.26)] transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-wait disabled:bg-blue-400 sm:py-3.5 sm:text-[0.98rem]">
                                {busy ? <><Spinner />Signing in securely...</> : "Sign in to CoursePilot"}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
