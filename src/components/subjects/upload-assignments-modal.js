"use client";

import { useMemo, useRef, useState } from "react";
import {
    IMPORT_FORMAT_SAMPLE,
    groupAssignmentsByDate,
    parseAssignmentFile,
    validateImportAssignments,
} from "@/lib/assignment-import";

function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 stroke-[1.9]">
            <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function UploadIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[2]">
            <path
                d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function DropZoneIcon() {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-14 w-14 overflow-visible">
            <path d="M18 48h29a11 11 0 0 0 1.6-21.9A18 18 0 0 0 14 21.8 13.5 13.5 0 0 0 18 48Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" opacity=".65" />
            <g className="upload-arrow">
                <path d="M32 42V23m0 0-7 7m7-7 7 7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
            </g>
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[1.8]">
            <path
                d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l.8 11.1A1.5 1.5 0 0 0 8.8 19.5h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function WarningIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.9]">
            <path
                d="M12 8.5v4.5M12 16.5h.01M10.7 3.9 2.9 17.4A1.5 1.5 0 0 0 4.2 19.6h15.6a1.5 1.5 0 0 0 1.3-2.2L13.3 3.9a1.5 1.5 0 0 0-2.6 0Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function Field({ label, className = "", ...props }) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1.5 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
                {label}
            </span>
            <input
                {...props}
                className="rounded-control w-full border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
            />
        </label>
    );
}

