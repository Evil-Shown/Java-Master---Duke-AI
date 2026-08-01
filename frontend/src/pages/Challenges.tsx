import React, { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useTheme } from '../hooks/useTheme'

type ChallengeSummary = {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  lessonId: string
  statement: string
}

type Challenge = ChallengeSummary & {
  starterCode: string
  tests: { input: string; expectedOutput: string }[]
  hints: string[]
}

type Result = {
  passed: boolean
  expected: string
  actual: string
}

export default function Challenges() {
  const [items, setItems] = useState<ChallengeSummary[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [code, setCode] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [status, setStatus] = useState('Choose a challenge to start practicing.')
  const theme = useTheme()

  useEffect(() => {
    fetch('/api/challenges')
      .then(response => response.json())
      .then((data: ChallengeSummary[]) => {
        setItems(data)
        if (data[0]) setSelectedId(data[0].id)
      })
      .catch(() => setStatus('Could not load challenges. Is the backend running?'))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setResults([])
    setShowHints(false)
    fetch('/api/challenges/' + selectedId)
      .then(response => response.json())
      .then((data: Challenge) => {
        setChallenge(data)
        setCode(data.starterCode)
        setStatus('Run the public tests first, then submit when you are ready.')
      })
  }, [selectedId])

  const visibleItems = items.filter(item => filter === 'all' || item.difficulty === filter)

  async function execute(mode: 'run' | 'submit') {
    if (!challenge) return
    setBusy(true)
    setStatus(mode === 'run' ? 'Running public tests...' : 'Submitting all tests...')
    try {
      const username = localStorage.getItem('username') || 'anonymous'
      const response = await fetch(`/api/challenges/${challenge.id}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: username })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Challenge request failed')
      setResults(data.results || [])
      setStatus(mode === 'submit' && data.passed ? 'All tests passed. Challenge complete!' : 'Review the test results and iterate.')
    } catch (error) {
      setStatus(String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="section-head">
        <div>
          <h2 className="section-title">Challenges</h2>
          <p className="section-copy">Turn concepts into skill with tests that check your code, not just your memory.</p>
        </div>
        <div className="stacked-meta">
          <span className="pill">{items.length} challenges</span>
          <span className="pill">Read → Run → Submit</span>
        </div>
      </div>

      <div className="toolbar-row">
        <div className="split-actions">
          {['all', 'easy', 'medium', 'hard'].map(value => (
            <button key={value} className={filter === value ? 'primary-button' : 'secondary-button'} onClick={() => setFilter(value)}>
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <span className="status-line">{status}</span>
      </div>

      <div className="lesson-layout">
        <section className="lesson-list">
          {visibleItems.map(item => (
            <button key={item.id} className={`lesson-item${item.id === selectedId ? ' active' : ''}`} onClick={() => setSelectedId(item.id)}>
              <div className="lesson-item-title">{item.title}</div>
              <div className="lesson-item-copy">{item.difficulty} · {item.lessonId}</div>
            </button>
          ))}
        </section>

        <section className="lesson-detail">
          {challenge ? (
            <>
              <div className="lesson-meta">
                <span className={`pill diff-${challenge.difficulty}`}>{challenge.difficulty}</span>
                <span className="pill">{challenge.lessonId}</span>
              </div>
              <h2>{challenge.title}</h2>
              <p className="section-copy">{challenge.statement}</p>
              <div className="lesson-meta">
                <button className="secondary-button" onClick={() => setShowHints(value => !value)}>
                  {showHints ? 'Hide hints' : 'Show hints'}
                </button>
                {showHints && challenge.hints.map(hint => <span className="pill" key={hint}>{hint}</span>)}
              </div>
              <div className="editor-shell" style={{ height: 560, marginTop: '1rem' }}>
                <Editor height="100%" defaultLanguage="java" value={code} onChange={value => setCode(value || '')} theme={theme === 'dark' ? 'vs-dark' : 'light'} options={{ fontSize: 15, minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 14, bottom: 14 } }} />
              </div>
              <div className="form-actions" style={{ marginTop: '1rem' }}>
                <button className="secondary-button" onClick={() => execute('run')} disabled={busy}>Run public tests</button>
                <button className="primary-button" onClick={() => execute('submit')} disabled={busy}>Submit solution</button>
              </div>
              {results.length > 0 && (
                <div className="quiz-grid" style={{ marginTop: '1rem' }}>
                  {results.map((result, index) => (
                    <div className="quiz-feedback" key={index}>
                      <strong>{result.passed ? 'Passed' : 'Failed'} test {index + 1}</strong>
                      {!result.passed && <pre className="code-block">Expected: {result.expected}\nActual: {result.actual}</pre>}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : <div className="empty-state">Loading challenges...</div>}
        </section>
      </div>
    </div>
  )
}
