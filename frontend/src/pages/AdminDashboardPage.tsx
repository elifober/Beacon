import SearchBar from "../components/SearchBar";
import { Link } from "react-router-dom";
import heroForestImage from "../assets/forrest.jpg";

const navLinks = [
  { to: "/admin/all-residents", label: "Residents" },
  { to: "/admin/all-safehouses", label: "Safehouses" },
  { to: "/admin/all-partners", label: "Partners" },
  { to: "/admin/all-donors", label: "Donors" },
  { to: "/admin/all-donations", label: "Donations" },
  { to: "/admin/risk", label: "Risk Center" },
] as const;

function AdminDashboardPage() {
  return (
    <div className="admin-dashboard beacon-page">
      <header className="admin-dashboard__hero" aria-label="Admin dashboard header">
        <img
          className="admin-dashboard__hero-img"
          src={heroForestImage}
          alt=""
          decoding="async"
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
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
