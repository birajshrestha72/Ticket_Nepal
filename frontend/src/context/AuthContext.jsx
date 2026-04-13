import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const STORAGE_KEY = 'ticket-nepal-user'
const TOKEN_KEY = 'ticket-nepal-token'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const normalizeRole = (role) => {
  if (!role) return 'customer'

  const value = String(role).toLowerCase().trim()
  if (value === 'customer' || value === 'user' || value === 'student') return 'customer'
  if (value === 'vendor' || value === 'admin') return 'vendor'
  if (value === 'system_admin' || value === 'super_admin' || value === 'supadmin' || value === 'superadmin') return 'system_admin'
  return 'customer'
}

const getCurrentUser = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return {
      user_id: parsed.user_id || null,
      name: parsed.name || 'Guest User',
      email: parsed.email || '',
      phone: parsed.phone || '',
      role: normalizeRole(parsed.role),
    }
  } catch {
    return null
  }
}

const getCurrentToken = () => localStorage.getItem(TOKEN_KEY) || ''

const persistUser = (userPayload, token = '') => {
  const user = {
    user_id: userPayload?.user_id || null,
    name: userPayload?.name || 'Guest User',
    email: userPayload?.email || '',
    phone: userPayload?.phone || '',
    role: normalizeRole(userPayload?.role),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
  return user
}

const clearUser = () => {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser())
  const [token, setToken] = useState(() => getCurrentToken())

  useEffect(() => {
    if (!token) {
      return undefined
    }

    let cancelled = false

    const verifySession = async () => {
      try {
        // Session refresh ho - purano token still valid cha ki chaina check garcha.
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.detail || 'Invalid session')
        }

        if (!cancelled) {
          // Role normalize gareko, so "admin"/"super_admin" mix bhaye pani UI stable rahos.
          const normalizedUser = {
            user_id: data?.user?.user_id || null,
            name: data?.user?.name || 'Guest User',
            email: data?.user?.email || '',
            phone: data?.user?.phone || '',
            role: normalizeRole(data?.user?.role),
          }
          setUser(normalizedUser)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser))
        }
      } catch {
        if (!cancelled) {
          clearUser()
          setUser(null)
          setToken('')
        }
      }
    }

    verifySession()

    return () => {
      cancelled = true
    }
  }, [token])

  const login = (nextUser, nextToken = '') => {
    const userData = persistUser(nextUser, nextToken)
    setUser(userData)
    setToken(nextToken)
  }

  const logout = () => {
    clearUser()
    setUser(null)
    setToken('')
  }

  const updateProfile = (profile) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = {
        ...prev,
        name: profile?.name || prev.name,
        email: profile?.email || prev.email,
        phone: profile?.phone ?? prev.phone,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const value = useMemo(() => ({ user, login, logout, updateProfile }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
