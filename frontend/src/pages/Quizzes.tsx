import React, { useEffect, useMemo, useState } from 'react'

type Quiz = {
  lessonId: string
  q: string
  opts: string[]
  ans: number
}

type AttemptState = {
  choice: number
  correct: boolean
}

function normalizeProgress(progress: Record<string, any>, userId: string) {
  return progress[userId] || progress
}

export default function Quizzes({ lessonId }: { lessonId?: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [progress, setProgress] = useState<Record<string, any>>({})
  const [attempts, setAttempts] = useState<Record<string, AttemptState>>({})
  const userId = localStorage.getItem('username') || 'anonymous'

  useEffect(() => {
    fetch('/api/quizzes')
      .then(response => response.json())
      .then(setQuizzes)
  }, [])

  async function refreshProgress() {
    const response = await fetch('/api/progress?userId=' + encodeURIComponent(userId))
    const data = await response.json()
    setProgress(data)
  }

  useEffect(() => {
    refreshProgress()
  }, [userId])

  const relevant = useMemo(
    () => quizzes.filter(quiz => !lessonId || quiz.lessonId === lessonId),
    [quizzes, lessonId]
  )

  const scopedProgress = normalizeProgress(progress, userId)
  const completedCount = Object.values(scopedProgress).filter((item: any) => item?.completed).length

  async function submit(quiz: Quiz, choice: number) {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/quizzes/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      body: JSON.stringify({
        userId,
        lessonId: quiz.lessonId,
        qIndex: 0,
        answerIndex: choice
      })
    })

    const payload = await response.json()
    setAttempts(current => ({
      ...current,
      [quiz.lessonId]: { choice, correct: Boolean(payload.correct) }
    }))
    await refreshProgress()
  }

  return (
    <div className="page-stack">
      <div className="section-head">
        <div>
          <h2 className="section-title">Quizzes</h2>
          <p className="section-copy">
            Check your understanding. Try answering before Duke gives you the explanation.
          </p>
        </div>
        <div className="stacked-meta">
          <span className="pill">{relevant.length} questions visible</span>
          <span className="pill">{completedCount} lessons marked complete</span>
        </div>
      </div>

      <div className="quiz-grid">
        {relevant.map(quiz => {
          const attempt = attempts[quiz.lessonId]
          const progressItem = scopedProgress[quiz.lessonId]
          return (
            <article key={quiz.lessonId} className="quiz-card">
              <div className="card-meta">
                <span className="pill">{quiz.lessonId}</span>
                {progressItem?.completed ? (
                  <span className="pill">Completed</span>
                ) : (
                  <span className="pill">In progress</span>
                )}
              </div>
              <div className="quiz-question">{quiz.q}</div>
              <div className="option-group">
                {quiz.opts.map((option, index) => {
                  const isSelected = attempt?.choice === index
                  const isCorrect = quiz.ans === index
                  const className = [
                    'option-button',
                    isSelected && attempt.correct ? 'correct' : '',
                    isSelected && attempt && !attempt.correct ? 'wrong' : '',
                    attempt && isCorrect ? 'correct' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <button key={option} className={className} onClick={() => submit(quiz, index)}>
                      {option}
                    </button>
                  )
                })}
              </div>

              {attempt && (
                <div className="quiz-feedback">
                  {attempt.correct
                    ? 'Nice work. You picked the right answer.'
                    : 'Not quite. Review the lesson, then try again for a clean win.'}
                </div>
              )}
            </article>
          )
        })}

        {!relevant.length && (
          <div className="empty-state">
            No quiz is mapped to the active lesson yet. Pick a lesson from the curriculum and then
            return here.
          </div>
        )}
      </div>
    </div>
  )
}
