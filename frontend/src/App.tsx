import React from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Lessons from './pages/Lessons'
import Playground from './pages/Playground'
import Quizzes from './pages/Quizzes'
import Achievements from './pages/Achievements'
import Flashcards from './pages/Flashcards'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Challenges from './pages/Challenges'
import Games from './pages/Games'
import { AuthProvider } from './context/AuthContext'
import Duke from './components/Duke'

const navItems = [
  { to: '/', label: 'Lessons', hint: 'Zero to hero' },
  { to: '/playground', label: 'Playground', hint: 'Run Java safely' },
  { to: '/challenges', label: 'Challenges', hint: 'Solve with tests' },
  { to: '/games', label: 'Games', hint: 'Practice playfully' },
  { to: '/quizzes', label: 'Quizzes', hint: 'Check understanding' },
  { to: '/achievements', label: 'Achievements', hint: 'Track momentum' },
  { to: '/flashcards', label: 'Flashcards', hint: 'Review faster' },
  { to: '/login', label: 'Login', hint: 'Persist progress' },
  { to: '/profile', label: 'Profile', hint: 'Your study identity' }
]

function Shell() {
  const location = useLocation()
  const [activeLessonId, setActiveLessonId] = React.useState<string | undefined>(() => {
    return localStorage.getItem('java-academy-active-lesson') || undefined
  })

  React.useEffect(() => {
    if (activeLessonId) {
      localStorage.setItem('java-academy-active-lesson', activeLessonId)
    } else {
      localStorage.removeItem('java-academy-active-lesson')
    }
  }, [activeLessonId])

  const locationLabel =
    navItems.find(item => item.to === location.pathname)?.label || 'Lessons'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">J</div>
          <div className="brand-copy">
            <div className="brand-name">Java Academy</div>
            <div className="brand-tag">Zero to senior engineer</div>
          </div>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-card-label">Current focus</div>
          <div className="sidebar-card-title">{locationLabel}</div>
          <div className="sidebar-card-copy">
            Learn by reading, running, and reviewing the same concept from several angles.
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-link-label">{item.label}</span>
              <span className="nav-link-hint">{item.hint}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-chip">Java 21 ready</div>
          <div className="sidebar-footer-chip">Oracle-inspired curriculum</div>
          <div className="sidebar-footer-chip">Built for backend engineers</div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <div className="eyebrow">Interactive learning system</div>
            <h1>Build Java fluency with lessons, quizzes, and live practice.</h1>
            <p>
              A guided track from fundamentals to JVM internals, concurrency, and enterprise
              patterns.
            </p>
          </div>
          <div className="topbar-stats">
            <div className="stat-card">
              <span>Route</span>
              <strong>{locationLabel}</strong>
            </div>
            <div className="stat-card">
              <span>Mentor</span>
              <strong>Duke</strong>
            </div>
            <div className="stat-card">
              <span>Active lesson</span>
              <strong>{activeLessonId || 'Not selected yet'}</strong>
            </div>
          </div>
        </header>

        <div className="top-strip">
          <span className="pill">Read</span>
          <span className="pill">Run</span>
          <span className="pill">Reflect</span>
          <span className="pill">Repeat</span>
        </div>

        <main className="page-panel">
          <Routes>
            <Route path="/" element={<Lessons activeId={activeLessonId} onSelect={setActiveLessonId} />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/games" element={<Games />} />
            <Route path="/quizzes" element={<Quizzes lessonId={activeLessonId} />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </section>

      <Duke lessonId={activeLessonId} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  )
}
