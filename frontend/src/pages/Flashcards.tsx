import React, { useEffect, useState } from 'react'

export default function Flashcards() {
  const [cards, setCards] = useState<any[]>([])
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const userId = localStorage.getItem('username') || 'anonymous'

  async function refresh() {
    const response = await fetch('/api/flashcards?userId=' + encodeURIComponent(userId))
    const data = await response.json()
    setCards(data)
  }

  useEffect(() => {
    refresh()
  }, [userId])

  async function addCard() {
    if (!front.trim() || !back.trim()) return

    await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, front, back })
    })

    setFront('')
    setBack('')
    await refresh()
  }

  return (
    <div className="page-stack">
      <div className="section-head">
        <div>
          <h2 className="section-title">Flashcards</h2>
          <p className="section-copy">
            Capture concepts in your own words, then use them for fast revision later.
          </p>
        </div>
        <span className="pill">{cards.length} saved</span>
      </div>

      <section className="flashcard-card">
        <div className="form-grid">
          <input
            placeholder="Front: e.g. What is the JVM?"
            value={front}
            onChange={event => setFront(event.target.value)}
          />
          <textarea
            placeholder="Back: explain it in your own words"
            value={back}
            onChange={event => setBack(event.target.value)}
          />
          <div className="form-actions">
            <button className="primary-button" onClick={addCard}>
              Add card
            </button>
            <span className="status-line">Tip: keep the back short, concrete, and memorable.</span>
          </div>
        </div>
      </section>

      {cards.length ? (
        <div className="flashcard-grid">
          {cards.map((card, index) => (
            <article key={card.id || index} className="flashcard-card">
              <div className="flashcard-face">
                <span className="label">Front</span>
                {card.front}
              </div>
              <div className="flashcard-face">
                <span className="label">Back</span>
                {card.back}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Add your first flashcard. Good flashcards ask one focused question and give one crisp
          answer.
        </div>
      )}
    </div>
  )
}
