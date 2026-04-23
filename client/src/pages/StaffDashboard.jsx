import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'

const GET_ISSUES = gql`
  query { getIssues {
    id title category status location urgent createdAt
    reportedBy { username }
  }}
`
const UPDATE_STATUS = gql`
  mutation UpdateIssueStatus($id: ID!, $status: String!) {
    updateIssueStatus(id: $id, status: $status) { id status }
  }
`
const DELETE_ISSUE = gql`
  mutation DeleteIssue($id: ID!) { deleteIssue(id: $id) }
`

const statusColors = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
}

export default function StaffDashboard() {
  const { data, loading, refetch } = useQuery(GET_ISSUES)
  const [updateStatus] = useMutation(UPDATE_STATUS)
  const [deleteIssue] = useMutation(DELETE_ISSUE)
  const [filter, setFilter] = useState('all')

  const issues = data?.getIssues || []
  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter)

  const handleStatusChange = async (id, status) => {
    await updateStatus({ variables: { id, status } })
    refetch()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this issue?')) return
    await deleteIssue({ variables: { id } })
    refetch()
  }

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-2">Staff Management Panel</h1>
      <div className="flex gap-2 mb-6">
        {['all', 'open', 'in_progress', 'resolved'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${filter === s ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            {s.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map(issue => (
          <div key={issue.id} className={`bg-white rounded-xl shadow p-5 border-l-4 ${issue.urgent ? 'border-red-500' : 'border-blue-400'}`}>
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{issue.title}</h3>
                <p className="text-sm text-gray-500">{issue.location || 'No location'} • {issue.reportedBy?.username}</p>
                <p className="text-xs text-gray-400 mt-1">📂 {issue.category} {issue.urgent && '⚠️ URGENT'}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={issue.status}
                  onChange={e => handleStatusChange(issue.id, e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button onClick={() => handleDelete(issue.id)}
                  className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 font-semibold">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-10 text-gray-400">No issues found.</p>}
      </div>
    </div>
  )
}