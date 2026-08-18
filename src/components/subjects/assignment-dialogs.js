"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import InlineCalendar from "@/components/inline-calendar";

const EASE = [0.22, 1, 0.36, 1];

function toDateInput(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function formatLong(value) {
    if (!value) {
        return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

function Shell({ open, onClose, title, subtitle, children, footer }) {
    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="fixed inset-0 z-60 grid min-h-[100dvh] place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ duration: 0.26, ease: EASE }}
                        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[520px] flex-col rounded-2xl border border-white/15 bg-white p-4 shadow-[0_40px_100px_rgba(15,23,42,0.24)] sm:p-7"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900 sm:text-3xl">
                                    {title}
                                </h2>
                                {subtitle ? (
                                    <p className="mt-1.5 text-sm leading-6 text-slate-500">{subtitle}</p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[2]">
                                    <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-5 min-h-0 flex-1 overflow-y-auto">{children}</div>

                        {footer ? <div className="mt-6 shrink-0">{footer}</div> : null}
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

export function EditAssignmentDialog({ open, assignment, onClose, onSave }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedDate, setAssignedDate] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Re-seed the form whenever a different assignment is opened, without an
    // effect: this is the documented "adjust state during render" pattern.
    const formKey = open ? (assignment?.id ?? null) : null;
    const [seededKey, setSeededKey] = useState(formKey);

    if (seededKey !== formKey) {
        setSeededKey(formKey);
        setTitle(assignment?.title ?? "");
        setDescription(assignment?.description ?? "");
        setAssignedDate(toDateInput(assignment?.assignedDate));
        setError("");
        setSaving(false);
    }

    const submit = async (event) => {
        event.preventDefault();

        if (!title.trim()) {
            setError("Assignment title is required.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await onSave({ title: title.trim(), description: description.trim(), assignedDate });
            onClose();
        } catch (saveError) {
            setError(saveError?.message ?? "Unable to save changes.");
            setSaving(false);
        }
    };

    return (
        <Shell open={open} onClose={onClose} title="Edit assignment" subtitle="Update the details for this assignment.">
            <form onSubmit={submit} className="space-y-4">
                <label className="block">
                    <span className="mb-1.5 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
                        Title
                    </span>
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Assignment title"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
                        Description
                    </span>
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Optional description"
                        className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
                    />
                </label>

                <InlineCalendar value={assignedDate} onChange={setAssignedDate} />

                {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}

                <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="cursor-pointer rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-[0_16px_32px_rgba(37,99,235,0.24)] transition-colors hover:bg-blue-700 disabled:bg-blue-300 disabled:shadow-none"
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </Shell>
    );
}

export function InfoAssignmentDialog({ open, assignment, subjectName, position, onClose }) {
    const rows = [
        { label: "Subject", value: subjectName ?? "—" },
        { label: "Position", value: position ? `#${position}` : "—" },
        { label: "Assigned date", value: formatLong(assignment?.assignedDate) },
        { label: "Description", value: assignment?.description || "No description provided." },
    ];

    return (
        <Shell open={open} onClose={onClose} title="Assignment info" subtitle={assignment?.title}>
            <dl className="space-y-3">
                {rows.map((row) => (
                    <div key={row.label} className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        <dt className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
                            {row.label}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold leading-6 break-words text-slate-700">{row.value}</dd>
                    </div>
                ))}
            </dl>
        </Shell>
    );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onClose }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [wasOpen, setWasOpen] = useState(open);

    if (wasOpen !== open) {
        setWasOpen(open);

        if (open) {
            setBusy(false);
            setError("");
        }
    }

    const confirm = async () => {
        setBusy(true);
        setError("");

        try {
            await onConfirm();
            onClose();
        } catch (confirmError) {
            setError(confirmError?.message ?? "Something went wrong.");
            setBusy(false);
        }
    };

    return (
        <Shell open={open} onClose={onClose} title={title} subtitle={message}>
            {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={busy}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={confirm}
                    disabled={busy}
                    className="cursor-pointer rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white shadow-[0_16px_32px_rgba(225,29,72,0.24)] transition-colors hover:bg-rose-700 disabled:bg-rose-300 disabled:shadow-none"
                >
                    {busy ? "Working..." : confirmLabel}
                </button>
            </div>
        </Shell>
    );
}
