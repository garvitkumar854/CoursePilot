export default function Card({
  children,
  className = "",
  hover = true,
  ...props
}) {
  return (
    <div
      {...props}
      className={`
        group
        rounded-[32px]
        border
        border-slate-200
        bg-white
        shadow-sm
        transition-all
        duration-300
        ${
          hover
            ? "hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70"
            : ""
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}
