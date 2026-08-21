"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "@/components/admin/admin-provider";
import AssignmentRow from "@/components/subjects/assignment-row";
import RelativeTime from "@/components/ui/relative-time";

// Edit/info/delete code and its calendar are loaded only after a menu action.
const AssignmentDialogs = dynamic(() => import("@/components/subjects/assignment-dialogs"), { ssr: false });
// Framer Motion drag runtime stays out of the public subject bundle.
const AssignmentReorderList = dynamic(
    () => import("@/components/subjects/assignment-reorder-list"),
    { ssr: false },
);

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 stroke-[1.9] text-slate-400">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" />
            <path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function ChevronGlyph({ open }) {
    // Tailwind v4 `rotate-180` uses the standalone `rotate` property —
    // compositor-only, no JS animation runtime.
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`h-5 w-5 stroke-2 transition-transform duration-200 ease-out ${open ? "rotate-180" : "rotate-0"}`}
        >
            <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SortIcon({ direction }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[1.9]">
            <path
                d={direction === "desc" ? "M7 5v14m0 0-3-3m3 3 3-3" : "M7 19V5m0 0-3 3m3-3 3 3"}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M12 7h9M12 12h6M12 17h3" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
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
        <section className="assignment-group isolate overflow-hidden border border-slate-200/80 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/70 sm:gap-4 sm:px-6 sm:py-4"
            >
                <div className="min-w-0">
                    <p className="truncate text-[0.9rem] font-semibold tracking-[-0.01em] text-slate-800 sm:text-[0.95rem]">
                        {group.label}
                    </p>
                    <p className="mt-0.5 text-[0.78rem] font-normal text-slate-400 sm:text-[0.82rem]">
                        {filteredAssignments.length} assignment{filteredAssignments.length === 1 ? "" : "s"}
                    </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                    <ChevronGlyph open={isOpen} />
                </span>
            </button>

            {/* Expand/collapse is a one-shot compositor animation (opacity +
                translate3d). No height interpolation: closing a group no
                longer runs a 340ms forced-reflow loop. */}
            {isOpen ? (
                <div className={isReordering ? "" : "group-panel"}>
                    {isReordering ? (
                        <AssignmentReorderList
                            assignments={filteredAssignments}
                            isAdmin={isAdmin}
                            onReorder={(next) => onReorderGroup(group.label, next)}
                            onEdit={onEdit}
                            onInfo={onInfo}
                            onDelete={onDelete}
                        />
                    ) : (
                        <ul className="relative m-0 list-none p-0">
                            {filteredAssignments.map((assignment) => (
                                <AssignmentRow
                                    key={assignment.id}
                                    assignment={assignment}
                                    isAdmin={isAdmin}
                                    onEdit={onEdit}
                                    onInfo={onInfo}
                                    onDelete={onDelete}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </section>
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

    // The search input is uncontrolled: keystrokes write straight into the
    // native node (no React round-trip for the character itself). `query`
    // only holds the filter string, and the list re-renders against the
    // *deferred* copy so typing never blocks on group filtering.
    const searchRef = useRef(null);
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query);
    const [isCopied, setIsCopied] = useState(false);
    const [openGroups, setOpenGroups] = useState({});
    // "desc" = newest date group first (default). The toggle only changes the
    // DISPLAY order — assignment numbers are chronological and come from the
    // server, so they never renumber when this flips.
    const [sortDirection, setSortDirection] = useState("desc");
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
    // Server order is always chronological (oldest group first, ascending
    // numbers inside each group).
    const serverGroups = serverSubject.dateGroups;

    const dateGroups = useMemo(() => {
        const chronologicalGroups = draftGroups ?? serverGroups ?? [];

        if (sortDirection === "asc") {
            return chronologicalGroups;
        }

        // Newest -> oldest: reverse the group order and the rows inside each
        // group. `toReversed`-style copies keep the source arrays untouched.
        return chronologicalGroups
            .slice()
            .reverse()
            .map((group) => ({ ...group, assignments: group.assignments.slice().reverse() }));
    }, [draftGroups, serverGroups, sortDirection]);

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
                if (element) {
                    // Force-render the row before measuring the scroll target:
                    // its ancestor group may be content-visibility-skipped.
                    element.getBoundingClientRect();
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
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
        // Persisted order is chronological; show it that way while dragging so
        // the saved sequence matches what the admin sees.
        setSortDirection("asc");
        setDraftGroups((serverSubject.dateGroups ?? []).map((group) => ({ ...group, assignments: [...group.assignments] })));
        setIsReordering(true);
        setQuery("");
        // The input is uncontrolled, so clear its node explicitly too.
        if (searchRef.current) {
            searchRef.current.value = "";
        }

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
                group.assignments.forEach((assignment) => {
                    textToCopy += ` ${assignment.number ?? assignment.order}. ${assignment.title}\n`;
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

    const hasAnyAssignments = dateGroups.some((group) => group.assignments.length > 0);

    return (
        <main className="min-h-dvh px-2.5 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto flex w-full flex-col gap-3.5 sm:gap-5" style={{ maxWidth: 1180 }}>
                <section className="subject-hero rounded-card relative overflow-hidden border border-white/70 bg-(--panel) px-3.5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:px-7 sm:py-6">
                    <div
                        className="pointer-events-none absolute -right-12 top-6 h-36 w-36 rounded-full blur-3xl"
                        style={{ backgroundColor: serverSubject.tint }}
                    />
                    <div className="relative flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0 max-w-3xl">
                            {/* Secondary navigation: subtle by design — text
                                weight 500, no button chrome, behaviour unchanged. */}
                            <Link
                                href="/"
                                prefetch
                                className="group/back -ml-1 inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-[0.78rem] font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:text-[0.85rem]"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[2] transition-transform duration-200 group-hover/back:-translate-x-0.5">
                                    <path d="M19 12H5m0 0 5-5m-5 5 5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Back to Subjects
                            </Link>
                            <h1 className="mt-2.5 break-words text-[1.65rem] font-bold leading-[1.08] tracking-[-0.035em] text-slate-900 sm:mt-3.5 sm:text-4xl lg:text-5xl">
                                {serverSubject.name}
                            </h1>
                        </div>

                        <div className="flex flex-col items-start gap-3 lg:items-end">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className="inline-flex h-9 items-center rounded-full px-3.5 text-[0.75rem] font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.2)] sm:text-[0.82rem]"
                                    style={{ backgroundColor: serverSubject.accentColor }}
                                >
                                    Total assignments&nbsp;{serverSubject.assignmentCount}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopySubject}
                                    aria-label={isCopied ? "Assignment list copied" : "Copy assignment list"}
                                    title={isCopied ? "Copied!" : "Copy all assignments"}
                                    className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-gpu duration-200 ease-out active:scale-90 ${
                                        isCopied
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                            : "border-slate-200/90 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-blue-600"
                                    }`}
                                >
                                    {isCopied ? (
                                        <svg
                                            key="copied"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                            className="icon-swap h-4.5 w-4.5 stroke-[2.6]"
                                        >
                                            <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        <svg
                                            key="copy"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                            className="icon-swap h-4.5 w-4.5 stroke-[1.8]"
                                        >
                                            <rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" />
                                            <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <span
                                className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3.5 text-[0.75rem] font-medium text-slate-500 shadow-sm sm:text-[0.82rem]"
                                title={serverSubject.lastUpdatedDisplay}
                            >
                                Last updated:&nbsp;
                                <RelativeTime
                                    value={serverSubject.lastUpdatedAt}
                                    fallback={serverSubject.lastUpdatedLabel}
                                    className="font-semibold text-slate-700"
                                />
                            </span>
                        </div>
                    </div>
                </section>

                <section className="mx-auto flex w-full items-center gap-2.5" style={{ maxWidth: 520 }}>
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full border border-white/80 bg-(--panel) px-4 py-2.5 text-slate-400 shadow-[0_14px_40px_rgba(15,23,42,0.07)] sm:py-3">
                        <SearchIcon />
                        <input
                            ref={searchRef}
                            defaultValue=""
                            onInput={(event) => setQuery(event.currentTarget.value)}
                            disabled={isReordering}
                            placeholder={isReordering ? "Search paused while reordering" : "Search assignments..."}
                            className="w-full min-w-0 bg-transparent text-[0.88rem] font-normal text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:text-[0.94rem]"
                        />
                    </div>

                    {/* Display-order toggle. Purely local UI state — no request,
                        no renumbering. */}
                    <button
                        type="button"
                        onClick={() => setSortDirection((current) => (current === "desc" ? "asc" : "desc"))}
                        disabled={isReordering}
                        aria-label={
                            sortDirection === "desc"
                                ? "Sorted newest to oldest. Switch to oldest first."
                                : "Sorted oldest to newest. Switch to newest first."
                        }
                        title={sortDirection === "desc" ? "Newest → Oldest" : "Oldest → Newest"}
                        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-white/80 bg-(--panel) px-3.5 text-[0.78rem] font-medium text-slate-600 shadow-[0_14px_40px_rgba(15,23,42,0.07)] transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[0.82rem]"
                    >
                        <SortIcon direction={sortDirection} />
                        <span className="hidden sm:inline">{sortDirection === "desc" ? "Newest first" : "Oldest first"}</span>
                    </button>
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
                                        className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60 sm:flex-none sm:px-5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveOrder}
                                        disabled={savingOrder}
                                        className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.24)] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:bg-emerald-300 disabled:shadow-none sm:flex-none sm:px-5"
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
                                            className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-slate-900/10 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-gpu hover:-translate-y-0.5 hover:border-slate-900/20 hover:bg-slate-50 active:scale-95 sm:flex-none sm:px-5"
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
                                        className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.2)] transition-transform hover:-translate-y-0.5 active:scale-95 sm:flex-none sm:px-5"
                                    >
                                        Add Assignment
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => openUploadAssignments(serverSubject.slug)}
                                        className="group inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-blue-600 bg-transparent px-4 text-sm font-semibold text-blue-600 transition-gpu duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white hover:shadow-[0_14px_30px_rgba(37,99,235,0.22)] active:scale-95 sm:w-auto sm:px-5"
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

                        {isReordering ? (
                            <p className="gpu-enter rounded-card bg-slate-900/90 px-4 py-2.5 text-center text-xs font-medium text-white sm:text-right">
                                Drag the handles to rearrange, then press Save order to apply every change at once.
                            </p>
                        ) : null}

                        {actionError ? (
                            <p className="gpu-enter text-center text-sm font-medium text-rose-600 sm:text-right">
                                {actionError}
                            </p>
                        ) : null}
                    </section>
                ) : null}

                <section className="space-y-3 pb-8">
                    {dateGroups.length ? (
                        dateGroups.map((group, index) => (
                            <GroupCard
                                key={group.label}
                                group={group}
                                isOpen={openGroups[group.label] ?? index === 0}
                                onToggle={() => handleToggleGroup(group.label)}
                                query={deferredQuery}
                                isAdmin={isAdmin}
                                isReordering={isReordering}
                                onReorderGroup={handleReorderGroup}
                                onEdit={(assignment) => setDialog({ type: "edit", assignment })}
                                onInfo={(assignment) => setDialog({ type: "info", assignment })}
                                onDelete={(assignment) => setDialog({ type: "delete", assignment })}
                            />
                        ))
                    ) : (
                        <div className="rounded-card border border-slate-200/80 bg-white px-5 py-10 text-center shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:px-6 sm:py-12">
                            <p className="text-base font-semibold text-slate-800 sm:text-lg">
                                No assignments have been added yet.
                            </p>
                            <p className="mt-1.5 text-sm text-slate-500">
                                This subject is ready for new work items from the database.
                            </p>
                        </div>
                    )}
                </section>
            </div>

            {dialog ? (
                <AssignmentDialogs
                    dialog={dialog}
                    subjectName={serverSubject.name}
                    onClose={() => setDialog(null)}
                    onSave={(values) => updateAssignment(serverSubject.slug, dialog.assignment.id, values)}
                    onDelete={() => deleteAssignment(serverSubject.slug, null, dialog.assignment.id)}
                />
            ) : null}

        </main>
    );
}
