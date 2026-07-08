export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[color:var(--cp-accent)]/15";

  const variants = {
    primary:
      "bg-[color:var(--cp-fg)] text-[color:var(--cp-bg)] hover:opacity-95 hover:shadow-lg",

    secondary:
      "border border-black/8 bg-white/80 text-[color:var(--cp-fg)] hover:bg-white",

    danger:
      "bg-[color:var(--cp-support)] text-[color:var(--cp-bg)] hover:opacity-95",

    ghost: "text-black/60 hover:bg-black/5",
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
