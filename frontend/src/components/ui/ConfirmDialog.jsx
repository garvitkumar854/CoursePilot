import ModalShell from "./ModalShell";
import Button from "./Button";

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
  destructive = false,
}) {
  return (
    <ModalShell title={title} description={description} onClose={onClose}>
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button
          onClick={onConfirm}
          className={
            destructive
              ? "bg-[#ef4444] text-white hover:bg-[#dc2626]"
              : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
          }
        >
          {confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
}
