import { X, AlertTriangle } from "lucide-react";
import Button from "./Button";
import { motion } from "motion/react";

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="relative w-full max-w-md rounded-[32px] border border-white/20 bg-white p-8 shadow-2xl md:p-10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${destructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
