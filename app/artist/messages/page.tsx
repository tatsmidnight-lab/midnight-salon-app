"use client"

import { useEffect, useRef, useState } from "react"

type Conversation = { id: string; other_name: string; last_message: string; updated_at: string }
type Message = { id: string; sender_id: string; content: string; created_at: string }

export default function ArtistMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvo, setActiveConvo] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState("")
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("salon_user") || "{}")
      setUserId(u.id || "")
    } catch {}

    fetch("/api/messages/get-conversations-list")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeConvo) return
    fetch(`/api/messages/get-conversation?conversation_id=${activeConvo}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setMessages(Array.isArray(data) ? data : [])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      })
      .catch(() => {})
  }, [activeConvo])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !activeConvo) return

    try {
      await fetch("/api/messages/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: activeConvo, content: newMsg }),
      })
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender_id: userId, content: newMsg, created_at: new Date().toISOString() }])
      setNewMsg("")
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch {}
  }

  return (
    <div className="h-[calc(100vh-56px)] lg:h-screen flex animate-page-enter">
      {/* Conversation list */}
      <div className="w-80 flex-shrink-0 flex flex-col" style={{ borderRight: "1px solid var(--glass-border)", background: "var(--surface-hex)" }}>
        <div className="p-4" style={{ borderBottom: "1px solid var(--glass-border)" }}>
          <h2 className="font-bold" style={{ color: "hsl(var(--text-primary))" }}>Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--surface-2-hex)" }} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>No conversations yet</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvo(c.id)}
                className={`w-full p-4 text-left transition-all ${activeConvo === c.id ? "" : "hover:opacity-80"}`}
                style={{
                  background: activeConvo === c.id ? "var(--glass-bg)" : "transparent",
                  borderBottom: "1px solid var(--glass-border)",
                }}
              >
                <p className="font-semibold text-sm truncate" style={{ color: "hsl(var(--text-primary))" }}>{c.other_name}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{c.last_message}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeConvo ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id === userId
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? "gradient-accent text-white rounded-br-md" : "rounded-bl-md"}`}
                      style={!isMine ? { background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))" } : undefined}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 flex gap-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-2-hex)", color: "hsl(var(--text-primary))", border: "1px solid var(--glass-border)" }}
              />
              <button type="submit" className="btn-primary !py-3 !px-5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2L7 9M14 2l-5 12-2-5-5-2z"/></svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: "hsl(var(--text-muted))" }}>Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
