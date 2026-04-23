import { useQuery, gql } from '@apollo/client'

const GET_ISSUES = gql`
  query GetIssues {
    getIssues {
      id title category status location urgent createdAt
      reportedBy { username }
    }
  }
`

const statusColors = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
}

export default function Dashboard() {
  const { data, loading, error } = useQuery(GET_ISSUES)

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading issues...</div>
  if (error) return <div className="text-center mt-20 text-red-500">Error: {error.message}</div>

  const issues = data?.getIssues || []

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-2">Community Issues</h1>
      <p className="text-gray-500 mb-6">{issues.length} issues reported</p>
      {issues.length === 0 && (
        <div className="text-center py-16 text-gray-400">No issues yet. Be the first to report one!</div>
      )}
      <div className="space-y-4">
        {issues.map(issue => (
          <div key={issue.id} className={`bg-white rounded-xl shadow p-5 border-l-4 ${issue.urgent ? 'border-red-500' : 'border-blue-400'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{issue.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{issue.location || 'No location provided'}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[issue.status]}`}>
                  {issue.status.replace('_', ' ').toUpperCase()}
                </span>
                {issue.urgent && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">⚠️ URGENT</span>}
              </div>
            </div>
            <div className="flex gap-3 mt-3 text-xs text-gray-400">
              <span>📂 {issue.category}</span>
              <span>👤 {issue.reportedBy?.username || 'Unknown'}</span>
              <span>🕐 {new Date(parseInt(issue.createdAt)).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}