"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// These interactive surfaces stay out of the dashboard bundle until requested.
const AuthModal = dynamic(() => import("@/components/auth/auth-modal"), { ssr: false });
const UploadAssignmentsModal = dynamic(() => import("@/components/subjects/upload-assignments-modal"), { ssr: false });
const InlineCalendar = dynamic(() => import("@/components/inline-calendar"), { ssr: false });
import { subjects as seedSubjects } from "@/lib/course-data";

const AdminContext = createContext(null);

function normalizeAssignment(assignment, index, groupLabel) {
    return {
        id: assignment.id ?? crypto.randomUUID(),
        order: assignment.order ?? index + 1,
        title: assignment.title,
        description: assignment.description ?? "",
        assignedDate: assignment.assignedDate ?? groupLabel,
    };
}

function normalizeSubject(subject) {
    return {
        ...subject,
        dateGroups: (subject.dateGroups ?? []).map((group) => ({
            ...group,
            assignments: (group.assignments ?? []).map((assignment, index) => normalizeAssignment(assignment, index, group.label)),
        })),
    };
}

function normalizeCatalog(subjects) {
    return (subjects ?? seedSubjects).map((subject) => normalizeSubject(subject));
}

function getNextAssignmentNumber(subject) {
    const assignments = subject?.dateGroups?.flatMap((group) => group.assignments ?? []) ?? [];
    return assignments.reduce((maximum, assignment) => Math.max(maximum, Number(assignment.order) || 0), 0) + 1;
}

function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 stroke-[1.9]">
            <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 stroke-[1.8]">
            <path
                d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" />
        </svg>
    );
}

function Input({ label, ...props }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-black text-slate-700 sm:mb-2 sm:text-sm">{label}</span>
            <input
                {...props}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)] sm:px-4 sm:py-3 sm:text-[0.98rem]"
            />
        </label>
    );
}

function ModalShell({ title, subtitle, onClose, children, widthClass = "max-w-[460px]" }) {
    return (
        <div className="gpu-fade fixed inset-0 z-50 grid min-h-[100dvh] place-items-center overflow-y-auto bg-black/40 p-3 backdrop-blur-md sm:p-4">
            <div className={`premium-dialog contain-scroll relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto ${widthClass} rounded-2xl border border-white/15 bg-white p-4 shadow-[0_40px_100px_rgba(15,23,42,0.24)] sm:p-6`}>
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3.5 top-3.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:right-5 sm:top-5 sm:h-11 sm:w-11"
                    aria-label="Close modal"
                >
                    <CloseIcon />
                </button>

                <p className="pr-11 text-[0.65rem] font-black uppercase tracking-[0.25em] text-blue-600 sm:text-xs sm:tracking-[0.28em]">Admin Access</p>
                <h2 className="mt-1.5 pr-11 text-[1.75rem] font-black tracking-[-0.055em] text-slate-900 sm:mt-2 sm:text-4xl">{title}</h2>
                <p className="mt-2 max-w-md text-[0.8rem] leading-5.5 text-slate-500 sm:mt-3 sm:text-sm sm:leading-6">{subtitle}</p>

                <div className="mt-6">{children}</div>
            </div>
        </div>
    );
}



