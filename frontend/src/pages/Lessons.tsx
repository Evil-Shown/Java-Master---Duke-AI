import React, { useEffect, useMemo, useState } from 'react'

type Lesson = {
  id: string
  title: string
  tagline?: string
  content: string[]
  code?: string
}

export default function Lessons({
  activeId,
  onSelect
}: {
  activeId?: string
  onSelect?: (id: string) => void
}) {
  const [lessons, setLessons] = useState<Lesson[]>([])

  useEffect(() => {
    fetch('/api/lessons')
      .then(response => response.json())
      .then(setLessons)
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

  const activeLesson = useMemo(
    () => lessons.find(lesson => lesson.id === activeId) || lessons[0],
    [lessons, activeId]
  )

  const lessonCount = lessons.length
  const selectedIndex = activeLesson ? lessons.findIndex(lesson => lesson.id === activeLesson.id) : -1

  return (
    <div className="page-stack">
      <div className="section-head">
        <div>
          <h2 className="section-title">Lessons</h2>
          <p className="section-copy">
            Move through the curriculum in order, or jump straight to the topic you want to
            sharpen.
          </p>
        </div>
        <div className="stacked-meta">
          <span className="pill">{lessonCount} lessons loaded</span>
          {activeLesson && <span className="pill">Lesson {selectedIndex + 1}</span>}
        </div>
      </div>

      <div className="lesson-layout">
        <section className="lesson-list">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              className={`lesson-item${lesson.id === activeId ? ' active' : ''}`}
              onClick={() => onSelect?.(lesson.id)}
            >
              <div className="lesson-item-title">
                {index + 1}. {lesson.title}
              </div>
              <div className="lesson-item-copy">{lesson.tagline}</div>
            </button>
          ))}
        </section>

        <section className="lesson-detail">
          {activeLesson ? (
            <>
              <div className="lesson-meta">
                <span className="pill">Foundation lesson</span>
                <span className="pill">{activeLesson.id}</span>
              </div>
              <h2>{activeLesson.title}</h2>
              <p className="section-copy">{activeLesson.tagline}</p>

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

              <div className="lesson-meta" style={{ marginTop: '1rem' }}>
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
