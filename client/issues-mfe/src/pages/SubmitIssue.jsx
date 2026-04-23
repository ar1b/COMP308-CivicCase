import { useState } from 'react'
import { useMutation, gql, ApolloProvider } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { client } from '../apolloClient'

const SUBMIT_ISSUE = gql`
  mutation SubmitIssue($title: String!, $description: String!, $location: String, $imageUrl: String) {
    submitIssue(title: $title, description: $description, location: $location, imageUrl: $imageUrl) {
      id title category status urgent
    }
  }
`

function SubmitIssuePage() {
  const [form, setForm]       = useState({ title: '', description: '', location: '', imageUrl: '' })
  const [submitted, setSubmitted] = useState(null)
  const [submitIssue, { loading }] = useMutation(SUBMIT_ISSUE)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { data } = await submitIssue({ variables: form })
    setSubmitted(data.submitIssue)
  }

  if (submitted) return (
    <div className="max-w-lg mx-auto mt-16 bg-white rounded-xl shadow p-8 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-green-600 mb-2">Issue Submitted!</h2>
      <p className="text-gray-600 mb-2">AI classified it as: <span className="font-semibold text-blue-700">{submitted.category}</span></p>
      {submitted.urgent && <p className="text-red-600 font-semibold mb-4">⚠️ Marked as URGENT</p>}
      <button onClick={() => navigate('/')} className="mt-4 bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800">
        View My Issues
      </button>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white rounded-xl shadow p-8">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">Report a Community Issue</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Issue Title</label>
          <input className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. Large pothole on Main St" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
          <textarea className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={4} placeholder="Describe the issue in detail..." value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Location (optional)</label>
          <input className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. 123 Main St, Toronto" value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Image URL (optional)</label>
          <input className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="https://..." value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50">
          {loading ? '🤖 AI is categorizing...' : 'Submit Issue'}
        </button>
      </form>
    </div>
  )
}

export default function SubmitIssue() {
  return <ApolloProvider client={client}><SubmitIssuePage /></ApolloProvider>
}
