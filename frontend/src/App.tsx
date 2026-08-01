import React from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Lessons from './pages/Lessons'
import Playground from './pages/Playground'
import Quizzes from './pages/Quizzes'
import Challenges from './pages/Challenges'
import Games from './pages/Games'
import Achievements from './pages/Achievements'
import Flashcards from './pages/Flashcards'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Duke from './components/Duke'
import { AuthProvider, useAuth } from './context/AuthContext'

type IconProps = { size?: number }

function BookIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function TerminalIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
}

function TargetIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function GamepadIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" />
      <line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  )
}

function CheckCircleIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  )
}

function LayersIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 10 5-10 5L2 7z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  )
}

function TrophyIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M6 2h12v7a6 6 0 0 1-12 0V2z" />
      <path d="M12 15v5" />
      <path d="M8 22h8" />
      <path d="M9 22v-2h6v2" />
    </svg>
  )
}

function LoginIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  )
}

function UserIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function MenuIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  )
}

function SunIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="7" y2="7" />
      <line x1="17" y1="17" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="7" y2="17" />
      <line x1="17" y1="7" x2="19.1" y2="4.9" />
    </svg>
  )
}

function MoonIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function ChevronLeftIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ChatIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

const navItems = [
  { to: '/', label: 'Lessons', hint: 'Zero to hero', icon: <BookIcon /> },
  { to: '/playground', label: 'Playground', hint: 'Run Java safely', icon: <TerminalIcon /> },
  { to: '/challenges', label: 'Challenges', hint: 'Solve with tests', icon: <TargetIcon /> },
  { to: '/games', label: 'Games', hint: 'Practice playfully', icon: <GamepadIcon /> },
  { to: '/quizzes', label: 'Quizzes', hint: 'Check understanding', icon: <CheckCircleIcon /> },
  { to: '/flashcards', label: 'Flashcards', hint: 'Review faster', icon: <LayersIcon /> },
  { to: '/achievements', label: 'Achievements', hint: 'Track momentum', icon: <TrophyIcon /> },
  { to: '/login', label: 'Login', hint: 'Persist progress', icon: <LoginIcon /> },
  { to: '/profile', label: 'Profile', hint: 'Your study identity', icon: <UserIcon /> }
]

function Shell() {
  const location = useLocation()
  const { username, isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    return localStorage.getItem('java-academy-sidebar-collapsed') === '1'
  })
  const [dukeOpen, setDukeOpen] = React.useState(() => {
    return localStorage.getItem('java-academy-duke-open') !== '0'
  })
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('java-academy-theme') as 'light' | 'dark') || 'light'
  })
  const [activeLessonId, setActiveLessonId] = React.useState<string | undefined>(() => {
    return localStorage.getItem('java-academy-active-lesson') || undefined
  })

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('java-academy-theme', theme)
  }, [theme])

  React.useEffect(() => {
    if (activeLessonId) {
      localStorage.setItem('java-academy-active-lesson', activeLessonId)
    } else {
      localStorage.removeItem('java-academy-active-lesson')
    }
  }, [activeLessonId])

  React.useEffect(() => {
    localStorage.setItem('java-academy-sidebar-collapsed', sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  React.useEffect(() => {
    localStorage.setItem('java-academy-duke-open', dukeOpen ? '1' : '0')
  }, [dukeOpen])

  const locationLabel = navItems.find(item => item.to === location.pathname)?.label || 'Lessons'

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}${dukeOpen ? '' : ' duke-hidden'}`}>
      <button className="mobile-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen(open => !open)}>
        <MenuIcon />
      </button>

      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} />}

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">J</div>
          <div className="brand-copy">
            <div className="brand-name">Java Academy</div>
            <div className="brand-tag">Zero to senior engineer</div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(true)}
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <ChevronLeftIcon size={16} />
          </button>
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
              onClick={closeMenu}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-link-label">{item.label}</span>
              <span className="nav-link-hint">{item.hint}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-chip">
          <div className="user-chip-avatar">{username.charAt(0).toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <div className="user-chip-name">{username}</div>
            <div className="user-chip-status">{isAuthenticated ? 'Signed in' : 'Guest mode'}</div>
          </div>
        </div>

        <div className="sidebar-footer">
          <span className="sidebar-footer-chip">Java 21 ready</span>
          <span className="sidebar-footer-chip">Oracle-inspired curriculum</span>
          <span className="sidebar-footer-chip">Built for backend engineers</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="sidebar-reopen"
              onClick={() => setSidebarCollapsed(false)}
              title="Show sidebar"
              aria-label="Show sidebar"
            >
              <ChevronRightIcon size={18} />
            </button>
            <div>
              <div className="eyebrow">Interactive learning system</div>
              <h1>Build Java fluency with lessons, quizzes, and live practice.</h1>
              <p>
                A guided track from fundamentals to JVM internals, concurrency, and enterprise
                patterns.
              </p>
            </div>
          </div>
          <div className="topbar-stats">
            <button
              className="theme-toggle"
              onClick={() => setTheme(current => (current === 'light' ? 'dark' : 'light'))}
              title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
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
            <button
              className="duke-reopen"
              onClick={() => setDukeOpen(true)}
              title="Show Duke mentor"
              aria-label="Show Duke mentor"
            >
              <ChatIcon size={18} />
            </button>
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

      <Duke lessonId={activeLessonId} open={dukeOpen} onToggle={() => setDukeOpen(open => !open)} />
    </div>
  )
}

export default function App() {
  React.useEffect(() => {
    const saved = localStorage.getItem('java-academy-theme') as 'light' | 'dark' | null
    document.documentElement.dataset.theme = saved || 'light'
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  )
}
