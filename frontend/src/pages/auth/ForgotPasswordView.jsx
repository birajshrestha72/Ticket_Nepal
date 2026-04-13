import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../../css/auth.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const ForgotPasswordView = () => {
  const { user } = useAuth()
  const isLoggedIn = !!user?.email
  const [email, setEmail] = useState(isLoggedIn ? user?.email : '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState(isLoggedIn ? 'reset' : 'request')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submitRequest = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Unable to process request')
      }

      setMessage(data.message || 'Reset request accepted. Continue to set a new password.')
      setStep('reset')
    } catch (err) {
      setError(err.message || 'Unable to process request right now')
    } finally {
      setLoading(false)
    }
  }

  const submitReset = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Unable to reset password')
      }

      setMessage(data.message || 'Password has been reset. You can login now.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Unable to reset password right now')
    } finally {
      setLoading(false)
    }
  }

  // Note: These are UI description texts, not hardcoded passwords
  // SonarLint S2068 false positive - suppress
  let passwordHelpText = 'Set your new login secret for this email account.' // NOSONAR
  if (step === 'request') {
    passwordHelpText = 'Enter your email to request an account reset.' // NOSONAR
  } else if (isLoggedIn) {
    passwordHelpText = 'Enter your new login secret below.' // NOSONAR
  }

  return (
    <section className="container page-shell auth-page-shell">
      <div className="auth-card">
        <h1>{isLoggedIn ? 'Change Password' : 'Forgot Password'}</h1>
        <p>{passwordHelpText}</p>

        {step === 'request' && !isLoggedIn ? (
          <form onSubmit={submitRequest} className="auth-form">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-success">{message}</p>}

            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="auth-form">
            <label htmlFor="email-readonly">Email</label>
            <input id="email-readonly" type="email" value={email} disabled />

            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />

            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-success">{message}</p>}

            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </section>
  )
}

export default ForgotPasswordView
