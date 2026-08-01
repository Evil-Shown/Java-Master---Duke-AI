import React, { createContext, useContext, useMemo, useState } from 'react'

type AuthContextValue = {
  token: string | null
  username: string
  isAuthenticated: boolean
  setSession: (token: string) => void
  logout: () => void
  authHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function tokenUsername(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload?.username === 'string' ? payload.username : ''
  } catch {
    return ''
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'anonymous')

  const value = useMemo<AuthContextValue>(() => ({
    token,
    username,
    isAuthenticated: Boolean(token),
    setSession: nextToken => {
      const nextUsername = tokenUsername(nextToken) || 'anonymous'
      localStorage.setItem('token', nextToken)
      localStorage.setItem('username', nextUsername)
      setToken(nextToken)
      setUsername(nextUsername)
    },
    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      setToken(null)
      setUsername('anonymous')
    },
    authHeaders: (): Record<string, string> => token ? { Authorization: 'Bearer ' + token } : {}
  }), [token, username])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
