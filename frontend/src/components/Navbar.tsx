import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <header>
      <div>
        <Link to="/" className="text-decoration-none">
          <p className="beacon-site-title">The Beacon Project</p>
        </Link>
      </div>
      <div className="d-flex gap-2 align-items-center">
        {!isLoading && !isAuthenticated ? (
          <>
            <NavLink to="/login">Sign In</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        ) : null}
        {!isLoading && isAuthenticated ? <NavLink to="/logout">Logout</NavLink> : null}
      </div>
    </header>
  );
}

export default Navbar;
