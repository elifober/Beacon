import { type FormEvent, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getManagingResidents } from "../api/Residents";
import type { Resident } from "../types/Resident";

function AdminResidentPage() {
  const { authSession, isLoading } = useAuth();
  const isAdmin = (authSession?.roles ?? []).includes("Admin");
  const [resident, setResident] = useState<Resident[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isLoading && isAdmin) {
      void loadResidents();
    }
  }, [isAdmin, isLoading]);

  async function loadResidents() {
    try {
      const data = await getManagingResidents();
      setResident(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load residents",
      );
    }
  }

  async function handleRefresh(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    await loadResidents();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <Navbar />
      <h1 className="text-2xl font-bold mb-3">Admin Resident Page</h1>
      <p className="text-center text-muted mb-4 max-w-lg">
        Add new residents from the{" "}
        <Link to="/admin" className="fw-semibold">
          admin dashboard
        </Link>{" "}
        → <strong>New resident</strong> (full intake form).
      </p>
      {errorMessage ? <p className="text-red-600 mb-2">{errorMessage}</p> : null}
      <form onSubmit={handleRefresh} className="mb-4">
        <button type="submit" className="btn btn-outline-secondary btn-sm">
          Refresh list
        </button>
      </form>
      <p className="small text-muted mb-2">{resident.length} resident(s) loaded</p>
      <ul className="list-unstyled small text-start" style={{ maxHeight: "40vh", overflow: "auto" }}>
        {resident.slice(0, 50).map((r) => (
          <li key={r.residentId}>
            #{r.residentId} — {(r.firstName ?? "") + " " + (r.lastInitial ?? "")}
          </li>
        ))}
        {resident.length > 50 ? (
          <li className="text-muted">…and {resident.length - 50} more</li>
        ) : null}
      </ul>
    </div>
  );
}

export default AdminResidentPage;
