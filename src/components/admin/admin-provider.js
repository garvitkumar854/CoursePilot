"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// These interactive surfaces stay out of the dashboard bundle until requested.
const AuthModal = dynamic(() => import("@/components/auth/auth-modal"), { ssr: false });
const UploadAssignmentsModal = dynamic(() => import("@/components/subjects/upload-assignments-modal"), { ssr: false });
const DateField = dynamic(() => import("@/components/ui/date-field"), { ssr: false });
import { Modal, ModalActions } from "@/components/ui/modal";
import { subjects as seedSubjects } from "@/lib/course-data";

const AdminContext = createContext(null);

function normalizeAssignment(assignment, index, groupLabel) {
    return {
        ...assignment,
        id: assignment.id ?? crypto.randomUUID(),
        // `number` is the server-derived chronological sequence (oldest = 1)
        // and must never be recomputed from a render position.
        number: assignment.number ?? assignment.order ?? index + 1,
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
            sortKey: group.sortKey ?? 0,
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

const FIELD_LABEL = "mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400";
const FIELD_CONTROL =
    "rounded-control w-full border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]";
const SECONDARY_BUTTON =
    "rounded-control min-h-11 cursor-pointer border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY_BUTTON =
    "rounded-control min-h-11 cursor-pointer bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.2)] transition-gpu hover:bg-blue-700 active:scale-[0.99] disabled:cursor-wait disabled:bg-blue-300 disabled:shadow-none";

function Input({ label, ...props }) {
    return (
        <label className="block">
            <span className={FIELD_LABEL}>{label}</span>
            <input {...props} className={`${FIELD_CONTROL} min-h-11`} />
        </label>
    );
}

function ModalShell({ title, subtitle, onClose, children, size = "md" }) {
    // Every admin surface now shares one portal-based modal: identical
    // backdrop, centering, scroll lock and radius, and the navbar sits behind
    // the backdrop because the portal escapes the page stacking context.
    return (
        <Modal
            open
            onClose={onClose}
            size={size}
            closeLabel="Close modal"
            header={
                <div className="pr-10">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-blue-600">Admin access</p>
                    <h2 className="mt-1 text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-900 sm:text-xl">{title}</h2>
                    <p className="mt-1.5 max-w-md text-[0.8rem] leading-5 text-slate-500 sm:text-sm sm:leading-6">{subtitle}</p>
                </div>
            }
        >
            {children}
        </Modal>
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
                    <span className={FIELD_LABEL}>Accent color</span>
                    <div className="flex flex-wrap gap-2.5">
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

                {error ? <p role="alert" className="rounded-control border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p> : null}

                <ModalActions>
                    <button type="button" onClick={onClose} disabled={saving} className={SECONDARY_BUTTON}>
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className={PRIMARY_BUTTON}>
                        {saving ? "Saving..." : subject ? "Save changes" : "Create subject"}
                    </button>
                </ModalActions>
            </form>
        </ModalShell>
    );
}

export function AssignmentModal({ open, onClose, onCreate, subjectName, subjectSlug, fallbackNumber }) {
    // Uncontrolled form: title/description live in native inputs; only the
    // date is React state (it drives the single calendar trigger). Values are
    // read once from FormData on submit, so typing never re-renders the tree.
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

    return (
        <ModalShell
            size="md"
            title="Add assignment"
            subtitle={`Create a new assignment under ${subjectName ?? "this subject"}.`}
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
                    <Input label="No." value={numberLoading ? "…" : number} readOnly aria-readonly="true" placeholder="…" />
                    <Input label="Title" name="title" defaultValue="" placeholder="Assignment title" autoFocus />
                </div>

                <label className="block">
                    <span className={FIELD_LABEL}>Description (optional)</span>
                    <textarea
                        name="description"
                        defaultValue=""
                        rows={3}
                        placeholder="Brief details, resources or links — line breaks are preserved"
                        className={`${FIELD_CONTROL} min-h-20 resize-y py-2 leading-6`}
                    />
                </label>

                {/* ONE calendar trigger, integrated with the date value. */}
                <DateField value={assignedDate} onChange={setAssignedDate} name="assignedDate" />

                <ModalActions>
                    <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
                        Cancel
                    </button>
                    <button type="submit" className={PRIMARY_BUTTON}>
                        Create assignment
                    </button>
                </ModalActions>
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