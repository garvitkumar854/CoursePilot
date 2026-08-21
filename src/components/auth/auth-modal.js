"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { readClientCookie, removeClientCookie, writeClientCookie } from "@/lib/client-cookie";

const LOGIN_PREFERENCE_KEY = "coursepilot-login-preferences";
const REMEMBER_ME_COOKIE = "coursepilot-remember-me";

function readLoginPreferences(initialIdentifier) {
    if (typeof window === "undefined") {
        return { identifier: initialIdentifier, rememberMe: false };
    }

    try {
        // Cookie records only the opt-in state for 30 days. The identifier stays
        // in local storage so it is not sent to the server with every request.
        const saved = JSON.parse(window.localStorage.getItem(LOGIN_PREFERENCE_KEY) || "null");
        const rememberMe = readClientCookie(REMEMBER_ME_COOKIE) === "true";
        return {
            identifier: rememberMe && saved?.identifier ? saved.identifier : initialIdentifier,
            rememberMe,
        };
    } catch {
        return { identifier: initialIdentifier, rememberMe: false };
    }
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
    // Text inputs are fully uncontrolled: keystrokes live inside the native
    // DOM node and are read from refs once, on submit. No React render runs
    // per character.
    const identifierRef = useRef(null);
    const passwordRef = useRef(null);
    const rememberRef = useRef(null);
    const [defaults] = useState(() => readLoginPreferences(initialIdentifier));
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    // Scroll lock, Escape handling and centering live in the shared portal
    // `Modal`; this effect only moves focus into the first field.
    useEffect(() => {
        if (!open) return;

        const focusTimer = window.setTimeout(() => identifierRef.current?.focus(), 120);
        return () => window.clearTimeout(focusTimer);
    }, [open]);

    const handleClose = () => {
        if (busy) return;
        // Uncontrolled inputs own their value; clear the credential node
        // directly instead of routing it through React state.
        if (passwordRef.current) {
            passwordRef.current.value = "";
        }
        setError("");
        onClose();
    };

    const submit = async (event) => {
        event.preventDefault();
        const cleanIdentifier = (identifierRef.current?.value ?? "").trim();
        const password = passwordRef.current?.value ?? "";
        const rememberMe = rememberRef.current?.checked ?? false;

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
                window.localStorage.setItem(LOGIN_PREFERENCE_KEY, JSON.stringify({ identifier: cleanIdentifier }));
                writeClientCookie(REMEMBER_ME_COOKIE, "true");
            } else {
                window.localStorage.removeItem(LOGIN_PREFERENCE_KEY);
                removeClientCookie(REMEMBER_ME_COOKIE);
            }

            if (passwordRef.current) {
                passwordRef.current.value = "";
            }
            setBusy(false);
            onClose();
        } catch {
            setError("An unexpected error occurred. Check your connection and try again.");
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            dismissible={!busy}
            size="sm"
            labelledBy="admin-login-title"
            closeLabel="Close sign in"
            header={
                <div className="pr-10">
                    <div className="rounded-control mb-3 flex h-10 w-10 items-center justify-center bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]">
                        <ShieldIcon />
                    </div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-blue-600">Admin access</p>
                    <h2 id="admin-login-title" className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900 sm:text-xl">{title}</h2>
                    <p className="mt-1.5 max-w-md text-[0.8rem] leading-5 text-slate-500 sm:text-sm">{subtitle}</p>
                </div>
            }
        >
            <form onSubmit={submit} className="space-y-3" noValidate>
                <label className="block">
                    <span className="mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">Email or username</span>
                    <span className="rounded-control flex min-h-11 items-center gap-2.5 border border-slate-200 bg-white px-3 text-slate-400 shadow-sm transition-shadow focus-within:border-blue-400 focus-within:text-blue-500 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
                        <UserIcon />
                        <input ref={identifierRef} type="text" name="identifier" defaultValue={defaults.identifier} placeholder="name@example.com" autoComplete="username" autoCapitalize="none" spellCheck="false" disabled={busy} className="w-full min-w-0 bg-transparent text-sm font-normal text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-70" />
                    </span>
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">Password</span>
                    <span className="rounded-control flex min-h-11 items-center gap-2.5 border border-slate-200 bg-white px-3 text-slate-400 shadow-sm transition-shadow focus-within:border-blue-400 focus-within:text-blue-500 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
                        <LockIcon />
                        {/* `onKeyUp` only flips the Caps Lock hint; React bails
                            out when the modifier state is unchanged, so no
                            render is produced for ordinary keystrokes. */}
                        <input ref={passwordRef} type={showPassword ? "text" : "password"} name="password" defaultValue="" onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))} placeholder="Enter your password" autoComplete="current-password" disabled={busy} className="w-full min-w-0 bg-transparent text-sm font-normal text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-70" />
                        <button type="button" onClick={() => setShowPassword((current) => !current)} disabled={busy} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                            <EyeIcon visible={showPassword} />
                        </button>
                    </span>
                    {capsLock ? <span className="mt-1.5 block text-xs font-medium text-amber-600">Caps Lock is on</span> : null}
                </label>

                <label className="rounded-control flex cursor-pointer items-start gap-2.5 border border-slate-200 bg-slate-50/60 p-2.5 transition-colors hover:bg-slate-50">
                    <input ref={rememberRef} type="checkbox" name="rememberMe" defaultChecked={defaults.rememberMe} disabled={busy} className="peer sr-only" />
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-300 bg-white text-white transition-gpu peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100 [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100">
                        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 stroke-[2.5]"><path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    <span>
                        <span className="block text-[0.82rem] font-medium text-slate-700 sm:text-sm">Remember me on this device</span>
                        <span className="mt-0.5 block text-[0.68rem] leading-4 text-slate-500 sm:text-xs">Keeps your admin session for 30 days. Otherwise it ends with the browser session.</span>
                    </span>
                </label>

                {error ? <p role="alert" className="rounded-control border border-rose-100 bg-rose-50 px-3 py-2 text-[0.8rem] font-medium leading-5 text-rose-600 sm:text-sm">{error}</p> : null}

                <button type="submit" disabled={busy} className="rounded-control inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(37,99,235,0.22)] transition-gpu hover:bg-blue-700 active:scale-[0.99] disabled:cursor-wait disabled:bg-blue-400">
                    {busy ? <><Spinner />Signing in securely...</> : "Sign in to CoursePilot"}
                </button>
            </form>
        </Modal>
    );
}
