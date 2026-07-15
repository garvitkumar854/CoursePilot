import { useEffect } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { motion } from "motion/react";
import Button from "./Button";

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

// ✅ Icon bounces in separately
const iconVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.16, ease: "easeOut", delay: 0.03 },
  },
};

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onClose,
}) {
  // ✅ Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // ✅ Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ✅ Icon varies by type
  const Icon = destructive ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6">

      {/* ✅ Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ✅ Dialog panel */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ willChange: "transform, opacity" }}
        className="relative w-full max-w-md rounded-[32px] border border-white/20 bg-white p-8 shadow-2xl md:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ Icon + Text row */}
        <motion.div
          variants={childVariants}
          className="flex items-start gap-4"
        >
          {/* ✅ Animated icon */}
          <motion.div
            variants={iconVariants}
            className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              destructive
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            <Icon size={20} />
          </motion.div>

          {/* ✅ Title + Description */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
              {description}
            </p>
          </div>
        </motion.div>

        {/* ✅ Action buttons */}
        <motion.div
          variants={childVariants}
          className="mt-8 flex flex-wrap justify-end gap-3"
        >
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}