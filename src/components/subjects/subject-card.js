"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdmin } from "@/components/admin/admin-provider";
import DeleteSubjectDialog from "@/components/delete-subject-dialog";
import { useDismissable } from "@/lib/use-dismissable";

function CopyGlyph() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 stroke-[1.8]">
            <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" />
            <path d="M15.5 8.5v-2A2 2 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7a2 2 0 0 0 2 2h2.5" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function CheckGlyph() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[2.8] text-emerald-600">
            <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function SubjectCard({ subject, rank }) {
    const { isAdmin, openAddSubject, deleteSubject } = useAdmin();
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const menuRef = useDismissable(menuOpen, () => setMenuOpen(false));

    // Numbering comes from the rendered position, so the badge is always a
    // continuous #01, #02, ... even when stored `order` values have gaps.
    const rankLabel = `#${String(rank).padStart(2, "0")}`;
    const titleSize = subject.name.length > 42
        ? "text-[1.02rem] leading-[1.15] sm:text-[1.15rem]"
        : subject.name.length > 28
            ? "text-[1.15rem] leading-[1.1] sm:text-[1.32rem]"
            : "text-[1.32rem] leading-[1.05] sm:text-[1.55rem] lg:text-[1.7rem]";

    const handleCopy = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        let textToCopy = `Assignments for ${subject.name}:\n\n`;
        if (subject.dateGroups && subject.dateGroups.length > 0) {
            subject.dateGroups.forEach((group) => {
                textToCopy += `[${group.label}]\n`;
                group.assignments.forEach((a, index) => {
                    textToCopy += ` ${index + 1}. ${a.title}\n`;
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
                throw new Error("Clipboard API not available");
            }
        } catch (error) {
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

    return (
        <>
        {/* `.loop-item` applies content-visibility: auto + intrinsic-size
            containment so offscreen cards cost nothing to keep in the loop. */}
        <article className="loop-item group relative h-full overflow-hidden rounded-[24px] border border-white/70 bg-(--panel) p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-transform duration-200 ease-out hover:-translate-y-1 sm:rounded-[28px] sm:p-6">
            {/* Accent bar: the hover expansion is now a transform scaleX on a
                full-width layer (opacity + transform only). The static pill
                underneath never animates geometry, so hovering a card cannot
                force layout on the dashboard grid. */}
            <div
                className="absolute left-1/2 top-0 h-1.5 w-20 -translate-x-1/2 rounded-b-full"
                style={{ backgroundColor: subject.accentColor }}
            />
            <div
                className="absolute inset-x-0 top-0 h-2 origin-center scale-x-[0.21] rounded-none opacity-0 transition-gpu duration-200 ease-out group-hover:scale-x-100 group-hover:opacity-100 group-hover:shadow-[0_4px_15px_rgba(15,23,42,0.15)]"
                style={{ backgroundColor: subject.accentColor }}
            />

            <div
                className="absolute inset-0 opacity-70"
                style={{
                    background: `radial-gradient(circle at top right, ${subject.tint}, transparent 32%)`,
                }}
            />

            <div className="relative flex h-full min-h-[11.5rem] flex-col sm:min-h-[12rem]">
                {isAdmin ? (
                    <div className="absolute right-0 top-0 z-10" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((current) => !current)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Subject actions"
                            aria-expanded={menuOpen}
                        >
                            <span className="text-xl leading-none">⋮</span>
                        </button>

                        {menuOpen ? (
                            <div className="absolute right-0 top-10 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        openAddSubject(subject);
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Edit subject
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setDeleteOpen(true);
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50"
                                >
                                    Delete
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <h2 className={`min-h-[2.5em] max-w-[18ch] pr-8 font-black tracking-[-0.04em] text-slate-900 ${titleSize}`} title={subject.name}>
                    <span className="line-clamp-3">{subject.name}</span>
                </h2>

                <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs font-extrabold sm:mt-4 sm:gap-3 sm:text-sm">
                    <span className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-2.5 text-slate-900 shadow-sm sm:h-9 sm:px-3">
                        {rankLabel}
                    </span>
                    <span
                        className="inline-flex h-8 items-center rounded-full px-2.5 sm:h-9 sm:px-3"
                        style={{ backgroundColor: `${subject.accentColor}18`, color: subject.accentColor }}
                    >
                        <span className="hidden sm:inline">Total Assignments&nbsp;</span>
                        <span className="sm:hidden">Assignments&nbsp;</span>
                        {subject.assignmentCount}
                    </span>
                </div>

                <div className="mt-auto flex min-h-11 items-end justify-between gap-3 pt-5 sm:gap-4 sm:pt-6">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={`relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border transition-gpu duration-200 ease-out active:scale-95 ${
                            isCopied
                                ? "border-emerald-300 bg-emerald-50 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.22)]"
                                : "border-slate-200/90 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
                        }`}
                        title={isCopied ? "Copied!" : "Copy assignments"}
                        aria-label="Copy assignments"
                    >
                        {isCopied ? (
                            <span key="check" className="icon-swap">
                                <CheckGlyph />
                            </span>
                        ) : (
                            <span key="copy" className="icon-swap">
                                <CopyGlyph />
                            </span>
                        )}

                        {isCopied ? (
                            <span
                                className="gpu-enter absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-emerald-600 px-2.5 py-1 text-[0.7rem] font-black text-white shadow-lg pointer-events-none"
                            >
                                Copied!
                            </span>
                        ) : null}
                    </button>

                    <Link
                        href={`/subjects/${subject.slug}`}
                        aria-label={`Open ${subject.name} assignments`}
                        className="subject-view-button group/link inline-flex h-11 items-center gap-2.5 rounded-2xl border px-3 pl-4 text-xs font-black tracking-[-0.01em] shadow-sm transition-gpu duration-200 ease-out hover:-translate-y-0.5 active:scale-95 sm:text-sm"
                        style={{
                            "--subject-accent": subject.accentColor,
                            "--subject-tint": `${subject.accentColor}18`,
                        }}
                    >
                        Open subject
                        <span className="subject-view-icon flex h-7 w-7 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 ease-out group-hover/link:translate-x-0.5">
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 stroke-[2.4]">
                                <path d="M5 12h14m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </Link>
                </div>
            </div>
        </article>
        <DeleteSubjectDialog
            open={deleteOpen}
            subjectName={subject.name}
            onCancel={() => setDeleteOpen(false)}
            onConfirm={() => deleteSubject(subject.slug)}
        />
        </>
    );
}