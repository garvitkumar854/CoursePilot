import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

// ✅ All variants outside component
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: 0.12, ease: "easeOut" },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.16, ease: "easeOut" },
  },
};

export default function ModalShell({
  title,
  description,
  children,
  onClose,
  maxWidth = "max-w-lg",
}) {
  // ✅ Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // ✅ Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      {/* ✅ Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ✅ Modal panel */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ willChange: "transform, opacity" }}
        className={`relative w-full ${maxWidth} rounded-[24px] sm:rounded-[32px] border border-white/20 bg-white p-5 sm:p-7 shadow-2xl md:p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ Header row with close button */}
        <motion.div
          variants={childVariants}
          className="flex items-start justify-between gap-4 mb-5 sm:mb-6"
        >
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-slate-500">
                {description}
              </p>
            )}
          </div>

          {/* ✅ Close button */}
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.1, backgroundColor: "rgb(241 245 249)" }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={17} />
          </motion.button>
        </motion.div>

        {/* ✅ Content */}
        <motion.div variants={childVariants} className="mt-2">
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}