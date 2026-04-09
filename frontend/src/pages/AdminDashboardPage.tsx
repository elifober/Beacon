import { useState } from "react";
import SearchBar from "../components/SearchBar";
import { Link } from "react-router-dom";
import heroForestImage from "../assets/forrest.jpg";
import { AddEducationRecordModal } from "../components/resident/AddEducationRecordModal";
import { AddHealthRecordModal } from "../components/resident/AddHealthRecordModal";
import { AddProcessRecordingModal } from "../components/resident/AddProcessRecordingModal";
import { AddHomeVisitationModal } from "../components/resident/AddHomeVisitationModal";
import { AddIncidentReportModal } from "../components/resident/AddIncidentReportModal";
import { DonateInlineBanner } from "../components/DonateInlineBanner";

const navLinks = [
  { to: "/admin/all-residents", label: "Residents" },
  { to: "/admin/all-safehouses", label: "Safehouses" },
  { to: "/admin/all-partners", label: "Partners" },
  { to: "/admin/all-donors", label: "Donors" },
  { to: "/admin/all-donations", label: "Donations" },
  { to: "/admin/risk", label: "Risk Center" },
  { to: "/admin/post-planner", label: "Post Planner" },
] as const;

type ResidentRecordModalKey =
  | "education"
  | "health"
  | "process"
  | "homeVisit"
  | "incident";

const addResidentRecordLinks: { key: ResidentRecordModalKey; label: string }[] = [
  { key: "education", label: "Add education record" },
  { key: "health", label: "Add health record" },
  { key: "process", label: "Add mental wellbeing record" },
  { key: "homeVisit", label: "Add home visit" },
  { key: "incident", label: "Add incident report" },
];

function AdminDashboardPage() {
  const [residentRecordModal, setResidentRecordModal] = useState<ResidentRecordModalKey | null>(
    null,
  );
  const [adminHeroFallback, setAdminHeroFallback] = useState(false);

  return (
    <div className="admin-dashboard beacon-page">
      <header className="admin-dashboard__hero" aria-label="Admin dashboard header">
        <img
          className="admin-dashboard__hero-img"
          src={adminHeroFallback ? heroForestImage : "/admin_dashboard.jpg"}
          alt=""
          decoding="async"
          onError={() => setAdminHeroFallback(true)}
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Beacon admin</p>
          <h1 className="admin-dashboard__hero-title">Dashboard</h1>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <div className="admin-dashboard__search-wrap">
            <SearchBar maxWidth={760} inputClassName="rounded-pill px-4 py-2" />
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-lg-8">
              <div className="admin-dashboard__panel h-100">
                <p className="landing-section__eyebrow mb-2">Overview</p>
                <h2 className="landing-section__heading mb-3">Welcome back</h2>
                <p className="landing-section__body mb-0">
                  Search above to open a record quickly, or use the links to manage
                  residents, safehouses, partners, donors, and donations.
                </p>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="admin-dashboard__nav-card">
                <p className="landing-section__eyebrow mb-3">Navigate</p>
                <nav className="admin-dashboard__nav" aria-label="Admin sections">
                  {navLinks.map(({ to, label }) => (
                    <Link key={to} to={to} className="admin-dashboard__nav-link">
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="row g-4 align-items-stretch mt-lg-2 mt-4">
            <div className="col-12">
              <div className="admin-dashboard__nav-card">
                <p className="landing-section__eyebrow mb-3">Resident records</p>
                <p className="landing-section__body small text-muted mb-3">
                  Open a form to enter a new record. You will be prompted for the resident ID (and
                  other required fields) on each form.
                </p>
                <nav className="admin-dashboard__nav" aria-label="Add resident record">
                  {addResidentRecordLinks.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className="admin-dashboard__nav-link"
                      onClick={() => setResidentRecordModal(key)}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DonateInlineBanner />

      <AddEducationRecordModal
        open={residentRecordModal === "education"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
      <AddHealthRecordModal
        open={residentRecordModal === "health"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
      <AddProcessRecordingModal
        open={residentRecordModal === "process"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
      <AddHomeVisitationModal
        open={residentRecordModal === "homeVisit"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
      <AddIncidentReportModal
        open={residentRecordModal === "incident"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
    </div>
  );
}

export default AdminDashboardPage;
