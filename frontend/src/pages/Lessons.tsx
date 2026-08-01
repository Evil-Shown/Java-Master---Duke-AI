import React, { useEffect, useMemo, useState } from 'react'
import fallbackLessons from '../data/lessons.json'

type Exercise = {
  title: string
  prompt: string
  starterCode: string
}

type Lesson = {
  id: string
  title: string
  tagline?: string
  module?: string
  level?: string
  analogy?: string
  content: string[]
  code?: string
  commonMistakes?: string[]
  exercises?: Exercise[]
}

const LEVEL_STYLE: Record<string, string> = {
  beginner: 'level-beginner',
  intermediate: 'level-intermediate',
  advanced: 'level-advanced'
}

export default function Lessons({
  activeId,
  onSelect
}: {
  activeId?: string
  onSelect?: (id: string) => void
}) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [offline, setOffline] = useState(false)
  const userId = localStorage.getItem('username') || 'anonymous'

  useEffect(() => {
    fetch('/api/lessons')
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status)
        return response.json()
      })
      .then(setLessons)
      .catch(() => {
        setLessons(fallbackLessons as Lesson[])
        setOffline(true)
      })
  }, [])

  useEffect(() => {
    if (lessons.length === 0) {
      return
    }

    const hasActiveLesson = activeId ? lessons.some(lesson => lesson.id === activeId) : false

    if (!hasActiveLesson) {
      onSelect?.(lessons[0].id)
    }
  }, [activeId, lessons, onSelect])

  useEffect(() => {
    fetch('/api/progress?userId=' + encodeURIComponent(userId))
      .then(response => response.json())
      .then(data => {
        const values: Record<string, boolean> = {}
        Object.entries(data || {}).forEach(([id, value]: [string, any]) => { values[id] = Boolean(value?.completed) })
        setCompleted(values)
      })
      .catch(() => {})
  }, [userId])

  const activeLesson = useMemo(
    () => lessons.find(lesson => lesson.id === activeId) || lessons[0],
    [lessons, activeId]
  )

  const lessonCount = lessons.length
  const selectedIndex = activeLesson ? lessons.findIndex(lesson => lesson.id === activeLesson.id) : -1

  const modules = useMemo(() => {
    const grouped = new Map<string, Lesson[]>()
    lessons.forEach(lesson => {
      const key = lesson.module || 'Other'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(lesson)
    })
    return [...grouped.entries()]
  }, [lessons])

  const completedCount = lessons.filter(lesson => completed[lesson.id]).length

  return (
    <div className="page-stack">
      <div className="section-head">
        <div>
          <h2 className="section-title">Lessons</h2>
          <p className="section-copy">
            A full university-style Java curriculum — move through the modules in order, or jump
            straight to the topic you want to sharpen.
          </p>
        </div>
        <div className="stacked-meta">
          <span className="pill">{lessonCount} lessons</span>
          <span className="pill">
            {completedCount}/{lessonCount} completed
          </span>
          {activeLesson && <span className="pill">Lesson {selectedIndex + 1}</span>}
          {offline && <span className="pill pill-offline">Backend offline — showing built-in curriculum</span>}
        </div>
      </div>

      <div className="lesson-layout">
        <section className="lesson-list">
          {modules.map(([module, items]) => (
            <div key={module} className="lesson-group">
              <div className="lesson-group-title">{module}</div>
              {items.map((lesson, index) => (
                <button
                  key={lesson.id}
                  className={`lesson-item${lesson.id === activeId ? ' active' : ''}`}
                  onClick={() => onSelect?.(lesson.id)}
                >
                  <div className="lesson-item-title">
                    <span className="lesson-num">{index + 1}</span>
                    {lesson.title}
                  </div>
                  <div className="lesson-item-copy">
                    {completed[lesson.id] ? 'Completed · ' : ''}
                    {lesson.tagline || lesson.module}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </section>

        <section className="lesson-detail">
          {activeLesson ? (
            <>
              <div className="lesson-meta">
                <span className="pill">{activeLesson.module || 'Foundation lesson'}</span>
                {activeLesson.level && (
                  <span className={`pill level-pill ${LEVEL_STYLE[activeLesson.level] || ''}`}>
                    {activeLesson.level}
                  </span>
                )}
                <span className="pill">{activeLesson.id}</span>
              </div>
              <h2>{activeLesson.title}</h2>
              {activeLesson.tagline && <p className="section-copy">{activeLesson.tagline}</p>}

              {activeLesson.analogy && (
                <div className="analogy-box">
                  <div className="analogy-label">Picture this</div>
                  <p>{activeLesson.analogy}</p>
                </div>
              )}

              <h3>What you will learn</h3>
              <ul className="lesson-copy-list">
                {activeLesson.content.map((item, index) => (
                  <li key={`${activeLesson.id}-${index}`}>{item}</li>
                ))}
              </ul>

              {activeLesson.code && (
                <>
                  <h3>Code example</h3>
                  <pre className="code-block">
                    <code>{activeLesson.code}</code>
                  </pre>
                </>
              )}

              {activeLesson.commonMistakes && activeLesson.commonMistakes.length > 0 && (
                <>
                  <h3>Watch out</h3>
                  <ul className="mistake-list">
                    {activeLesson.commonMistakes.map((mistake, index) => (
                      <li key={`mistake-${activeLesson.id}-${index}`}>{mistake}</li>
                    ))}
                  </ul>
                </>
              )}

              {activeLesson.exercises && activeLesson.exercises.length > 0 && (
                <>
                  <h3>Practice</h3>
                  <div className="exercise-stack">
                    {activeLesson.exercises.map((exercise, index) => (
                      <div key={`exercise-${activeLesson.id}-${index}`} className="exercise-card">
                        <div className="exercise-title">
                          <span className="exercise-badge">{index + 1}</span>
                          {exercise.title}
                        </div>
                        <p className="exercise-prompt">{exercise.prompt}</p>
                        {exercise.starterCode && (
                          <pre className="code-block code-block-compact">
                            <code>{exercise.starterCode}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="lesson-meta" style={{ marginTop: '1rem' }}>
                <button
                  className={completed[activeLesson.id] ? 'secondary-button' : 'primary-button'}
                  onClick={async () => {
                    await fetch('/api/progress', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId, lessonId: activeLesson.id, completed: true, score: 100 })
                    })
                    setCompleted(current => ({ ...current, [activeLesson.id]: true }))
                  }}
                >
                  {completed[activeLesson.id] ? 'Lesson completed' : 'Mark lesson complete'}
                </button>
                <span className="pill">Ask Duke for an analogy</span>
                <span className="pill">Then solve the quiz</span>
                <span className="pill">Then run the playground</span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              Select a lesson to start. Once the lesson is active, Duke will automatically pick up
              the context for deeper explanations.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
