import React, { useEffect, useState } from 'react'

export default function Achievements() {
  const [achievements, setAchievements] = useState<any[]>([])
  const userId = localStorage.getItem('username') || 'anonymous'

  useEffect(() => {
    fetch('/api/achievements?userId=' + encodeURIComponent(userId))
      .then(response => response.json())
      .then(setAchievements)
  }, [userId])

  return (
    <div className="page-stack">
      <div className="section-head">
        <div>
          <h2 className="section-title">Achievements</h2>
          <p className="section-copy">
            Your wins show up here. Each quiz, lesson milestone, and practice habit builds momentum.
          </p>
        </div>
        <span className="pill">{achievements.length} unlocked</span>
      </div>

      {achievements.length ? (
        <div className="achievement-grid">
          {achievements.map(achievement => (
            <article key={achievement.id || achievement.key} className="achievement-card">
              <div className="badge-letter">
                {(achievement.title || achievement.key || '?').charAt(0).toUpperCase()}
              </div>
              <div className="card-meta">
                <span className="pill">Badge</span>
                <span className="pill">{achievement.key || 'milestone'}</span>
              </div>
              <h3>{achievement.title || achievement.key}</h3>
              <p className="section-copy">{achievement.awarded_at}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          No achievements yet. Start with a lesson, answer a quiz correctly, and come back to see
          your first badge.
        </div>
      )}
    </div>
  )
}
