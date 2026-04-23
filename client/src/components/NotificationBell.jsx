import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'

const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    getMyNotifications { id message type read createdAt issueId }
    getUnreadCount
  }
`
const MARK_READ = gql`mutation MarkRead($id: ID!) { markNotificationRead(id: $id) }`
const MARK_ALL_READ = gql`mutation MarkAllRead { markAllNotificationsRead }`

const typeIcon = { status_update: '📋', urgent_alert: '🚨', general: '🔔' }

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const { data, refetch } = useQuery(GET_NOTIFICATIONS, { pollInterval: 30000 })
  const [markRead] = useMutation(MARK_READ)
  const [markAllRead] = useMutation(MARK_ALL_READ)

  const notifications = data?.getMyNotifications || []
  const unread = data?.getUnreadCount || 0

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => setOpen(v => !v)

  const handleMarkRead = async (id) => {
    await markRead({ variables: { id } })
    refetch()
  }

  const handleMarkAll = async () => {
    await markAllRead()
    refetch()
  }

  const timeAgo = (ts) => {
    const diff = Date.now() - parseInt(ts)
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen} className="relative p-1 hover:bg-blue-600 rounded-lg transition-colors">
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
            <span className="font-semibold text-gray-800">Notifications</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No notifications yet</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex gap-2 items-start">
                    <span className="text-lg flex-shrink-0">{typeIcon[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
