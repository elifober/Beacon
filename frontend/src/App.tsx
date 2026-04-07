import './App.css'
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import LogoutPage from './pages/LogoutPage.tsx'

function App() {

  return (
    <>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/logout" element={<LogoutPage />} />
      </Routes>
    </Router>

    
    </>
  )
}

export default App
