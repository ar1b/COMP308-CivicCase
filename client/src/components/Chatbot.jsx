import { useState } from 'react'
import { useLazyQuery, gql } from '@apollo/client'

const CHAT = gql`
  query Chat($message: String!) {
    chatWithAI(message: $message)
  }
`

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm CivicBot 🤖 Ask me about community issues, trends, or stats!" }
  ])
  const [input, setInput] = useState('')
  const [chat, { loading }] = useLazyQuery(CHAT)

  const send = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setMessages(m => [...m, { from: 'user', text: userMsg }])
    setInput('')
    const { data } = await chat({ variables: { message: userMsg } })
    setMessages(m => [...m, { from: 'bot', text: data?.chatWithAI || 'No response.' }])
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="bg-white rounded-2xl shadow-2xl w-80 flex flex-col overflow-hidden border border-gray-200">
          <div className="bg-blue-700 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-bold">🤖 CivicBot</span>
            <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white text-lg">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${m.from === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400 text-center">CivicBot is thinking...</div>}
          </div>
          <div className="border-t p-2 flex gap-2">
            <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about issues..." />
            <button onClick={send} disabled={loading}
              className="bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="bg-blue-700 text-white rounded-full w-14 h-14 text-2xl shadow-lg hover:bg-blue-800 transition-all">
          💬
        </button>
      )}
    </div>
  )
}