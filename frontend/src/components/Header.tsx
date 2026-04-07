import { NavLink } from 'react-router-dom'

function Header() {
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