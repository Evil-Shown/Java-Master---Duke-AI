import React, { useEffect, useRef, useState } from 'react'

type Msg = { from: 'duke' | 'user'; text: string }

const starterPrompts = [
  'Explain this lesson simply',
  'Give me a quick quiz',
  'Show a real-world example',
  'What are the common mistakes?'
]

function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function CoffeeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  )
}

export default function Duke({
  lessonId,
  open,
  onToggle
}: {
  lessonId?: string
  open: boolean
  onToggle: () => void
}) {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: 'duke',
      text: "Hi, I'm Duke. Ask me about Java, the JVM, OOP, concurrency, or the lesson you are on."
    }
  ])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [msgs, open, sending])

  async function send(message = text) {
    const trimmed = message.trim()
    if (!trimmed || sending) return

    setMsgs(current => [...current, { from: 'user', text: trimmed }])
    setText('')
    setSending(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, lessonId, history: msgs })
      })
      const data = await res.json()
      setMsgs(current => [...current, { from: 'duke', text: data.reply }])
    } catch (error) {
      setMsgs(current => [
        ...current,
        {
          from: 'duke',
          text: 'I hit a network issue. Try again, or ask me for a shorter question.'
        }
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <aside className="duke-shell">
      <div className="duke-header">
        <div className="duke-identity">
          <div className="duke-avatar">
            <CoffeeIcon size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="duke-title">Duke Mentor</div>
            <div className="duke-subtitle">
              {lessonId ? `Context: ${lessonId}` : 'Lesson-aware Java tutor'}
            </div>
          </div>
        </div>
        <button className="ghost-button" onClick={onToggle}>
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      {open && (
        <>
          <div className="duke-messages" ref={scrollRef}>
            {msgs.map((msg, index) => (
              <div key={`${msg.from}-${index}`} className={`message ${msg.from}`}>
                {msg.text}
              </div>
            ))}
            {sending && (
              <div className="message duke">
                <span className="typing-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
          </div>

          <div className="duke-composer">
            <div className="quick-prompts">
              {starterPrompts.map(prompt => (
                <button key={prompt} className="quick-prompt" onClick={() => send(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Ask Duke something about Java..."
              value={text}
              onChange={event => setText(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  send()
                }
              }}
            />

            <div className="duke-composer-actions">
              <span className="status-line">Shift + Enter for a new line</span>
              <button className="send-button" onClick={() => send()} disabled={sending} aria-label="Send message">
                <SendIcon />
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
