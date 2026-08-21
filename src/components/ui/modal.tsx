"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ModalSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-[26rem]",
  md: "max-w-[30rem]",
  lg: "max-w-[34rem]",
};

export type ModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  /** Accessible name. Rendered as the dialog heading unless `header` is given. */
  title?: ReactNode;
  description?: ReactNode;
  /** Fully custom header replacing the default title block. */
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  /** `alertdialog` for destructive confirmations. */
  role?: "dialog" | "alertdialog";
  /** Hide the round close button (destructive confirmations use explicit actions). */
  showClose?: boolean;
  /** Block backdrop/Escape dismissal while a request is in flight. */
  dismissible?: boolean;
  className?: string;
  labelledBy?: string;
  /** Accessible name for the close button. */
  closeLabel?: string;
}>;

let openModalCount = 0;

const noopSubscribe = () => () => {};
/** Portals need a DOM: false during SSR/hydration, true afterwards. */
const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/**
 * One modal architecture for the whole app.
 *
 * Why a portal: `app/layout.tsx` renders page content inside
 * `<div className="relative z-10">`, which is a *stacking context*. Any dialog
 * rendered from inside a page (e.g. the subject card's permanent-delete
 * dialog) is trapped in that context and can never paint above the
 * `sticky z-40` navbar, no matter how large its own z-index is. Portaling to
 * `document.body` puts the backdrop in the root stacking context, so the
 * blur/dim covers the navbar too.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  header,
  children,
  footer,
  size = "md",
  role = "dialog",
  showClose = true,
  dismissible = true,
  className = "",
  labelledBy,
  closeLabel = "Close",
}: ModalProps) {
  const mounted = useIsClient();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const titleId = labelledBy ?? `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;

  const requestClose = useCallback(() => {
    if (!dismissible) return;
    onClose();
  }, [dismissible, onClose]);

  // Background scroll lock, reference-counted so stacked dialogs restore the
  // page exactly once. No scrollbar-width padding compensation: `html` already
  // reserves a stable scrollbar gutter (globals.css), so adding padding here
  // would move the page sideways and register as layout shift.
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;

    if (openModalCount === 0) {
      body.style.overflow = "hidden";
    }

    openModalCount += 1;

    return () => {
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        body.style.overflow = previousOverflow;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, requestClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      data-modal-backdrop=""
      className="modal-backdrop gpu-fade fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={surfaceRef}
        role={role}
        aria-modal="true"
        aria-labelledby={title || labelledBy ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={`modal-surface gpu-enter-scale rounded-card relative my-auto flex max-h-[calc(100dvh-1.5rem)] w-full flex-col ${SIZE_CLASS[size]} border border-white/15 bg-white p-4 shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:max-h-[calc(100dvh-2.5rem)] sm:p-6 ${className}`}
      >
        {showClose ? (
          <button
            type="button"
            onClick={requestClose}
            aria-label={closeLabel}
            className="rounded-control absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:right-4 sm:top-4"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-[2]">
              <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}

        {header ?? (
          title ? (
            <div className={showClose ? "pr-10" : undefined}>
              <h2
                id={titleId}
                className="text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-900 sm:text-xl"
              >
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1.5 text-[0.8rem] leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  {description}
                </p>
              ) : null}
            </div>
          ) : null
        )}

        <div className="contain-scroll -mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1 sm:mt-5">
          {children}
        </div>

        {footer ? <div className="mt-4 shrink-0 sm:mt-5">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

/** Standard action row: stacked on mobile, right-aligned from `sm` up. */
export function ModalActions({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2.5">
      {children}
    </div>
  );
}

export default Modal;
