import { Link, useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')
  const role     = localStorage.getItem('role')
  const username = localStorage.getItem('username')

  const logout = () => {
    localStorage.clear()
    navigate('/login')
    window.location.reload()
  }

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link to="/" className="text-xl font-bold tracking-wide">🏙️ CivicCase</Link>
      <div className="flex gap-4 items-center text-sm">
        {token ? (
          <>
            <Link to="/" className="hover:underline">My Issues</Link>
            <Link to="/submit" className="hover:underline">Report Issue</Link>
            {role === 'staff' && (
              <Link to="/analytics" className="hover:underline">Analytics</Link>
            )}
            {role === 'staff' && (
              <Link to="/staff" className="hover:underline font-semibold text-yellow-300">Staff Panel</Link>
            )}
            <NotificationBell />
            <span className="text-blue-200">Hi, {username}</span>
            <button onClick={logout} className="bg-white text-blue-700 px-3 py-1 rounded font-semibold hover:bg-blue-100">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="bg-white text-blue-700 px-3 py-1 rounded font-semibold hover:bg-blue-100">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
