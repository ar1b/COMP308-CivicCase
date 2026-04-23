import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SubmitIssue from './pages/SubmitIssue'
import StaffDashboard from './pages/StaffDashboard'
import Analytics from './pages/Analytics'
import Chatbot from './components/Chatbot'

function App() {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/submit" element={token ? <SubmitIssue /> : <Navigate to="/login" />} />
        <Route path="/staff" element={token && role === 'staff' ? <StaffDashboard /> : <Navigate to="/" />} />
        <Route path="/analytics" element={token ? <Analytics /> : <Navigate to="/login" />} />
      </Routes>
      {token && <Chatbot />}
    </div>
  )
}

export default App