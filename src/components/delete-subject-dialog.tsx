"use client";

import { useEffect, useState } from "react";

export type DeleteSubjectDialogProps = Readonly<{
  open: boolean;
  subjectName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}>;

export function DeleteSubjectDialog({
  open,
  subjectName,
  onCancel,
  onConfirm,
}: DeleteSubjectDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  const close = () => {
    if (busy) return;
    setEntered(false);
    setError("");
    onCancel();
  };

  const confirm = async () => {
    setBusy(true);
    setError("");

    try {
      await onConfirm();
      setEntered(false);
      onCancel();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The subject could not be deleted.");
      setBusy(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[70] grid min-h-[100dvh] place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md transition-opacity duration-200 ${entered ? "opacity-100" : "opacity-0"}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-subject-title"
        aria-describedby="delete-subject-description"
        className={`w-full max-w-md rounded-2xl border border-white/15 bg-white p-[clamp(1rem,4vw,1.75rem)] shadow-[0_32px_100px_rgba(15,23,42,0.3)] transition-all duration-200 ease-out ${entered ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-6">
            <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m-8.5 0 .8 11A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-2l.8-11M10 11v5m4-5v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </span>

        <h2 id="delete-subject-title" className="font-poppins mt-5 text-[clamp(1.25rem,5vw,1.75rem)] font-bold tracking-[-0.035em] text-slate-950">
          Permanently delete {subjectName}?
        </h2>
        <p id="delete-subject-description" className="mt-2 text-sm leading-6 text-slate-500">
          Are you sure you want to permanently delete this subject? This process will remove all linked assignments and cannot be undone.
        </p>

        {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}

        <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={close} className="min-h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
            Keep subject
          </button>
          <button type="button" disabled={busy} onClick={confirm} className="min-h-11 cursor-pointer rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(225,29,72,0.22)] transition-all hover:bg-rose-700 active:scale-[0.98] disabled:cursor-wait disabled:bg-rose-300 disabled:shadow-none">
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default DeleteSubjectDialog;
