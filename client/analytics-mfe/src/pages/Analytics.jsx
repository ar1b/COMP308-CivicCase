import { useState } from 'react'
import { useQuery, useLazyQuery, gql, ApolloProvider } from '@apollo/client'
import { client } from '../apolloClient'

const GET_ANALYTICS = gql`
  query {
    getAnalytics {
      totalIssues openIssues inProgressIssues resolvedIssues
      categoryBreakdown { category count }
    }
  }
`
const GET_TREND = gql`query { getAITrendAnalysis }`

function AnalyticsPage() {
  const { data, loading } = useQuery(GET_ANALYTICS)
  const [getTrend, { data: trendData, loading: trendLoading, called }] = useLazyQuery(GET_TREND)
  const [trendOpen, setTrendOpen] = useState(false)

  const handleTrendClick = () => { if (!called) getTrend(); setTrendOpen(true) }

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading analytics...</div>

  const a = data?.getAnalytics
  if (!a) return null

  const cards = [
    { label: 'Total Issues',  value: a.totalIssues,       color: 'bg-blue-600' },
    { label: 'Open',          value: a.openIssues,         color: 'bg-red-500'  },
    { label: 'In Progress',   value: a.inProgressIssues,   color: 'bg-yellow-500' },
    { label: 'Resolved',      value: a.resolvedIssues,     color: 'bg-green-500' },
  ]

  const resolutionRate = a.totalIssues > 0
    ? Math.round((a.resolvedIssues / a.totalIssues) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Analytics & Insights</h1>
        <button onClick={handleTrendClick}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">
          🤖 AI Trend Analysis
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map(card => (
          <div key={card.label} className={`${card.color} text-white rounded-xl p-5 text-center shadow`}>
            <div className="text-4xl font-bold">{card.value}</div>
            <div className="text-sm mt-1 font-medium opacity-90">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Resolution Rate</p>
            <p className="text-2xl font-bold text-gray-800">{resolutionRate}%</p>
          </div>
          <div className="w-48 bg-gray-100 rounded-full h-4">
            <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>
      </div>
      {trendOpen && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
            🤖 AI Trend Analysis
            <span className="text-xs font-normal text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">Powered by Gemini</span>
          </h2>
          {trendLoading ? (
            <div className="flex items-center gap-3 text-purple-600">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              Analyzing trends...
            </div>
          ) : (
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{trendData?.getAITrendAnalysis}</p>
          )}
        </div>
      )}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Issues by Category</h2>
        <div className="space-y-3">
          {a.categoryBreakdown.length === 0 && <p className="text-gray-400 text-center py-4">No data yet</p>}
          {a.categoryBreakdown.slice().sort((x, y) => y.count - x.count).map(({ category, count }) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{category}</span>
                <span className="text-gray-500">{count} ({Math.round((count / a.totalIssues) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${(count / a.totalIssues) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Analytics() {
  return <ApolloProvider client={client}><AnalyticsPage /></ApolloProvider>
}
