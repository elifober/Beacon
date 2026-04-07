import './App.css'
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import LogoutPage from './pages/LogoutPage.tsx'
import ResidentsPage from './pages/ResidentsPage.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

function App() {

  return (
    <>
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/residents" element={<ResidentsPage />} />
      </Routes>
    </Router>

    </AuthProvider>
    </>
  )
}

export default App
