import './App.css'
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import LogoutPage from './pages/LogoutPage.tsx'
import ResidentsPage from './pages/ResidentsPage.tsx'
import DonorPage from './pages/DonorPage.tsx'
import PartnerPage from './pages/PartnerPage.tsx'
import SafehousePage from './pages/SafehousePage.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import AdminResidentPage from './pages/AdminResidentPage.tsx'
import LandingPage from './pages/LandingPage.tsx'

function App() {

  return (
    <>
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/residents" element={<ResidentsPage />} />
        <Route path="/admin/residents" element={<AdminResidentPage />} />
        <Route path="/donor/:id" element={<DonorPage />} />
        <Route path="/partner/:id" element={<PartnerPage />} />
        <Route path="/safehouse/:id" element={<SafehousePage />} />
      </Routes>
    </Router>

    </AuthProvider>
    </>
  )
}

export default App
