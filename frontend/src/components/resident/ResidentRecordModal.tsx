import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type ResidentRecordModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Shown below the white dialog card (e.g. pagination), not inside the card */
  belowCard?: React.ReactNode;
  /** Narrower shell width (e.g. forms) */
  narrow?: boolean;
};

export function ResidentRecordModal({
  title,
  open,
  onClose,
  children,
  belowCard,
  narrow,
}: ResidentRecordModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="resident-record-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={
          narrow
            ? "resident-record-modal-shell resident-record-modal-shell--narrow"
            : "resident-record-modal-shell"
        }
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div
          className="resident-record-modal-dialog card shadow-lg border-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="resident-record-modal-header card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between gap-3">
            <h2 id={titleId} className="h5 mb-0 fw-semibold">
              {title}
            </h2>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              aria-label="Close"
            >
              Close
            </button>
          </div>
          <div className="resident-record-modal-body card-body p-0">{children}</div>
        </div>
        {belowCard ? (
          <div className="resident-record-modal-below w-100 d-flex justify-content-center">
            {belowCard}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
