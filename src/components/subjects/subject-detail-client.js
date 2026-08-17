"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/admin-provider";
import AssignmentRow from "@/components/subjects/assignment-row";
import {
    ConfirmDialog,
    EditAssignmentDialog,
    InfoAssignmentDialog,
} from "@/components/subjects/assignment-dialogs";

const EASE = [0.22, 1, 0.36, 1];

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 stroke-[1.9] text-slate-400">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" />
            <path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function ChevronGlyph({ open }) {
    return (
        <motion.svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 stroke-2"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3, ease: EASE }}
        >
            <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
    );
}

function GroupCard({
    group,
    isOpen,
    onToggle,
    query,
    isAdmin,
    isReordering,
    onReorderGroup,
    onEdit,
    onInfo,
    onDelete,
}) {
    // While reordering we always show the full list: filtering mid-drag would
    // make the dropped position ambiguous.
    const normalizedQuery = query.trim().toLowerCase();
    const filteredAssignments =
        isReordering || !normalizedQuery
            ? group.assignments
            : group.assignments.filter((assignment) =>
                `${assignment.title} ${assignment.description ?? ""}`.toLowerCase().includes(normalizedQuery),
            );

    if (!filteredAssignments.length) {
        return null;
    }

    return (
        <motion.section
            layout
            transition={{ layout: { duration: 0.34, ease: EASE } }}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:rounded-3xl"
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/70 sm:gap-4 sm:px-6 sm:py-4"
            >
                <div className="min-w-0">
                    <p className="truncate text-[0.9rem] font-black tracking-[-0.02em] text-slate-800 sm:text-[0.95rem]">
                        {group.label}
                    </p>
                    <p className="mt-1 text-[0.8rem] font-semibold text-slate-400 sm:text-sm">
                        {filteredAssignments.length} Assignment{filteredAssignments.length === 1 ? "" : "s"}
                    </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                    <ChevronGlyph open={isOpen} />
                </span>
            </button>

            <AnimatePresence initial={false}>
                {isOpen ? (
                    <motion.div
                        key="group-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            height: { duration: 0.34, ease: EASE },
                            opacity: { duration: 0.22, ease: "easeOut" },
                        }}
                        style={{ overflow: isReordering ? "visible" : "hidden" }}
                    >
                        <Reorder.Group
                            axis="y"
                            as="ul"
                            values={filteredAssignments}
                            onReorder={(next) => onReorderGroup(group.label, next)}
                            className="relative"
                        >
                            {filteredAssignments.map((assignment, assignmentIndex) => (
                                <AssignmentRow
                                    key={assignment.id}
                                    assignment={assignment}
                                    index={assignmentIndex}
                                    isAdmin={isAdmin}
                                    isReordering={isReordering}
                                    onEdit={onEdit}
                                    onInfo={onInfo}
                                    onDelete={onDelete}
                                />
                            ))}
                        </Reorder.Group>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.section>
    );
}

