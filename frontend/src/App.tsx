import './App.css'
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import LogoutPage from './pages/LogoutPage.tsx'
import DonorPage from './pages/DonorPage.tsx'
import PartnerPage from './pages/PartnerPage.tsx'
import SafehousePage from './pages/SafehousePage.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import LandingPage from './pages/LandingPage.tsx'
import DonorDashboardPage from './pages/DonorDashboardPage.tsx'
import AdminDashboardPage from './pages/AdminDashboardPage.tsx'
import ResidentPage from './pages/ResidentPage.tsx'
import AdminAllResidentsPage from './pages/AdminAllResidentsPage.tsx'
import AdminAllPartnersPage from './pages/AdminAllPartnersPage.tsx'
import AdminAllDonorsPage from './pages/AdminAllDonorsPage.tsx'
import AdminAllDonationsPage from './pages/AdminAllDonationsPage.tsx'
import AdminAllSafehousesPage from './pages/AdminAllSafehousesPage.tsx'
import Navbar from './components/Navbar.tsx'
import RequireRole from './components/RequireRole'
import RequireAuth from './components/RequireAuth'
import PostPlanner from './pages/marketing/PostPlanner.tsx'


function App() {

  return (
    <>
    <AuthProvider>
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/logout" element={<RequireAuth><LogoutPage /></RequireAuth>} />

        <Route
          path="/donor-dashboard/:id"
          element={<RequireRole anyOf={['Supporter', 'Admin']}><DonorDashboardPage /></RequireRole>}
        />
        <Route
          path="/donor/:id"
          element={<RequireRole anyOf={['Supporter', 'Admin']}><DonorPage /></RequireRole>}
        />
        <Route
          path="/partner/:id"
          element={<RequireRole anyOf={['Partner', 'Admin']}><PartnerPage /></RequireRole>}
        />

        <Route
          path="/safehouse/:id"
          element={<RequireRole anyOf={['Admin']}><SafehousePage /></RequireRole>}
        />
        <Route
          path="/resident/:id"
          element={<RequireRole anyOf={['Admin']}><ResidentPage /></RequireRole>}
        />

        <Route path="/admin" element={<RequireRole anyOf={['Admin']}><AdminDashboardPage /></RequireRole>} />
        <Route path="/admin/all-residents" element={<RequireRole anyOf={['Admin']}><AdminAllResidentsPage /></RequireRole>} />
        <Route path="/admin/all-partners" element={<RequireRole anyOf={['Admin']}><AdminAllPartnersPage /></RequireRole>} />
        <Route path="/admin/all-donors" element={<RequireRole anyOf={['Admin']}><AdminAllDonorsPage /></RequireRole>} />
        <Route path="/admin/all-donations" element={<RequireRole anyOf={['Admin']}><AdminAllDonationsPage /></RequireRole>} />
        <Route path="/admin/all-safehouses" element={<RequireRole anyOf={['Admin']}><AdminAllSafehousesPage /></RequireRole>} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/donor-dashboard/:id" element={<DonorDashboardPage />} />
        <Route path="/donor/:id" element={<DonorPage />} />
        <Route path="/partner/:id" element={<PartnerPage />} />
        <Route path="/safehouse/:id" element={<SafehousePage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/all-residents" element={<AdminAllResidentsPage />} />
        <Route path="/admin/all-partners" element={<AdminAllPartnersPage />} />
        <Route path="/admin/all-donors" element={<AdminAllDonorsPage />} />
        <Route path="/admin/all-donations" element={<AdminAllDonationsPage />} />
        <Route path="/admin/all-safehouses" element={<AdminAllSafehousesPage />} />
        <Route path="/admin/post-planner" element={<PostPlanner />} />
        <Route path="/resident/:id" element={<ResidentPage />} />
      </Routes>
    </Router>

    </AuthProvider>
    </>
  )
}

export default App
