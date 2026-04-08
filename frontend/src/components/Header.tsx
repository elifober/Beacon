import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'

function Header() {
    const { authSession, isAuthenticated, isLoading} = useAuth();
    const roles = authSession?.roles ?? [];
    const isAdmin = roles.includes('Admin');

    let statusClassName = 'badge rounded-pill text-bg-secondary';
    let statusText = 'Checking auth...';

    if (!isLoading && isAuthenticated) {
        statusClassName = 'badge rounded-pill text-bg-success';
        statusText = `Signed in as ${authSession?.userName ?? authSession?.email ?? 'user'}`;
    }

    if (!isLoading && !isAuthenticated) {
        statusClassName = 'badge rounded-pill text-bg-warning';
        statusText = 'Signed out';
    }
    
    return (
        <header>
            <div><h1>The Beacon Project</h1></div>
        <div>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/logout">Logout</NavLink>
            {isAdmin ?( <NavLink to="/admin/residents">Admin</NavLink>) : null}
            <span className={statusClassName} style={{ marginLeft: '0.75rem' }}>
                {statusText}
            </span>
        </div>    
        </header>
    );
}

export default Header;