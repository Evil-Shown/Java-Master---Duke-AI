import React, { useEffect, useState } from 'react'

type OutputGame = { id: string; prompt: string; options: string[]; answer: number; lessonId: string }
type BugGame = { id: string; prompt: string; code: string; answer: string; explanation: string; lessonId: string }

export default function Games() {
  const [outputs, setOutputs] = useState<OutputGame[]>([])
  const [bugs, setBugs] = useState<BugGame[]>([])
  const [mode, setMode] = useState<'output' | 'bug'>('output')
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState(0)

  useEffect(() => {
    fetch('/api/games').then(response => response.json()).then(data => {
      setOutputs(data.output || [])
      setBugs(data.bugs || [])
    })
  }, [])

  const currentOutput = outputs[index % Math.max(outputs.length, 1)]
  const currentBug = bugs[index % Math.max(bugs.length, 1)]

  async function answer(value: string | number) {
    const game = mode === 'output' ? currentOutput : currentBug
    if (!game) return
    const response = await fetch('/api/games/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({userId: localStorage.getItem('username') || 'anonymous', gameType: mode === 'bug' ? 'bug' : 'output', gameId: game.id, answer: value})
    })
    const data = await response.json()
    setFeedback(data.correct ? `Correct! +10 XP. ${data.explanation}` : data.explanation)
    if (data.correct) setScore(current => current + 1)
  }

  function next() {
    setIndex(current => current + 1)
    setFeedback('')
  }

  return (
    <div className="page-stack">
      <div className="section-head">
        <div>
          <h2 className="section-title">Java Games</h2>
          <p className="section-copy">Practice recognition and debugging in short, repeatable rounds.</p>
        </div>
        <div className="stacked-meta"><span className="pill">Score {score}</span><span className="pill">+10 XP each</span></div>
      </div>
      <div className="split-actions">
        <button className={mode === 'output' ? 'primary-button' : 'secondary-button'} onClick={() => {setMode('output'); setIndex(0); setFeedback('')}}>Guess the output</button>
        <button className={mode === 'bug' ? 'primary-button' : 'secondary-button'} onClick={() => {setMode('bug'); setIndex(0); setFeedback('')}}>Bug hunt</button>
      </div>
      <article className="quiz-card">
        {mode === 'output' && currentOutput && <>
          <div className="card-meta"><span className="pill">{currentOutput.lessonId}</span><span className="pill">Guess the output</span></div>
          <pre className="code-block" style={{whiteSpace: 'pre-wrap'}}>{currentOutput.prompt}</pre>
          <div className="option-group">{currentOutput.options.map((option, choice) => <button className="option-button" key={option} onClick={() => answer(choice)}>{option}</button>)}</div>
        </>}
        {mode === 'bug' && currentBug && <>
          <div className="card-meta"><span className="pill">{currentBug.lessonId}</span><span className="pill">Bug hunt</span></div>
          <p className="quiz-question">{currentBug.prompt} Enter the line number.</p>
          <pre className="code-block" style={{whiteSpace: 'pre-wrap'}}>{currentBug.code.split('\n').map((line, lineIndex) => `${lineIndex + 1}: ${line}`).join('\n')}</pre>
          <div className="form-actions"><input id="bug-line" placeholder="Line number" /><button className="primary-button" onClick={() => answer((document.getElementById('bug-line') as HTMLInputElement).value)}>Check bug</button></div>
        </>}
        {feedback && <div className="quiz-feedback" style={{marginTop: '1rem'}}>{feedback}</div>}
        <button className="secondary-button" style={{marginTop: '1rem'}} onClick={next}>Next round</button>
      </article>
    </div>
  )
}
