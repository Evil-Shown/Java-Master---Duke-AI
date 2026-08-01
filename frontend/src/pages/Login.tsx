import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { setSession, isAuthenticated, username } = useAuth()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [status, setStatus] = useState<string>('Use a local account to save progress and badges.')
  const [busy, setBusy] = useState(false)

  async function auth(endpoint: 'login' | 'register') {
    setBusy(true)
    setStatus(endpoint === 'login' ? 'Logging in...' : 'Creating account...')

    try {
      const response = await fetch('/api/auth/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      })
      const data = await response.json()

      if (!response.ok || !data.token) {
        throw new Error(data.error || 'Auth failed')
      }

      setSession(data.token)

      setStatus(endpoint === 'login' ? 'Logged in successfully.' : 'Account created successfully.')
    } catch (error) {
      setStatus(String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-card">
      <div className="section-head">
        <div>
          <h2 className="section-title">Login / Register</h2>
          <p className="section-copy">
            Keep your progress, achievements, and flashcards tied to a username.
          </p>
          {isAuthenticated && <span className="pill">Signed in as {username}</span>}
        </div>
      </div>

      <div className="form-grid">
        <input placeholder="Username" value={user} onChange={event => setUser(event.target.value)} />
        <input
          placeholder="Password"
          type="password"
          value={pass}
          onChange={event => setPass(event.target.value)}
        />
        <div className="form-actions">
          <button className="primary-button" onClick={() => auth('login')} disabled={busy}>
            Login
          </button>
          <button className="secondary-button" onClick={() => auth('register')} disabled={busy}>
            Register
          </button>
        </div>
        <div className="quiz-feedback">{status}</div>
      </div>
    </section>
  )
}
