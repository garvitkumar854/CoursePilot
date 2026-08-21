"use client";

import { useState } from "react";

import { Modal, ModalActions } from "@/components/ui/modal";

export type DeleteSubjectDialogProps = Readonly<{
  open: boolean;
  subjectName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}>;

/**
 * Permanent, destructive subject deletion.
 *
 * Rendered through the shared portal `Modal`, so the backdrop covers the
 * navbar as well (see the stacking-context note in `ui/modal.tsx`). Compact,
 * rectangular-with-card-radius, centered, and responsive down to 320px.
 */
export function DeleteSubjectDialog({
  open,
  subjectName,
  onCancel,
  onConfirm,
}: DeleteSubjectDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (busy) return;
    setError("");
    onCancel();
  };

  const confirm = async () => {
    setBusy(true);
    setError("");

    try {
      await onConfirm();
      onCancel();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The subject could not be deleted.");
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      role="alertdialog"
      size="sm"
      showClose={false}
      dismissible={!busy}
      header={
        <div className="flex items-start gap-3">
          <span
            className="rounded-control grid size-10 shrink-0 place-items-center bg-rose-50 text-rose-600"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="size-5">
              <path
                d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m-8.5 0 .8 11A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-2l.8-11M10 11v5m4-5v5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h2
              id="delete-subject-title"
              className="text-[1.02rem] font-semibold leading-snug tracking-[-0.02em] text-slate-900 sm:text-lg"
            >
              Permanently delete {subjectName}?
            </h2>
            <p id="delete-subject-description" className="mt-1 text-[0.8rem] leading-5 text-slate-500 sm:text-sm">
              This removes the subject and all of its assignments. This action cannot be undone.
            </p>
          </div>
        </div>
      }
      labelledBy="delete-subject-title"
      footer={
        <ModalActions>
          <button
            type="button"
            disabled={busy}
            onClick={close}
            className="rounded-control min-h-11 cursor-pointer border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Keep subject
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className="rounded-control min-h-11 cursor-pointer bg-rose-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(225,29,72,0.2)] transition-gpu hover:bg-rose-700 active:scale-[0.99] disabled:cursor-wait disabled:bg-rose-300 disabled:shadow-none"
          >
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
        </ModalActions>
      }
    >
      {error ? (
        <p
          role="alert"
          className="rounded-control border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
        >
          {error}
        </p>
      ) : (
        <p className="text-[0.8rem] font-medium text-rose-600 sm:text-sm">
          This action cannot be undone.
        </p>
      )}
    </Modal>
  );
}

export default DeleteSubjectDialog;
