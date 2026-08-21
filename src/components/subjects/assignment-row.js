"use client";

import { useRef, useState } from "react";
import { FloatingMenu } from "@/components/ui/floating-menu";

function DotsIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <g fill="currentColor">
                <circle cx="12" cy="5" r="1.7" />
                <circle cx="12" cy="12" r="1.7" />
                <circle cx="12" cy="19" r="1.7" />
            </g>
        </svg>
    );
}

function EditIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[1.9]">
            <path
                d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14.5 6.5l3 3"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function InfoIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[1.9]">
            <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" />
            <path d="M12 11v5M12 8h.01" fill="none" stroke="currentColor" strokeLinecap="round" />
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

function RowActions({ assignment, menuOpen, setMenuOpen, onEdit, onInfo, onDelete }) {
    const triggerRef = useRef(null);

    const runAction = (action) => {
        setMenuOpen(false);
        action?.(assignment);
    };

    return (
        <div className={`relative shrink-0 ${menuOpen ? "z-50" : ""}`}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                aria-label={`Actions for ${assignment.title}`}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className={`micro-interact flex h-9 w-9 cursor-pointer items-center justify-center rounded-full ${menuOpen ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
            >
                <DotsIcon />
            </button>

            <FloatingMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                anchorRef={triggerRef}
            >
                <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(onEdit)}
                    className="rounded-control micro-interact flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <EditIcon />
                    Edit
                </button>
                <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(onInfo)}
                    className="rounded-control micro-interact flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    <InfoIcon />
                    Info
                </button>
                <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(onDelete)}
                    className="rounded-control micro-interact flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50"
                >
                    <TrashIcon />
                    Delete
                </button>
            </FloatingMenu>
        </div>
    );
}

export function AssignmentRowBody({
    assignment,
    isAdmin,
    showGrip = false,
    onGripPointerDown,
    gripIcon = null,
    onEdit,
    onInfo,
    onDelete,
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className={`flex gap-2 px-2.5 py-3 sm:gap-4 sm:px-6 sm:py-4 ${assignment.description ? "items-start" : "items-center"}`}>
            {showGrip ? (
                <button
                    type="button"
                    aria-label={`Drag to reorder ${assignment.title}`}
                    onPointerDown={(event) => {
                        event.preventDefault();
                        onGripPointerDown?.(event);
                    }}
                    className="mt-0.5 flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-control text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing sm:w-8"
                >
                    {gripIcon}
                </button>
            ) : null}

            {/* Chronological sequence number (oldest = 1), derived server-side
                and continuous across every date group. It is intentionally NOT
                the render index, so flipping the sort order never renumbers. */}
            <span className="mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 px-1.5 text-[0.68rem] font-semibold text-slate-600 ring-1 ring-emerald-100 sm:h-9 sm:min-w-9 sm:text-[0.82rem]">
                {assignment.number ?? assignment.order}
            </span>

            <div className="min-w-0 flex-1">
                <h3 className="text-[0.86rem] font-medium leading-snug text-slate-800 sm:text-[1rem] sm:font-semibold">
                    {assignment.title}
                </h3>
                {assignment.description ? (
                    /* `text-multiline` = white-space: pre-line, so the admin's
                       blank lines survive without any HTML injection. */
                    <p className="text-multiline mt-1 line-clamp-3 text-[0.76rem] font-normal leading-5 text-slate-500 sm:text-[0.86rem] sm:leading-6">
                        {assignment.description}
                    </p>
                ) : null}
            </div>

            {isAdmin ? (
                <RowActions
                    assignment={assignment}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onEdit={onEdit}
                    onInfo={onInfo}
                    onDelete={onDelete}
                />
            ) : null}
        </div>
    );
}

export default function AssignmentRow({
    assignment,
    isAdmin,
    onEdit,
    onInfo,
    onDelete,
}) {
    return (
        <li
            id={`assignment-${assignment.id}`}
            className="assignment-target feed-item relative z-0 scroll-mt-24 border-t border-slate-200/80 bg-white first:border-t-0"
        >
            <AssignmentRowBody
                assignment={assignment}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onInfo={onInfo}
                onDelete={onDelete}
            />
        </li>
    );
}
