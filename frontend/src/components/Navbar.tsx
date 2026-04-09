import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

function Navbar() {
  const { authSession, isAuthenticated, isLoading } = useAuth();
  const roles = authSession?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isDonor = roles.includes("Supporter") || roles.includes("Donor");
  const donorDashboardPath = authSession?.supporterId != null
    ? `/donor-dashboard/${authSession.supporterId}`
    : "/login";
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLanding) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  const navClass = [
    "beacon-navbar",
    isLanding ? "beacon-navbar--fixed" : "beacon-navbar--static",
    isLanding && !scrolled ? "beacon-navbar--glass" : "",
    !isLanding ? "beacon-navbar--solid" : "",
    scrolled ? "beacon-navbar--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  /** On the home page use in-page anchors; elsewhere link back to home with hash */
  const sectionHref = (fragment: string) =>
    isLanding ? `#${fragment}` : `/#${fragment}`;

  const primaryNavLinks = (
    <>
      <a href={sectionHref("mission")} onClick={() => setMenuOpen(false)}>
        About
      </a>
      <a href={sectionHref("impact")} onClick={() => setMenuOpen(false)}>
        Impact
      </a>
      <NavLink to="/donate" onClick={() => setMenuOpen(false)}>
        Donate
      </NavLink>
      <a href={sectionHref("involved")} onClick={() => setMenuOpen(false)}>
        Contact Us
      </a>
    </>
  );

  const roleNavLinks = (
    <>
      {isAdmin && (
        <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
          Dashboard
        </NavLink>
      )}
      {isDonor && (
        <NavLink to={donorDashboardPath} onClick={() => setMenuOpen(false)}>
          Dashboard
        </NavLink>
      )}
    </>
  );

  return (
    <nav className={navClass}>
      <div className="beacon-navbar__inner">
        {/* Left: logo */}
        <Link to="/" className="beacon-navbar__brand">
          <img src="/logo.png" alt="Beacon" className="beacon-navbar__logo" />
        </Link>

        {/* Center: nav links */}
        <div className={`beacon-navbar__center ${menuOpen ? "beacon-navbar__center--open" : ""}`}>
          {primaryNavLinks}
          {roleNavLinks}
        </div>

        {/* Right: auth links + CTA */}
        <div className={`beacon-navbar__right ${menuOpen ? "beacon-navbar__right--open" : ""}`}>
          {!isLoading && isAuthenticated ? (
            <NavLink to="/logout" onClick={() => setMenuOpen(false)}>
              Sign Out
            </NavLink>
          ) : (
            <NavLink to="/login" onClick={() => setMenuOpen(false)}>
              Sign In
            </NavLink>
          )}
          {!isLoading && !isAuthenticated && (
          <Link
            to="/register"
            className="beacon-navbar__cta"
            onClick={() => setMenuOpen(false)}
          >
            Register
          </Link>
          )}
        </div>

        {/* Hamburger (mobile) */}
        <button
          className={`beacon-navbar__toggle ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="beacon-navbar__mobile">
          {primaryNavLinks}
          {roleNavLinks}
          {!isLoading && isAuthenticated ? (
            <NavLink to="/logout" onClick={() => setMenuOpen(false)}>Sign Out</NavLink>
          ) : (
            <NavLink to="/login" onClick={() => setMenuOpen(false)}>Sign In</NavLink>
          )}
          {!isLoading && !isAuthenticated && (
            <Link to="/register" className="beacon-navbar__cta" onClick={() => setMenuOpen(false)}>
              Register
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
