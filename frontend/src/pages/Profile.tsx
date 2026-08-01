import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { username, token, logout } = useAuth()
  const [achievements, setAchievements] = useState<any[]>([])
  const [progress, setProgress] = useState<Record<string, any>>({})
  const [stats, setStats] = useState({xp: 0, level: 1, streak: 0})

  useEffect(() => {
    fetch('/api/achievements?userId=' + encodeURIComponent(username))
      .then(response => response.json())
      .then(setAchievements)

    fetch('/api/progress?userId=' + encodeURIComponent(username))
      .then(response => response.json())
      .then(setProgress)

    fetch('/api/profile?userId=' + encodeURIComponent(username))
      .then(response => response.json())
      .then(setStats)
  }, [username])

  function signOut() {
    logout()
    localStorage.removeItem('java-academy-active-lesson')
    window.location.reload()
  }

  const completionCount = Object.values(progress[username] || progress).filter(
    (item: any) => item?.completed
  ).length

  return (
    <section className="profile-card">
      <div className="section-head">
        <div>
          <h2 className="section-title">Profile</h2>
          <p className="section-copy">Review your current learner identity and learning momentum.</p>
        </div>
         <button className="secondary-button" onClick={signOut}>
          Logout
        </button>
      </div>

      <div className="profile-grid">
        <div className="profile-mini">
          <span>Username</span>
          <strong>{username}</strong>
        </div>
        <div className="profile-mini">
          <span>Lessons completed</span>
          <strong>{completionCount}</strong>
        </div>
        <div className="profile-mini">
          <span>Achievements</span>
          <strong>{achievements.length}</strong>
        </div>
        <div className="profile-mini">
          <span>XP / Level</span>
          <strong>{stats.xp} · L{stats.level}</strong>
        </div>
        <div className="profile-mini">
          <span>Daily streak</span>
          <strong>{stats.streak} days</strong>
        </div>
        <div className="profile-mini">
          <span>Auth status</span>
           <strong>{token ? 'Signed in' : 'Guest mode'}</strong>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }} className="quiz-feedback">
        Your progress syncs with the backend when you are signed in. Guest mode still lets you
        explore the curriculum and practice code.
      </div>
    </section>
  )
}
