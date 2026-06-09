import React, { useEffect, useRef, useState } from 'react'

type Msg = { from: 'duke' | 'user'; text: string }

const starterPrompts = [
  'Explain this lesson simply',
  'Give me a quick quiz',
  'Show a real-world example',
  'What are the common mistakes?'
]

export default function Duke({ lessonId }: { lessonId?: string }) {
  const [open, setOpen] = useState(true)
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: 'duke',
      text:
        "Hi, I'm Duke. Ask me about Java, the JVM, OOP, concurrency, or the lesson you are on."
    }
  ])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [msgs, open])

  async function send(message = text) {
    const trimmed = message.trim()
    if (!trimmed) return

    setMsgs(current => [...current, { from: 'user', text: trimmed }])
    setText('')
    setSending(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, lessonId })
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
        <div>
          <div className="duke-title">Duke Mentor</div>
          <div className="duke-subtitle">
            {lessonId ? `Context: ${lessonId}` : 'Lesson-aware Java tutor'}
          </div>
        </div>
        <button className="ghost-button" onClick={() => setOpen(state => !state)}>
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
              <button className="primary-button" onClick={() => send()} disabled={sending}>
                {sending ? 'Thinking...' : 'Send'}
              </button>
              <span className="status-line">Use Shift + Enter for a new line.</span>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
