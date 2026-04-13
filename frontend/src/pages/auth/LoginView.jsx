import { useState } from 'react'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
} from '../../config/firebaseClient'
import { useAuth } from '../../context/AuthContext'
import '../../css/auth.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const getFirebaseLoginErrorMessage = (error) => {
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || '')
  const text = `${code} ${message}`.toLowerCase()

  if (text.includes('configuration_not_found')) {
    return 'Firebase project auth configuration was not found for this API key. Verify Firebase project, Web App config, and that Authentication is enabled.'
  }

  if (code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' || text.includes('api-key-not-valid')) {
    return 'Firebase API key is invalid for this app. Check VITE_FIREBASE_API_KEY in frontend/.env.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is disabled in Firebase. Enable Google provider under Firebase Authentication -> Sign-in method.'
  }

  if (code === 'auth/unauthorized-domain') {
    return 'Current domain is not authorized in Firebase Authentication. Add localhost/127.0.0.1 in Authorized domains.'
  }

  return error?.message || 'Unable to login with Google'
}

const getPostLoginPath = (role) => {
  const value = String(role || '').toLowerCase().trim()
  if (value === 'system_admin' || value === 'super_admin' || value === 'supadmin' || value === 'superadmin') {
    return '/supadmin'
  }
  if (value === 'vendor' || value === 'admin') {
    return '/admin'
  }
  return '/user'
}

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const getNextPath = (role) => {
    const fallbackPath = getPostLoginPath(role)
    const fromPath = location.state?.from
    if (typeof fromPath === 'string' && fromPath.startsWith('/')) {
      return fromPath
    }
    return fallbackPath
  }

  const finishFirebaseLogin = async (idToken) => {
    const response = await fetch(`${API_BASE}/api/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.detail || 'Firebase login failed')
    }

    login(data.user, data.token || '')
    navigate(getNextPath(data.user?.role), { replace: true })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (response.ok) {
        login(data.user, data.token || '')
        navigate(getNextPath(data.user?.role), { replace: true })
        return
      }

      if (response.status === 403) {
        throw new Error(data.detail || 'Login is blocked for this account')
      }

      if (isFirebaseConfigured && auth) {
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password)
          if (!credential.user.emailVerified) {
            throw new Error('Email not verified. Please verify your email first.')
          }
          const idToken = await credential.user.getIdToken()
          await finishFirebaseLogin(idToken)
          return
        } catch {
          throw new Error(data.detail || 'Login failed')
        }
      }

      throw new Error(data.detail || 'Login failed')
    } catch (err) {
      setError(err.message || 'Unable to login right now')
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async () => {
    if (!email) {
      setError('Please enter your email first')
      return
    }

    setError('')
    setInfo('')
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-email/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resend verification email')
      }
      setInfo('Verification email sent. Please check your inbox.')
    } catch (err) {
      setError(err.message || 'Unable to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setError('Google login is not configured yet. Please set Firebase env values.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      await finishFirebaseLogin(idToken)
    } catch (err) {
      setError(getFirebaseLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container page-shell auth-page-shell">
      <div className="auth-card">
        <h1>Login</h1>
        <p>Access your Ticket Nepal account</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <button type="button" className="google-btn" disabled={loading} onClick={loginWithGoogle}>
            Continue with Google
          </button>

          <button type="button" className="google-btn" disabled={loading} onClick={resendVerification}>
            Resend Verification Email
          </button>

          {!isFirebaseConfigured && (
            <p className="auth-info">Google login disabled: missing Firebase client configuration.</p>
          )}
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/signup">Create user account</Link>
          <Link to="/signup-admin">Create vendor/admin account</Link>
        </div>
      </div>
    </section>
  )
}

export default Login
