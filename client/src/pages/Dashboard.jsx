import { useQuery, gql } from '@apollo/client'
import { Link } from 'react-router-dom'

const GET_MY_ISSUES = gql`
  query GetMyIssues {
    getMyIssues {
      id title category status location urgent createdAt
    }
  }
`

const statusColors = {
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
}

export default function Dashboard() {
  const { data, loading, error } = useQuery(GET_MY_ISSUES)

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading your issues...</div>
  if (error)   return <div className="text-center mt-20 text-red-500">Error: {error.message}</div>

  const issues = data?.getMyIssues || []

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-blue-700">My Reported Issues</h1>
        <Link to="/submit"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors">
          + Report Issue
        </Link>
      </div>
      <p className="text-gray-500 mb-6">{issues.length} issue{issues.length !== 1 ? 's' : ''} submitted by you</p>

      {issues.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-lg font-medium">No issues yet</p>
          <p className="text-sm mt-1">Use the button above to report a community issue.</p>
        </div>
      )}

      <div className="space-y-4">
        {issues.map(issue => (
          <div key={issue.id}
            className={`bg-white rounded-xl shadow p-5 border-l-4 ${issue.urgent ? 'border-red-500' : 'border-blue-400'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{issue.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{issue.location || 'No location provided'}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[issue.status]}`}>
                  {issue.status.replace('_', ' ').toUpperCase()}
                </span>
                {issue.urgent && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">⚠️ URGENT</span>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-3 text-xs text-gray-400">
              <span>📂 {issue.category}</span>
              <span>🕐 {new Date(parseInt(issue.createdAt)).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
