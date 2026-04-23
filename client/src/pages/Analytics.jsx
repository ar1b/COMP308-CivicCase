import { useQuery, gql } from '@apollo/client'

const GET_ANALYTICS = gql`
  query {
    getAnalytics {
      totalIssues openIssues inProgressIssues resolvedIssues
      categoryBreakdown { category count }
    }
  }
`

export default function Analytics() {
  const { data, loading } = useQuery(GET_ANALYTICS)

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading analytics...</div>

  const a = data?.getAnalytics
  if (!a) return null

  const cards = [
    { label: 'Total Issues', value: a.totalIssues, color: 'bg-blue-600' },
    { label: 'Open', value: a.openIssues, color: 'bg-red-500' },
    { label: 'In Progress', value: a.inProgressIssues, color: 'bg-yellow-500' },
    { label: 'Resolved', value: a.resolvedIssues, color: 'bg-green-500' },
  ]

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Analytics & Insights</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className={`${card.color} text-white rounded-xl p-5 text-center shadow`}>
            <div className="text-4xl font-bold">{card.value}</div>
            <div className="text-sm mt-1 font-medium opacity-90">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Issues by Category</h2>
        <div className="space-y-3">
          {a.categoryBreakdown.map(({ category, count }) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{category}</span>
                <span className="text-gray-500">{count}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${(count / a.totalIssues) * 100}%` }} />
              </div>
            </div>
          ))}
          {a.categoryBreakdown.length === 0 && <p className="text-gray-400 text-center py-4">No data yet</p>}
        </div>
      </div>
    </div>
  )
}