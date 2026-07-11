import { motion } from "motion/react";

// ✅ Variants outside component — never recreated
const buttonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.03,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.96,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
  },
};

export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[color:var(--cp-accent)]/15 cursor-pointer select-none";

  const variants = {
    primary:
      "bg-[#2563eb] text-white hover:bg-[#1d4ed8] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    secondary:
      "border border-black/8 bg-white/80 text-[color:var(--cp-fg)] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed",
    danger:
      "bg-[color:var(--cp-support)] text-[color:var(--cp-bg)] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost:
      "text-black/60 hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      variants={buttonVariants}
      initial="initial"
      whileHover={disabled ? "disabled" : "hover"}
      whileTap={disabled ? "disabled" : "tap"}
      animate={disabled ? "disabled" : "initial"}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}