function PreviewRow({ assignment, index, onChange, onRemove }) {
    // Uncontrolled rows: every field is a native input seeded with
    // `defaultValue`. Edits are written straight into the draft record (a
    // ref-owned object) on input — React does not render at all for
    // keystrokes, so a 40-row import costs one paint per character, not 40
    // re-renders plus layout animation.
    return (
        <div className="gpu-enter rounded-control border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                    {index + 1}
                </span>

                <div className="min-w-0 flex-1 space-y-2.5">
                    <Field
                        label="Title"
                        defaultValue={assignment.title}
                        placeholder="Assignment title"
                        onInput={(event) => onChange({ title: event.currentTarget.value })}
                    />
                    <Field
                        label="Description"
                        defaultValue={assignment.description}
                        placeholder="Optional description"
                        onInput={(event) => onChange({ description: event.currentTarget.value })}
                    />
                    <Field
                        label="Assigned date"
                        type="date"
                        defaultValue={assignment.assignedDate}
                        onChange={(event) => onChange({ assignedDate: event.target.value })}
                        className="max-w-[190px]"
                    />
                </div>

                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${assignment.title || "assignment"}`}
                    className="mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-rose-200 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
}

export default function UploadAssignmentsModal({ open, subjectName, subjectSlug, onClose, onImport }) {
    const fileInputRef = useRef(null);
    // Draft records are ref-owned so rows can mutate them in place on input
    // without a single React render per keystroke. `assignments` is a
    // structural mirror of the ref that render reads: it is only replaced
    // (via `commitList`) when the list structure actually changes — file
    // parse, row removal, or a date edit that re-groups.
    const assignmentsRef = useRef([]);
    const [assignments, setAssignments] = useState([]);
    const [fileName, setFileName] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [parseErrors, setParseErrors] = useState([]);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasPreview = assignments.length > 0;

    const groups = useMemo(() => groupAssignmentsByDate(assignments), [assignments]);

    // Flat key → index lookup so row badges stay O(n) per structural render
    // instead of the previous O(n²) findIndex-per-row.
    const rowIndexByKey = useMemo(() => {
        const map = new Map();
        assignments.forEach((assignment, index) => map.set(assignment.key, index));
        return map;
    }, [assignments]);

    const commitList = (next) => {
        assignmentsRef.current = next;
        setAssignments(next);
    };

    const reset = () => {
        commitList([]);
        setFileName("");
        setIsDragging(false);
        setParseErrors([]);
        setFormError("");
        setIsSubmitting(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClose = () => {
        if (isSubmitting) {
            return;
        }

        reset();
        onClose?.();
    };

    const processFile = async (file) => {
        setFormError("");
        setFileName(file.name);

        try {
            const text = await file.text();
            const { assignments: parsed, errors } = parseAssignmentFile(text);

            commitList(parsed);
            setParseErrors(errors);
        } catch {
            commitList([]);
            setParseErrors([{ line: 0, message: "That file could not be read as text." }]);
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (file) await processFile(file);
    };

    const handleDrop = async (event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) await processFile(file);
    };

    const updateAssignment = (key, patch) => {
        setFormError("");
        const target = assignmentsRef.current.find((assignment) => assignment.key === key);
        if (!target) return;

        Object.assign(target, patch);
        // Only a date change affects grouping; title/description edits need
        // no render at all (the native input already shows the new text).
        if (patch.assignedDate !== undefined) {
            // New array identity (same records) so `groups` recomputes and
            // the edited row re-groups under the correct date section.
            commitList(assignmentsRef.current.slice());
        }
    };

    const removeAssignment = (key) => {
        setFormError("");
        commitList(assignmentsRef.current.filter((assignment) => assignment.key !== key));
    };

    const handleImport = async () => {
        const draft = assignmentsRef.current;
        const errors = validateImportAssignments(draft);

        if (errors.length) {
            setFormError(errors[0]);
            return;
        }

        // Send them ordered by date, then by their position in the file.
        const ordered = groups.flatMap((group) => group.assignments);

        setIsSubmitting(true);
        setFormError("");

        try {
            await onImport?.(
                subjectSlug,
                ordered.map((assignment, index) => ({
                    number: index + 1,
                    title: assignment.title.trim(),
                    description: assignment.description.trim(),
                    assignedDate: assignment.assignedDate,
                })),
            );

            reset();
            onClose?.();
        } catch (error) {
            setFormError(error?.message ?? "Import failed. Please try again.");
            setIsSubmitting(false);
        }
    };

    // Enter motion is pure CSS (`.gpu-fade` / `.gpu-enter-scale` /
    // `.gpu-enter`). No framer `layout`, no `height: auto` measurement —
    // list structure changes re-render plain DOM only.
    return open ? (
        <div
            className="modal-backdrop gpu-fade fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain p-3 sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                className={`gpu-enter-scale modal-surface rounded-card relative my-auto flex max-h-[calc(100dvh-1.5rem)] w-full flex-col border border-white/15 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:max-h-[calc(100dvh-2.5rem)] sm:p-6 ${hasPreview ? "max-w-[42rem]" : "max-w-[34rem]"
                    }`}
            >
                <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-control absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:right-4 sm:top-4"
                    aria-label="Close modal"
                >
                    <CloseIcon />
                </button>

                <div className="shrink-0 pr-10">
                    <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-900 sm:text-xl">
                        Upload assignments
                    </h2>
                    <p className="mt-1.5 text-[0.8rem] leading-5 text-slate-500 sm:text-sm sm:leading-6">
                        {hasPreview
                            ? `Review and edit before importing into ${subjectName ?? "this subject"}.`
                            : "Import multiple assignments from one formatted text file."}
                    </p>
                </div>

                <div className="contain-scroll mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <span className="mb-2 block text-[0.7rem] font-black uppercase tracking-[0.2em] text-slate-400">
                                Text file
                            </span>
                            <label
                                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                                onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setIsDragging(true); }}
                                onDragLeave={(event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
                                }}
                                onDrop={handleDrop}
                                className={`group grid min-h-52 cursor-pointer place-items-center rounded-card border-2 border-dashed p-5 text-center transition-gpu duration-200 ${isDragging ? "border-blue-500 bg-blue-50 text-blue-600 shadow-[0_0_0_5px_rgba(59,130,246,0.10)]" : "border-slate-300 bg-slate-50/70 text-slate-500 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"}`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.md,.csv,text/plain"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                                <span className="flex flex-col items-center">
                                    <span className="drop-zone-icon rounded-control grid size-16 place-items-center bg-white shadow-[0_14px_35px_rgba(15,23,42,0.10)] transition-transform duration-200 group-hover:-translate-y-1">
                                        <DropZoneIcon />
                                    </span>
                                    <strong className="font-poppins mt-4 text-base font-bold text-slate-800">
                                        {isDragging ? "Release to upload" : "Drop your assignment file here"}
                                    </strong>
                                    <span className="mt-1.5 text-xs leading-5 text-slate-500">
                                        or tap to browse · TXT, Markdown, or CSV
                                    </span>
                                </span>
                            </label>
                            {fileName ? (
                                <p className="mt-2 text-xs font-semibold text-slate-400">
                                    Parsed <span className="text-slate-600">{fileName}</span>
                                    {hasPreview
                                        ? ` — ${assignments.length} assignment${assignments.length === 1 ? "" : "s"} across ${groups.length} date${groups.length === 1 ? "" : "s"}.`
                                        : ""}
                                </p>
                            ) : null}
                        </div>

                        {parseErrors.length ? (
                            <div className="gpu-enter">
                                <div className="rounded-control border border-amber-200 bg-amber-50 p-3.5">
                                    <p className="flex items-center gap-2 text-sm font-black text-amber-800">
                                        <WarningIcon />
                                        {parseErrors.length} line{parseErrors.length === 1 ? "" : "s"} could not be read
                                    </p>
                                    <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-700">
                                        {parseErrors.slice(0, 5).map((error) => (
                                            <li key={`${error.line}-${error.message}`}>{error.message}</li>
                                        ))}
                                        {parseErrors.length > 5 ? (
                                            <li>...and {parseErrors.length - 5} more.</li>
                                        ) : null}
                                    </ul>
                                </div>
                            </div>
                        ) : null}

                        {hasPreview ? (
                            <div className="gpu-enter space-y-4">
                                {groups.map((group) => (
                                    <section key={group.date} className="space-y-2.5">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <p className="text-sm font-black tracking-[-0.02em] text-slate-800">
                                                {group.label}
                                            </p>
                                            <p className="text-xs font-bold text-slate-400">
                                                {group.assignments.length} assignment
                                                {group.assignments.length === 1 ? "" : "s"}
                                            </p>
                                        </div>

                                        {group.assignments.map((assignment) => (
                                            <PreviewRow
                                                key={assignment.key}
                                                assignment={assignment}
                                                index={rowIndexByKey.get(assignment.key) ?? 0}
                                                onChange={(patch) => updateAssignment(assignment.key, patch)}
                                                onRemove={() => removeAssignment(assignment.key)}
                                            />
                                        ))}
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <div className="gpu-enter rounded-control border border-slate-200 bg-slate-50/70 p-3.5">
                                <p className="text-sm font-black text-slate-700">Required format</p>
                                <pre className="mt-2.5 overflow-x-auto whitespace-pre text-[0.72rem] leading-5 text-slate-500">
                                    {IMPORT_FORMAT_SAMPLE}
                                </pre>
                                <p className="mt-3 text-xs leading-5 text-slate-400">
                                    Date sections may appear in any order. Imported assignments are validated
                                    first, then the full subject list is ordered by date and the sequence in
                                    this file.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 shrink-0">
                    {formError ? (
                        <p className="gpu-enter mb-3 text-sm font-bold text-rose-600">
                            {formError}
                        </p>
                    ) : null}

                    <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="rounded-control min-h-11 cursor-pointer border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={!hasPreview || isSubmitting}
                            className="rounded-control inline-flex min-h-11 cursor-pointer items-center gap-2 bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.2)] transition-gpu hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
                        >
                            <UploadIcon />
                            {isSubmitting
                                ? "Importing..."
                                : hasPreview
                                    ? `Import ${assignments.length} assignment${assignments.length === 1 ? "" : "s"}`
                                    : "Import assignments"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;
}
