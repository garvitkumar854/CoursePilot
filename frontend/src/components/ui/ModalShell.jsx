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
        transition={{ type: "spring", duration: 0.45, bounce: 0.2 }}
        className={`relative w-full ${maxWidth} rounded-[24px] sm:rounded-[32px] border border-white/20 bg-white p-5 sm:p-7 shadow-2xl md:p-8`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-2">{children}</div>
      </motion.div>
    </div>
  );
}
