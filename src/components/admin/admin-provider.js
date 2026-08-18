"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AuthModal from "@/components/auth/auth-modal";
import UploadAssignmentsModal from "@/components/subjects/upload-assignments-modal";
import InlineCalendar from "@/components/inline-calendar";
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
            <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
            <input
                {...props}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.98rem] font-semibold text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
            />
        </label>
    );
}

function ModalShell({ title, subtitle, onClose, children, widthClass = "max-w-[460px]" }) {
    return (
        <div className="fixed inset-0 z-50 grid min-h-[100dvh] place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md">
            <div className={`premium-dialog relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto ${widthClass} rounded-2xl border border-white/15 bg-white p-4.5 shadow-[0_40px_100px_rgba(15,23,42,0.24)] sm:p-8`}>
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
    const [name, setName] = useState(subject?.name ?? "");
    const [accentColor, setAccentColor] = useState(subject?.accentColor ?? colors[0]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const submit = async (event) => {
        event.preventDefault();
        const trimmedName = name.trim();

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
            <form onSubmit={submit} className="space-y-5">
                <Input label="Subject name" value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="e.g. Artificial Intelligence" autoFocus required />

                <div>
                    <span className="mb-2 block text-sm font-black text-slate-700">Accent color</span>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setAccentColor(color)}
                                className={`h-8 w-8 cursor-pointer rounded-full transition-transform ${accentColor === color ? "scale-110 ring-2 ring-slate-900 ring-offset-2" : "hover:scale-105"}`}
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
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedDate, setAssignedDate] = useState(() => new Date().toISOString().slice(0, 10));
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

    const submit = (event) => {
        event.preventDefault();
        onCreate?.({ number, title, description, assignedDate, subjectName });
        onClose();
    };

    return (
        <ModalShell
            widthClass="max-w-[560px]"
            title="Add Assignment"
            subtitle={`Create a new assignment under ${subjectName ?? "this subject"}.`}
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                    <Input label="No." value={numberLoading ? "…" : number} readOnly aria-readonly="true" placeholder="Calculating…" />
                    <Input label="Assignment title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Assignment title" />
                </div>

                <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-700">Description (optional)</span>
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Brief assignment details, resources, or links..."
                        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.98rem] font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
                    />
                </label>

                <InlineCalendar value={assignedDate} onChange={setAssignedDate} />

                <div className="flex items-center justify-end gap-3 pt-1">
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
    const [prevInitialSubjects, setPrevInitialSubjects] = useState(initialSubjects);
    const [catalogSubjects, setCatalogSubjects] = useState(() => normalizeCatalog(initialSubjects));

    if (initialSubjects !== prevInitialSubjects) {
        setPrevInitialSubjects(initialSubjects);
        setCatalogSubjects(normalizeCatalog(initialSubjects));
    }

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
            setCatalogSubjects(normalizeCatalog(subjectsFromServer));
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
            <AuthModal
                key={modal?.type === "login" ? "open-login" : "closed-login"}
                open={modal?.type === "login"}
                onClose={() => setModal(null)}
                onLogin={value.login}
            />
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
            <AssignmentModal
                key={modal?.type === "assignment" ? modal.subjectSlug : "closed-assignment"}
                open={modal?.type === "assignment"}
                subjectSlug={modal?.subjectSlug}
                subjectName={catalogSubjects.find((subject) => subject.slug === modal?.subjectSlug)?.name}
                fallbackNumber={getNextAssignmentNumber(catalogSubjects.find((subject) => subject.slug === modal?.subjectSlug))}
                onClose={() => setModal(null)}
                onCreate={(assignment) => {
                    const targetSubject = catalogSubjects.find((subject) => subject.slug === modal?.subjectSlug);
                    if (targetSubject) {
                        addAssignment(targetSubject.slug, assignment).catch(() => {
                        });
                    }
                }}
            />
            <UploadAssignmentsModal
                open={modal?.type === "upload"}
                subjectSlug={modal?.subjectSlug}
                subjectName={catalogSubjects.find((subject) => subject.slug === modal?.subjectSlug)?.name}
                onClose={() => setModal(null)}
                onImport={importAssignments}
            />
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