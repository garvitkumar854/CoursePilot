"use client";

import { useState } from "react";

import DateField from "@/components/ui/date-field";
import { Modal, ModalActions } from "@/components/ui/modal";
import RelativeTime from "@/components/ui/relative-time";
import { formatAbsoluteIso } from "@/lib/relative-time";

function toDateInput(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

const FIELD_LABEL = "mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400";
const FIELD_CONTROL =
    "rounded-control w-full border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]";
const SECONDARY_BUTTON =
    "rounded-control min-h-11 cursor-pointer border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60";
const PRIMARY_BUTTON =
    "rounded-control min-h-11 cursor-pointer bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.2)] transition-gpu hover:bg-blue-700 active:scale-[0.99] disabled:bg-blue-300 disabled:shadow-none";

export function EditAssignmentDialog({ open, assignment, onClose, onSave }) {
    const [assignedDate, setAssignedDate] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Title/description are uncontrolled (`defaultValue` + FormData on
    // submit), so keystrokes never re-render this dialog. The form is keyed
    // by assignment id: opening a different assignment remounts the inputs
    // and re-applies their defaultValue. Only the calendar-driven date stays
    // in state, re-seeded with the documented "adjust state during render"
    // pattern when the key changes.
    const formKey = open ? (assignment?.id ?? null) : null;
    const [seededKey, setSeededKey] = useState(formKey);

    if (seededKey !== formKey) {
        setSeededKey(formKey);
        setAssignedDate(toDateInput(assignment?.assignedDate));
        setError("");
        setSaving(false);
    }

    const submit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title") ?? "").trim();

        if (!title) {
            setError("Assignment title is required.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await onSave({
                title,
                // Only outer whitespace is trimmed: interior blank lines are
                // part of the author's formatting and must survive.
                description: String(data.get("description") ?? "").trim(),
                assignedDate,
            });
            onClose();
        } catch (saveError) {
            setError(saveError?.message ?? "Unable to save changes.");
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={saving ? () => {} : onClose}
            dismissible={!saving}
            size="md"
            title="Edit assignment"
            description="Update the details for this assignment."
        >
            <form id="edit-assignment-form" key={formKey} onSubmit={submit} className="space-y-3">
                <label className="block">
                    <span className={FIELD_LABEL}>Title</span>
                    <input
                        name="title"
                        defaultValue={assignment?.title ?? ""}
                        placeholder="Assignment title"
                        className={FIELD_CONTROL}
                    />
                </label>

                <label className="block">
                    <span className={FIELD_LABEL}>Description</span>
                    <textarea
                        name="description"
                        defaultValue={assignment?.description ?? ""}
                        placeholder="Optional description — line breaks are preserved"
                        rows={4}
                        className={`${FIELD_CONTROL} min-h-24 resize-y leading-6`}
                    />
                </label>

                <DateField value={assignedDate} onChange={setAssignedDate} name="assignedDate" />

                {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

                <ModalActions>
                    <button type="button" onClick={onClose} disabled={saving} className={SECONDARY_BUTTON}>
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className={PRIMARY_BUTTON}>
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </ModalActions>
            </form>
        </Modal>
    );
}

function InfoRow({ label, children }) {
    return (
        <div className="rounded-control border border-slate-200 bg-slate-50/60 px-3 py-2.5">
            <dt className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
            <dd className="mt-1 text-[0.83rem] font-medium leading-6 text-slate-700 sm:text-sm">{children}</dd>
        </div>
    );
}

export function InfoAssignmentDialog({ open, assignment, subjectName, onClose }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            size="md"
            title="Assignment information"
            description={subjectName}
        >
            <dl className="space-y-2.5">
                <InfoRow label="Title">
                    <span className="font-semibold text-slate-900">{assignment?.title ?? "—"}</span>
                </InfoRow>

                <div className="grid gap-2.5 sm:grid-cols-2">
                    <InfoRow label="Created by">{assignment?.createdBy || "Unknown"}</InfoRow>
                    <InfoRow label="Created">
                        <RelativeTime value={assignment?.createdAt} fallback={formatAbsoluteIso(assignment?.createdAt)} />
                    </InfoRow>
                    <InfoRow label="Updated by">{assignment?.updatedBy || assignment?.createdBy || "Unknown"}</InfoRow>
                    <InfoRow label="Last updated">
                        <RelativeTime value={assignment?.updatedAt} fallback={formatAbsoluteIso(assignment?.updatedAt)} />
                    </InfoRow>
                </div>

                <InfoRow label="Assigned date">{formatAbsoluteIso(assignment?.assignedDate)}</InfoRow>

                <InfoRow label="Description">
                    {/* Plain text: line breaks preserved via CSS, never innerHTML. */}
                    <span className="text-multiline block">
                        {assignment?.description || "No description provided."}
                    </span>
                </InfoRow>
            </dl>
        </Modal>
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
        <Modal
            open={open}
            onClose={onClose}
            role="alertdialog"
            size="sm"
            showClose={false}
            dismissible={!busy}
            title={title}
            description={message}
            footer={
                <ModalActions>
                    <button type="button" onClick={onClose} disabled={busy} className={SECONDARY_BUTTON}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={busy}
                        className="rounded-control min-h-11 cursor-pointer bg-rose-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(225,29,72,0.2)] transition-gpu hover:bg-rose-700 active:scale-[0.99] disabled:bg-rose-300 disabled:shadow-none"
                    >
                        {busy ? "Working..." : confirmLabel}
                    </button>
                </ModalActions>
            }
        >
            {error ? (
                <p role="alert" className="text-sm font-medium text-rose-600">
                    {error}
                </p>
            ) : (
                <p className="text-[0.8rem] font-medium text-rose-600 sm:text-sm">This action cannot be undone.</p>
            )}
        </Modal>
    );
}

/** Deferred dialog bundle used by the assignment page. */
export default function AssignmentDialogs({ dialog, subjectName, onClose, onSave, onDelete }) {
    return (
        <>
            <EditAssignmentDialog
                open={dialog?.type === "edit"}
                assignment={dialog?.assignment}
                onClose={onClose}
                onSave={onSave}
            />
            <InfoAssignmentDialog
                open={dialog?.type === "info"}
                assignment={dialog?.assignment}
                subjectName={subjectName}
                onClose={onClose}
            />
            <ConfirmDialog
                open={dialog?.type === "delete"}
                title="Delete assignment"
                message={dialog?.assignment ? `"${dialog.assignment.title}" will be permanently removed from ${subjectName}.` : ""}
                confirmLabel="Delete assignment"
                onClose={onClose}
                onConfirm={onDelete}
            />
        </>
    );
}
