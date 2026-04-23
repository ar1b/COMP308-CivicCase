import { useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { useNavigate, Link } from 'react-router-dom'

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id username role }
    }
  }
`

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [login, { loading, error }] = useMutation(LOGIN)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await login({ variables: form })
      localStorage.setItem('token', data.login.token)
      localStorage.setItem('role', data.login.user.role)
      localStorage.setItem('username', data.login.user.username)
      navigate('/')
      window.location.reload()
    } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">Sign In to CivicCase</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          {error && <p className="text-red-500 text-sm">{error.message}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          No account? <Link to="/register" className="text-blue-600 font-semibold">Register here</Link>
        </p>
      </div>
    </div>
  )
}