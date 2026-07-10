import { X } from "lucide-react";
import { motion } from "motion/react";

export default function ModalShell({
  title,
  description,
  children,
  onClose,
  maxWidth = "max-w-lg",
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
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
        className={`relative w-full ${maxWidth} rounded-[32px] border border-white/20 bg-white p-8 shadow-2xl md:p-10`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                {description}
              </p>
            ) : null}
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
        <div className="mt-2">{children}</div>
      </motion.div>
    </div>
  );
}
