import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { showGlobalSiteAnnouncement } from "./SiteAnnouncementBar";

/**
 * Top navigation.
 *
 * Architecture notes:
 * - Uses roles from `/api/auth/me` (via `AuthContext`) to show role-appropriate dashboard links.
 * - The UI only hides/shows links; backend policies still enforce actual access.
 * - Navbar styling changes based on the route (marketing/landing “glass” vs app “solid”).
 */
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
  const isDonatePage = location.pathname === "/donate";
  const globalSiteAnnouncement = showGlobalSiteAnnouncement(location.pathname);
  const isAuthOverlay =
    location.pathname === "/login" ||
    location.pathname === "/logout" ||
    location.pathname === "/register" ||
    location.pathname === "/complete-profile" ||
    location.pathname === "/donate" ||
    location.pathname === "/about" ||
    location.pathname === "/impact" ||
    location.pathname === "/contact" ||
    location.pathname === "/privacy-policy" ||
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/") ||
    location.pathname.startsWith("/donor-dashboard/");

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /** Same fixed + glass-at-top behavior as the landing hero on all overlay marketing routes */
  const isFixedGlassNav = isLanding || isAuthOverlay;

  useEffect(() => {
    if (!isFixedGlassNav) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isFixedGlassNav, location.pathname]);

  /* Donate: keep hero glass nav when scrolling — no switch to solid scrolled bar */
  const glassAtTop = isFixedGlassNav && (!scrolled || isDonatePage);
  const solidAfterScroll = isFixedGlassNav && scrolled && !isDonatePage;

  const navClass = [
    "beacon-navbar",
    isFixedGlassNav ? "beacon-navbar--fixed" : "beacon-navbar--static",
    isAuthOverlay ? "beacon-navbar--auth-overlay" : "",
    globalSiteAnnouncement ? "beacon-navbar--below-global-announcement" : "",
    glassAtTop ? "beacon-navbar--glass" : "",
    !isFixedGlassNav ? "beacon-navbar--solid" : "",
    solidAfterScroll ? "beacon-navbar--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const primaryNavLinks = (
    <>
      <NavLink to="/about" onClick={() => setMenuOpen(false)}>
        About
      </NavLink>
      <NavLink to="/impact" onClick={() => setMenuOpen(false)}>
        Impact
      </NavLink>
      <NavLink to="/donate" onClick={() => setMenuOpen(false)}>
        Donate
      </NavLink>
      <NavLink to="/contact" onClick={() => setMenuOpen(false)}>
        Contact Us
      </NavLink>
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
