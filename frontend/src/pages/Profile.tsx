import React, { useEffect, useState } from 'react'

export default function Profile() {
  const [achievements, setAchievements] = useState<any[]>([])
  const [progress, setProgress] = useState<Record<string, any>>({})
  const username = localStorage.getItem('username') || 'anonymous'

  useEffect(() => {
    fetch('/api/achievements?userId=' + encodeURIComponent(username))
      .then(response => response.json())
      .then(setAchievements)

    fetch('/api/progress?userId=' + encodeURIComponent(username))
      .then(response => response.json())
      .then(setProgress)
  }, [username])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
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
        <button className="secondary-button" onClick={logout}>
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
          <span>Auth status</span>
          <strong>{localStorage.getItem('token') ? 'Signed in' : 'Guest mode'}</strong>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }} className="quiz-feedback">
        Your progress syncs with the backend when you are signed in. Guest mode still lets you
        explore the curriculum and practice code.
      </div>
    </section>
  )
}
