import { X } from "lucide-react";

export default function ModalShell({
  title,
  description,
  children,
  onClose,
  maxWidth = "max-w-lg",
}) {
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center px-4 py-6 backdrop-blur-xl"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.45)" }}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-[32px] border border-[#e2e8f0] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)] md:p-8`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#64748b] transition hover:bg-black/5 hover:text-[#0f172a]"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
