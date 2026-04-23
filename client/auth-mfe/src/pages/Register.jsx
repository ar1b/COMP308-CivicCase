import { useState } from 'react'
import { useMutation, gql, ApolloProvider } from '@apollo/client'
import { useNavigate, Link } from 'react-router-dom'
import { client } from '../apolloClient'

const REGISTER = gql`
  mutation Register($username: String!, $email: String!, $password: String!, $role: String) {
    register(username: $username, email: $email, password: $password, role: $role) {
      token
      user { id username role }
    }
  }
`

function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'resident' })
  const [register, { loading, error }] = useMutation(REGISTER)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await register({ variables: form })
      localStorage.setItem('token',    data.register.token)
      localStorage.setItem('role',     data.register.user.role)
      localStorage.setItem('username', data.register.user.username)
      navigate('/')
      window.location.reload()
    } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">Create an Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Username" value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })} required />
          <input className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          <select className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="resident">Resident</option>
            <option value="staff">Municipal Staff</option>
          </select>
          {error && <p className="text-red-500 text-sm">{error.message}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function Register() {
  return <ApolloProvider client={client}><RegisterPage /></ApolloProvider>
}
