import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'

function Header() {
    const { authSession, isAuthenticated, isLoading} = useAuth();

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
            <div><h1>Beacon</h1></div>
        <div>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/logout">Logout</NavLink>
        </div>    
        
        </header>
    )
}

export default Header