function SubjectModal({ open, subject, onClose, onCreate }) {
    const colors = useMemo(() => ["#2563eb", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#14b8a6", "#f97316", "#ef4444", "#06b6d4", "#6366f1"], []);
    // Uncontrolled: the name lives in the native input and is read once, from
    // FormData, on submit. Keystrokes never touch React state.
    const [accentColor, setAccentColor] = useState(subject?.accentColor ?? colors[0]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const submit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const trimmedName = String(data.get("subjectName") ?? "").trim();

        if (!trimmedName) {
            setError("Enter a subject name.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await onCreate?.({ name: trimmedName, accentColor });
            onClose();
        } catch (saveError) {
            setError(saveError?.message ?? `Unable to ${subject ? "update" : "create"} the subject.`);
            setSaving(false);
        }
    };

    return (
        <ModalShell
            title={subject ? "Edit subject" : "Add subject"}
            subtitle={subject ? "Update this subject's name and accent." : "Create a new subject card for your dashboard."}
            onClose={saving ? () => {} : onClose}
        >
            <form onSubmit={submit} className="space-y-3 sm:space-y-4">
                <Input label="Subject name" name="subjectName" defaultValue={subject?.name ?? ""} onInput={() => setError("")} placeholder="e.g. Artificial Intelligence" autoFocus required />

                <div>
                    <span className="mb-2 block text-sm font-black text-slate-700">Accent color</span>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setAccentColor(color)}
                                className={`h-8 w-8 cursor-pointer rounded-full transition-transform duration-200 ease-out ${accentColor === color ? "scale-110 ring-2 ring-slate-900 ring-offset-2" : "hover:scale-105"}`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select ${color}`}
                                aria-pressed={accentColor === color}
                            />
                        ))}
                    </div>
                </div>

                {error ? <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-600">{error}</p> : null}

                <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end sm:gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="cursor-pointer rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_18px_35px_rgba(37,99,235,0.26)] disabled:cursor-wait disabled:bg-blue-400">
                        {saving ? "Saving..." : subject ? "Save changes" : "Create subject"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

export function AssignmentModal({ open, onClose, onCreate, subjectName, subjectSlug, fallbackNumber }) {
    // Uncontrolled form: title/description live in native inputs; the date
    // input is synced with the calendar through a ref. Values are read once
    // from FormData on submit, so typing never re-renders the modal tree.
    const dateInputRef = useRef(null);
    const [assignedDate, setAssignedDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [calendarOpen, setCalendarOpen] = useState(false);
    const nextNumberQuery = useQuery({
        queryKey: ["assignment-next-number", subjectSlug],
        enabled: Boolean(open && subjectSlug),
        staleTime: 0,
        queryFn: async ({ signal }) => {
            const response = await fetch(`/api/subjects/${encodeURIComponent(subjectSlug)}/assignments`, {
                cache: "no-store",
                signal,
            });

            if (!response.ok) throw new Error("Unable to calculate assignment number");
            return response.json();
        },
    });
    const number = String(nextNumberQuery.data?.nextNumber ?? fallbackNumber ?? 1);
    const numberLoading = nextNumberQuery.isFetching;

    if (!open) {
        return null;
    }

    const submit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title") ?? "").trim();
        if (!title) return;
        await onCreate?.({
            number,
            title,
            description: String(data.get("description") ?? "").trim(),
            assignedDate: String(data.get("assignedDate") ?? assignedDate),
            subjectName,
        });
        onClose();
    };

    const pickDate = (value) => {
        setAssignedDate(value);
        if (dateInputRef.current) {
            dateInputRef.current.value = value;
        }
        setCalendarOpen(false);
    };

    return (
        <ModalShell
            widthClass="max-w-[560px]"
            title="Add Assignment"
            subtitle={`Create a new assignment under ${subjectName ?? "this subject"}.`}
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-3.5 sm:space-y-4">
                <div className="grid gap-3 sm:grid-cols-[96px_minmax(0,1fr)]">
                    <Input label="No." value={numberLoading ? "…" : number} readOnly aria-readonly="true" placeholder="Calculating…" />
                    <Input label="Assignment title" name="title" defaultValue="" placeholder="Assignment title" />
                </div>

                <label className="block">
                    <span className="mb-1.5 block text-xs font-black text-slate-700 sm:mb-2 sm:text-sm">Description (optional)</span>
                    <textarea
                        name="description"
                        defaultValue=""
                        placeholder="Brief assignment details, resources, or links..."
                        className="min-h-20 w-full resize-y rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)] sm:px-4 sm:text-[0.92rem]"
                    />
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label className="text-xs font-bold text-slate-600">Assigned date
                            <input ref={dateInputRef} type="date" name="assignedDate" defaultValue={assignedDate} onChange={(event) => setAssignedDate(event.target.value)} className="mt-1 block min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300" />
                        </label>
                        <button type="button" onClick={() => setCalendarOpen((current) => !current)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">
                            {calendarOpen ? "Hide calendar" : "Choose from calendar"}
                        </button>
                    </div>
                    {calendarOpen ? <div className="mt-3"><InlineCalendar value={assignedDate} onChange={pickDate} /></div> : null}
                </div>

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3">
                    <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">
                        Cancel
                    </button>
                    <button type="submit" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_18px_35px_rgba(37,99,235,0.26)]">
                        Create Assignment
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

export function AdminProvider({ children, initialSubjects }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const queryClient = useQueryClient();
    const catalogQuery = useQuery({
        queryKey: ["coursepilot", "subjects"],
        initialData: () => normalizeCatalog(initialSubjects),
        // The server-rendered catalog is shown first. Later reads are silent,
        // cancelable and only notify consumers when structural data changed.
        queryFn: async ({ signal }) => {
            const response = await fetch("/api/subjects", { signal, cache: "no-store" });
            if (!response.ok) throw new Error("Unable to refresh subjects.");
            const data = await response.json();
            return normalizeCatalog(data.subjects);
        },
    });
    const catalogSubjects = catalogQuery.data ?? normalizeCatalog(initialSubjects);

    useEffect(() => {
        queryClient.setQueryData(["coursepilot", "subjects"], normalizeCatalog(initialSubjects));
    }, [initialSubjects, queryClient]);

    useEffect(() => {
        let active = true;

        async function loadUser() {
            try {
                const response = await fetch("/api/admin/me", { cache: "no-store" });
                const data = await response.json();

                if (active) {
                    setUser(data.user ?? null);
                }
            } catch {
                if (active) {
                    setUser(null);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadUser();

        return () => {
            active = false;
        };
    }, []);

    const syncCatalog = (subjectsFromServer) => {
        if (Array.isArray(subjectsFromServer)) {
            // Mutations replace the same cache that every subject view reads,
            // so navigation has no spinner or second network wait.
            queryClient.setQueryData(["coursepilot", "subjects"], normalizeCatalog(subjectsFromServer));
            window.dispatchEvent(new Event("coursepilot:notifications-changed"));
        }
    };

    const createSubject = async ({ name, accentColor }) => {
        const response = await fetch("/api/subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, accentColor }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message ?? "Unable to create subject.");
        }

        const data = await response.json();
        syncCatalog(data.subjects);
    };

    const updateSubject = async (subjectSlug, { name, accentColor }) => {
        const response = await fetch(`/api/subjects/${subjectSlug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, accentColor }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message ?? "Unable to update subject.");
        }

        const data = await response.json();
        syncCatalog(data.subjects);
    };

    const deleteSubject = async (subjectSlug) => {
        const response = await fetch(`/api/subjects/${subjectSlug}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message ?? "Unable to delete subject.");
        }

        const data = await response.json();
        syncCatalog(data.subjects);
    };

    const addAssignment = async (subjectSlug, assignment) => {
        const response = await fetch(`/api/subjects/${subjectSlug}/assignments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assignment),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message ?? "Unable to add assignment.");
        }

        const data = await response.json();
        syncCatalog(data.subjects);
    };

    const importAssignments = async (subjectSlug, assignments) => {
        const response = await fetch(`/api/subjects/${subjectSlug}/assignments/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignments }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message ?? "Unable to import assignments.");
        }

        syncCatalog(data.subjects);
        return data;
    };

    const deleteAssignment = async (subjectSlug, _groupLabel, assignmentId) => {
        const response = await fetch(`/api/subjects/${subjectSlug}/assignments/${assignmentId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message ?? "Unable to delete assignment.");
        }

        const data = await response.json();
        syncCatalog(data.subjects);
    };

    const updateAssignment = async (subjectSlug, assignmentId, values) => {
        const response = await fetch(`/api/subjects/${subjectSlug}/assignments/${assignmentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message ?? "Unable to update assignment.");
        }

        syncCatalog(data.subjects);
    };

    const reorderAssignments = async (subjectSlug, orderedIds) => {
        const response = await fetch(`/api/subjects/${subjectSlug}/assignments/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedIds }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message ?? "Unable to save the new order.");
        }

        syncCatalog(data.subjects);
    };

    const moveAssignment = async (subjectSlug, _groupLabel, assignmentId, direction) => {
        const response = await fetch(`/api/subjects/${subjectSlug}/assignments/${assignmentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ direction }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message ?? "Unable to reorder assignment.");
        }

        const data = await response.json();
        syncCatalog(data.subjects);
    };

    const login = async ({ identifier, password, rememberMe }) => {
        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password, rememberMe }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                return { ok: false, message: data.message ?? "Login failed." };
            }

            setUser(data.user);
            return { ok: true };
        } catch {
            return { ok: false, message: "Unable to reach the server. Check your connection and try again." };
        }
    };

    const value = {
        user,
        loading,
        isAdmin: Boolean(user),
        subjects: catalogSubjects,
        openLogin: () => setModal({ type: "login" }),
        openAddSubject: (candidate = null) => {
            const subject = candidate && typeof candidate === "object" && typeof candidate.slug === "string"
                ? candidate
                : null;
            setModal({ type: "subject", subject });
        },
        openAddAssignment: (subjectSlug) => setModal({ type: "assignment", subjectSlug }),
        openUploadAssignments: (subjectSlug) => setModal({ type: "upload", subjectSlug }),
        closeModal: () => setModal(null),
        logout: async () => {
            try {
                await fetch("/api/admin/logout", { method: "POST" });
            } finally {
                setUser(null);
            }
        },
        createSubject,
        updateSubject,
        deleteSubject,
        addAssignment,
        importAssignments,
        updateAssignment,
        reorderAssignments,
        deleteAssignment,
        moveAssignment,
        login,
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
            {modal?.type === "login" ? (
                <AuthModal
                    open
                    onClose={() => setModal(null)}
                    onLogin={value.login}
                />
            ) : null}
            <SubjectModal
                key={modal?.type === "subject" ? (modal.subject?.slug ?? "new-subject") : "closed-subject"}
                open={modal?.type === "subject"}
                subject={modal?.subject}
                onClose={() => setModal(null)}
                onCreate={async (subject) => {
                    if (modal?.subject) {
                        await updateSubject(modal.subject.slug, subject);
                        return;
                    }

                    await createSubject(subject);
                }}
            />
            {modal?.type === "assignment" ? <AssignmentModal
                key={modal.subjectSlug}
                open
                subjectSlug={modal.subjectSlug}
                subjectName={catalogSubjects.find((subject) => subject.slug === modal?.subjectSlug)?.name}
                fallbackNumber={getNextAssignmentNumber(catalogSubjects.find((subject) => subject.slug === modal?.subjectSlug))}
                onClose={() => setModal(null)}
                onCreate={(assignment) => {
                    const targetSubject = catalogSubjects.find((subject) => subject.slug === modal?.subjectSlug);
                    if (!targetSubject) return Promise.reject(new Error("Subject is no longer available."));
                    return addAssignment(targetSubject.slug, assignment);
                }}
            /> : null}
            {modal?.type === "upload" ? <UploadAssignmentsModal
                open
                subjectSlug={modal?.subjectSlug}
                subjectName={catalogSubjects.find((subject) => subject.slug === modal?.subjectSlug)?.name}
                onClose={() => setModal(null)}
                onImport={importAssignments}
            /> : null}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);

    if (!context) {
        throw new Error("useAdmin must be used inside AdminProvider");
    }

    return context;
}