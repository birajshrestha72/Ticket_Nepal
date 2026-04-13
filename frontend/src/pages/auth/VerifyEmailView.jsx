import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import '../../css/auth.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const VerifyEmailView = () => {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Verifying your email...')

  const token = useMemo(() => {
    const params = new URLSearchParams(globalThis.location.search)
    return (params.get('token') || '').trim()
  }, [])

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Verification token is missing. Please use the link from your email.')
        return
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.detail || 'Verification failed')
        }

        setStatus('success')
        setMessage(data.message || 'Email verified successfully. You can now login.')
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'Verification failed. Please request a new link.')
      }
    }

    verify()
  }, [token])

  return (
    <section className="container page-shell auth-page-shell">
      <div className="auth-card">
        <h1>Email Verification</h1>
        <p>{message}</p>

        {status === 'loading' && <p className="auth-info">Please wait while we verify your account.</p>}
        {status === 'success' && <p className="auth-success">Your account is verified.</p>}
        {status === 'error' && <p className="auth-error">Verification failed.</p>}

        <div className="auth-links">
          <Link to="/login">Go to login</Link>
          <Link to="/signup">Create another account</Link>
        </div>
      </div>
    </section>
  )
}

export default VerifyEmailView
