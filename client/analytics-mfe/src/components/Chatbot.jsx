import { useState, useRef, useEffect } from 'react'
import { useLazyQuery, gql, ApolloProvider } from '@apollo/client'
import { client } from '../apolloClient'

const CHAT = gql`query Chat($message: String!) { chatWithAI(message: $message) }`

const SUGGESTIONS = [
  'How many open issues are there?',
  'Any urgent issues right now?',
  'What are the most common problems?',
  'Show recent reports',
]

function ChatbotInner() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm CivicBot 🤖 Powered by LangGraph + Gemini with live access to community data. Ask me about issues, trends, or urgent alerts!" }
  ])
  const [input, setInput]   = useState('')
  const [chat, { loading }] = useLazyQuery(CHAT, { fetchPolicy: 'no-cache' })
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (msg) => {
    const userMsg = (msg || input).trim()
    if (!userMsg) return
    setMessages(m => [...m, { from: 'user', text: userMsg }])
    setInput('')
    const { data, error } = await chat({ variables: { message: userMsg } })
    const reply = error ? 'Sorry, I ran into an error. Please try again.' : (data?.chatWithAI || 'No response received.')
    setMessages(m => [...m, { from: 'bot', text: reply }])
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="bg-white rounded-2xl shadow-2xl w-80 flex flex-col overflow-hidden border border-gray-200" style={{ height: '480px' }}>
          <div className="bg-blue-700 text-white px-4 py-3 flex justify-between items-center shrink-0">
            <div>
              <span className="font-bold">🤖 CivicBot</span>
              <span className="ml-2 text-xs text-blue-200 bg-blue-600 px-1.5 py-0.5 rounded-full">LangGraph + Gemini</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white text-lg leading-none">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] leading-relaxed ${m.from === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-xl">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map(d => (
                      <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1 shrink-0">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-1 hover:bg-blue-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="border-t p-2 flex gap-2 shrink-0">
            <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && send()}
              placeholder="Ask about issues..." disabled={loading} />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors">
              Send
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="bg-blue-700 text-white rounded-full w-14 h-14 text-2xl shadow-lg hover:bg-blue-800 transition-all hover:scale-110">
          💬
        </button>
      )}
    </div>
  )
}

export default function Chatbot() {
  return <ApolloProvider client={client}><ChatbotInner /></ApolloProvider>
}
