"use client";

import { Reorder, useDragControls, useMotionValue } from "framer-motion";
import { useState } from "react";
import { useDismissable } from "@/lib/use-dismissable";

const EASE = [0.22, 1, 0.36, 1];

function GripIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <g fill="currentColor">
                <circle cx="9" cy="6" r="1.6" />
                <circle cx="15" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" />
                <circle cx="15" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" />
                <circle cx="15" cy="18" r="1.6" />
            </g>
        </svg>
    );
}

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

export default function AssignmentRow({
    assignment,
    index,
    isAdmin,
    isReordering,
    onEdit,
    onInfo,
    onDelete,
}) {
    const dragControls = useDragControls();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const menuRef = useDismissable(menuOpen, () => setMenuOpen(false));

    // A per-item motion value keeps the dragged row painted above its siblings.
    const y = useMotionValue(0);

    const runAction = (action) => {
        setMenuOpen(false);
        action?.(assignment);
    };

    return (
        <Reorder.Item
            value={assignment}
            id={`assignment-${assignment.id}`}
            style={{ y }}
            dragListener={false}
            dragControls={dragControls}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            transition={{ duration: 0.25, ease: EASE }}
            className={`assignment-target relative scroll-mt-24 border-t border-slate-200/80 bg-white first:border-t-0 ${isDragging ? "z-20 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.16)]" : menuOpen ? "z-50" : "z-0"
                }`}
        >
            <div className={`flex gap-2 px-2.5 py-3 sm:gap-4 sm:px-6 sm:py-4 ${assignment.description ? "items-start" : "items-center"}`}>
                {isAdmin && isReordering ? (
                    <button
                        type="button"
                        aria-label={`Drag to reorder ${assignment.title}`}
                        onPointerDown={(event) => {
                            event.preventDefault();
                            dragControls.start(event);
                        }}
                        // `touch-none` hands the gesture to the pointer handler
                        // instead of the browser's native scroll on mobile.
                        className="mt-0.5 flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing sm:w-8"
                    >
                        <GripIcon />
                    </button>
                ) : null}

                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[0.68rem] font-extrabold text-slate-500 ring-1 ring-emerald-100 sm:h-9 sm:w-9 sm:text-sm">
                    {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                    <h3 className="text-[0.84rem] font-extrabold leading-snug text-slate-800 sm:text-[1.03rem]">
                        {assignment.title}
                    </h3>
                    {assignment.description ? (
                        <p className="mt-1 line-clamp-3 text-[0.74rem] leading-5 text-slate-500 sm:text-sm sm:leading-6">
                            {assignment.description}
                        </p>
                    ) : null}
                </div>

                {isAdmin ? (
                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((current) => !current)}
                            aria-label={`Actions for ${assignment.title}`}
                            aria-expanded={menuOpen}
                            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors ${menuOpen ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                }`}
                        >
                            <DotsIcon />
                        </button>

                        {menuOpen ? (
                            <div className="absolute right-0 top-11 z-30 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                                <button
                                    type="button"
                                    onClick={() => runAction(onEdit)}
                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                    <EditIcon />
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => runAction(onInfo)}
                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                    <InfoIcon />
                                    Info
                                </button>
                                <button
                                    type="button"
                                    onClick={() => runAction(onDelete)}
                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-rose-500 transition-colors hover:bg-rose-50"
                                >
                                    <TrashIcon />
                                    Delete
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </Reorder.Item>
    );
}