export default function SubjectDetailClient({ subject, slug }) {
    const searchParams = useSearchParams();
    const targetAssignmentId = searchParams.get("assignment");
    const {
        isAdmin,
        openAddAssignment,
        openUploadAssignments,
        subjects,
        deleteAssignment,
        updateAssignment,
        reorderAssignments,
    } = useAdmin();

    const [query, setQuery] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [openGroups, setOpenGroups] = useState({});
    const [isReordering, setIsReordering] = useState(false);
    const [draftGroups, setDraftGroups] = useState(null);
    const [savingOrder, setSavingOrder] = useState(false);
    const [actionError, setActionError] = useState("");
    const [dialog, setDialog] = useState(null);

    const serverSubject = useMemo(
        () => subjects.find((item) => item.slug === slug) ?? subject,
        [subjects, slug, subject],
    );

    const [openGroupsSubject, setOpenGroupsSubject] = useState(serverSubject.slug);

    if (openGroupsSubject !== serverSubject.slug) {
        setOpenGroupsSubject(serverSubject.slug);
        setOpenGroups({});
        setDraftGroups(null);
        setIsReordering(false);
    }

    // While reordering the UI renders a local draft so drags feel instant and
    // nothing is persisted until the admin explicitly saves.
    const dateGroups = draftGroups ?? serverSubject.dateGroups ?? [];

    useEffect(() => {
        if (!targetAssignmentId) return;

        const targetGroup = (serverSubject.dateGroups ?? []).find((group) =>
            group.assignments.some((assignment) => assignment.id === targetAssignmentId),
        );

        if (!targetGroup) return;

        let scrollTimer;
        const openTimer = window.setTimeout(() => {
            setOpenGroups((current) => ({ ...current, [targetGroup.label]: true }));
            scrollTimer = window.setTimeout(() => {
                const element = document.getElementById(`assignment-${targetAssignmentId}`);
                element?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 380);
        }, 0);

        return () => {
            window.clearTimeout(openTimer);
            window.clearTimeout(scrollTimer);
        };
    }, [serverSubject.dateGroups, targetAssignmentId]);

    const handleToggleGroup = (label) => {
        setOpenGroups((current) => ({ ...current, [label]: !current[label] }));
    };

    const startReordering = () => {
        setActionError("");
        setDraftGroups((serverSubject.dateGroups ?? []).map((group) => ({ ...group, assignments: [...group.assignments] })));
        setIsReordering(true);
        setQuery("");

        // Every group must be visible to drag between positions.
        const allOpen = {};
        (serverSubject.dateGroups ?? []).forEach((group) => {
            allOpen[group.label] = true;
        });
        setOpenGroups(allOpen);
    };

    const cancelReordering = () => {
        setDraftGroups(null);
        setIsReordering(false);
        setActionError("");
    };

    const handleReorderGroup = (label, nextAssignments) => {
        setDraftGroups((current) =>
            (current ?? []).map((group) =>
                group.label === label ? { ...group, assignments: nextAssignments } : group,
            ),
        );
    };

    const saveOrder = async () => {
        const orderedIds = dateGroups.flatMap((group) => group.assignments.map((assignment) => assignment.id));

        setSavingOrder(true);
        setActionError("");

        try {
            await reorderAssignments(serverSubject.slug, orderedIds);
            setDraftGroups(null);
            setIsReordering(false);
        } catch (error) {
            setActionError(error?.message ?? "Unable to save the new order.");
        } finally {
            setSavingOrder(false);
        }
    };

    const handleCopySubject = async () => {
        let textToCopy = `Assignments for ${serverSubject.name}:\n\n`;

        if (dateGroups.length > 0) {
            dateGroups.forEach((group) => {
                textToCopy += `[${group.label}]\n`;
                group.assignments.forEach((assignment, index) => {
                    textToCopy += ` ${index + 1}. ${assignment.title}\n`;
                });
                textToCopy += `\n`;
            });
        } else {
            textToCopy += "No assignments yet.\n";
        }

        textToCopy = textToCopy.trim();

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                throw new Error("Clipboard API unavailable");
            }
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand("copy");
            } catch (err) {
                console.error("Fallback copy failed", err);
            } finally {
                textArea.remove();
            }
        }

        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const positionOf = (assignmentId) => {
        const flat = dateGroups.flatMap((group) => group.assignments);
        const index = flat.findIndex((assignment) => assignment.id === assignmentId);
        return index === -1 ? null : index + 1;
    };

    const hasAnyAssignments = dateGroups.some((group) => group.assignments.length > 0);

    return (
        <main className="min-h-screen px-2.5 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto flex w-full flex-col gap-3.5 sm:gap-5" style={{ maxWidth: 1180 }}>
                <section className="subject-hero relative overflow-hidden rounded-[22px] border border-white/70 bg-(--panel) px-3.5 py-4 shadow-[0_20px_70px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:rounded-[34px] sm:px-8 sm:py-7">
                    <div
                        className="pointer-events-none absolute -right-12 top-6 h-36 w-36 rounded-full blur-3xl"
                        style={{ backgroundColor: serverSubject.tint }}
                    />
                    <div className="relative flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0 max-w-3xl">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-slate-500 shadow-sm transition-transform hover:-translate-y-0.5 sm:gap-2 sm:px-3 sm:text-xs sm:tracking-[0.18em]"
                            >
                                ← Back to Subjects
                            </Link>
                            <h1 className="mt-3 break-words text-[1.7rem] font-black leading-[1.05] tracking-[-0.055em] text-slate-900 sm:mt-4 sm:text-5xl lg:text-6xl">
                                {serverSubject.name}
                            </h1>
                        </div>

                        <div className="flex flex-col items-start gap-3 lg:items-end">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className="rounded-full px-3 py-1.5 text-[0.72rem] font-extrabold text-white shadow-[0_14px_30px_rgba(59,130,246,0.25)] sm:px-4 sm:py-2 sm:text-sm"
                                    style={{ backgroundColor: serverSubject.accentColor }}
                                >
                                    Total assignments {serverSubject.assignmentCount}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopySubject}
                                    aria-label={isCopied ? "Assignment list copied" : "Copy assignment list"}
                                    title={isCopied ? "Copied!" : "Copy all assignments"}
                                    className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-all duration-300 active:scale-90 ${isCopied
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                        : "border-slate-200/90 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-blue-600"
                                        }`}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        {isCopied ? (
                                            <motion.svg
                                                key="copied"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                                className="h-4.5 w-4.5 stroke-[2.6]"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                                            >
                                                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                                            </motion.svg>
                                        ) : (
                                            <motion.svg
                                                key="copy"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                                className="h-4.5 w-4.5 stroke-[1.8]"
                                                initial={{ scale: 0.7, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.7, opacity: 0 }}
                                                transition={{ duration: 0.18, ease: EASE }}
                                            >
                                                <rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" />
                                                <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" />
                                            </motion.svg>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-semibold text-slate-500 shadow-sm sm:px-4 sm:py-2 sm:text-sm">
                                Last updated: {serverSubject.lastUpdatedDisplay ?? serverSubject.lastUpdatedLabel}
                            </span>
                        </div>
                    </div>
                </section>

                <section
                    className="mx-auto w-full rounded-full border border-white/80 bg-(--panel) px-4 py-2.5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-5 sm:py-3"
                    style={{ maxWidth: 440 }}
                >
                    <div className="flex items-center gap-3 text-slate-400">
                        <SearchIcon />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            disabled={isReordering}
                            placeholder={isReordering ? "Search paused while reordering" : "Search assignments..."}
                            className="w-full bg-transparent text-[0.92rem] font-semibold text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:text-[0.98rem]"
                        />
                    </div>
                </section>

                {isAdmin ? (
                    <section className="flex flex-col gap-2.5">
                        <div className="flex flex-wrap items-center justify-stretch gap-2.5 sm:justify-end sm:gap-3">
                            {isReordering ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={cancelReordering}
                                        disabled={savingOrder}
                                        className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60 sm:flex-none sm:px-5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveOrder}
                                        disabled={savingOrder}
                                        className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(5,150,105,0.24)] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:bg-emerald-300 disabled:shadow-none sm:flex-none sm:px-5"
                                    >
                                        {savingOrder ? "Saving..." : "Save order"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {hasAnyAssignments ? (
                                        <button
                                            type="button"
                                            onClick={startReordering}
                                            className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-slate-900/10 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-900/20 hover:bg-slate-50 active:scale-95 sm:flex-none sm:px-5"
                                        >
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                                                <g fill="currentColor">
                                                    <circle cx="9" cy="6" r="1.5" />
                                                    <circle cx="15" cy="6" r="1.5" />
                                                    <circle cx="9" cy="12" r="1.5" />
                                                    <circle cx="15" cy="12" r="1.5" />
                                                    <circle cx="9" cy="18" r="1.5" />
                                                    <circle cx="15" cy="18" r="1.5" />
                                                </g>
                                            </svg>
                                            Reorder
                                        </button>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={() => openAddAssignment(serverSubject.slug)}
                                        className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full bg-blue-600 px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.2)] transition-transform hover:-translate-y-0.5 active:scale-95 sm:flex-none sm:px-5"
                                    >
                                        Add Assignment
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => openUploadAssignments(serverSubject.slug)}
                                        className="group inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-blue-600 bg-transparent px-4 text-sm font-black text-blue-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white hover:shadow-[0_14px_30px_rgba(37,99,235,0.22)] active:scale-95 sm:w-auto sm:px-5"
                                    >
                                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[2.2] transition-transform duration-200 group-hover:-translate-y-0.5">
                                            <path
                                                d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        Upload File
                                    </button>
                                </>
                            )}
                        </div>

                        <AnimatePresence initial={false}>
                            {isReordering ? (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.22, ease: EASE }}
                                    className="overflow-hidden rounded-2xl bg-slate-900/90 px-4 py-2.5 text-center text-xs font-bold text-white sm:text-right"
                                >
                                    Drag the handles to rearrange, then press Save order to apply every change at once.
                                </motion.p>
                            ) : null}

                            {actionError ? (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.22, ease: EASE }}
                                    className="overflow-hidden text-center text-sm font-bold text-rose-600 sm:text-right"
                                >
                                    {actionError}
                                </motion.p>
                            ) : null}
                        </AnimatePresence>
                    </section>
                ) : null}

                <motion.section layout className="space-y-3 pb-8">
                    {dateGroups.length ? (
                        dateGroups.map((group, index) => (
                            <GroupCard
                                key={group.label}
                                group={group}
                                isOpen={openGroups[group.label] ?? index === 0}
                                onToggle={() => handleToggleGroup(group.label)}
                                query={query}
                                isAdmin={isAdmin}
                                isReordering={isReordering}
                                onReorderGroup={handleReorderGroup}
                                onEdit={(assignment) => setDialog({ type: "edit", assignment })}
                                onInfo={(assignment) => setDialog({ type: "info", assignment })}
                                onDelete={(assignment) => setDialog({ type: "delete", assignment })}
                            />
                        ))
                    ) : (
                        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-10 text-center shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:px-6 sm:py-12">
                            <p className="text-base font-extrabold text-slate-800 sm:text-lg">
                                No assignments have been added yet.
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                This subject is ready for new work items from the database.
                            </p>
                        </div>
                    )}
                </motion.section>
            </div>

            <EditAssignmentDialog
                open={dialog?.type === "edit"}
                assignment={dialog?.assignment}
                onClose={() => setDialog(null)}
                onSave={(values) => updateAssignment(serverSubject.slug, dialog.assignment.id, values)}
            />

            <InfoAssignmentDialog
                open={dialog?.type === "info"}
                assignment={dialog?.assignment}
                subjectName={serverSubject.name}
                position={dialog?.assignment ? positionOf(dialog.assignment.id) : null}
                onClose={() => setDialog(null)}
            />

            <ConfirmDialog
                open={dialog?.type === "delete"}
                title="Delete assignment"
                message={
                    dialog?.assignment
                        ? `"${dialog.assignment.title}" will be permanently removed from ${serverSubject.name}.`
                        : ""
                }
                confirmLabel="Delete assignment"
                onClose={() => setDialog(null)}
                onConfirm={() => deleteAssignment(serverSubject.slug, null, dialog.assignment.id)}
            />
        </main>
    );
}
