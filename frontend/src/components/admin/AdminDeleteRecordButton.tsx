import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  deleteBeaconEntity,
  type AdminDeletableEntity,
} from "../../api/adminEntityDelete";

type AdminDeleteRecordButtonProps = {
  entity: AdminDeletableEntity;
  id: string | undefined;
  /** Shown on the button */
  label?: string;
  /** window.confirm text */
  confirmMessage: string;
  /** React Router path after successful delete */
  redirectTo: string;
  className?: string;
};

export function AdminDeleteRecordButton({
  entity,
  id,
  label = "Delete record",
  confirmMessage,
  redirectTo,
  className = "",
}: AdminDeleteRecordButtonProps) {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = authSession?.roles.includes("Admin") ?? false;

  if (!isAdmin || !id) {
    return null;
  }

  async function onClick() {
    if (!id) return;
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteBeaconEntity(entity, id);
      navigate(redirectTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      {error ? (
        <div className="alert alert-danger py-2 mb-2" role="alert">
          {error}
        </div>
      ) : null}
      <button
        type="button"
        className="btn btn-outline-danger"
        disabled={busy}
        onClick={() => void onClick()}
      >
        {busy ? "Deleting…" : label}
      </button>
    </div>
  );
}
