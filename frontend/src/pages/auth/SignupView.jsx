import { useState } from 'react'
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, updateProfile } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { auth, isFirebaseConfigured } from '../../config/firebaseClient'
import '../../css/auth.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const getFirebaseSignupErrorMessage = (error) => {
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || '').toLowerCase()
  const text = `${code} ${message}`

  if (text.includes('configuration_not_found')) {
    return 'Firebase sign-up is not configured for this API key. Falling back to backend registration.'
  }

  if (text.includes('api-key-not-valid')) {
    return 'Firebase API key is invalid. Falling back to backend registration.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Email/password sign-up is disabled in Firebase. Falling back to backend registration.'
  }

  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.'
  }

  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered in Firebase. Please login instead.'
  }

  if (code === 'auth/weak-password') {
    return 'Password is too weak for Firebase. Use at least 6 characters.'
  }

  return error?.message || 'Firebase signup failed'
}

const registerWithBackend = async (form) => {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: form.name,
      email: form.email,
      password: form.password,
      role: 'customer',
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Signup failed')
  }

  return data
}

const registerWithFirebase = async (form) => {
  const credential = await createUserWithEmailAndPassword(auth, form.email, form.password)

  if (form.name) {
    await updateProfile(credential.user, { displayName: form.name })
  }

  await sendEmailVerification(credential.user)
  await signOut(auth)
}

const SignupView = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (isFirebaseConfigured && auth) {
        try {
          await registerWithFirebase(form)
          setSuccess('Account created. Please verify your email before logging in.')
          return
        } catch (firebaseError) {
          const firebaseMessage = getFirebaseSignupErrorMessage(firebaseError)

          // Demo-safe fallback: if Firebase is misconfigured, create the account via backend instead.
          if (
            firebaseMessage.toLowerCase().includes('falling back to backend registration') ||
            firebaseMessage.toLowerCase().includes('firebase signup failed')
          ) {
            await registerWithBackend(form)
            setSuccess('Account Created')
            setForm({ name: '', email: '', password: '', confirmPassword: '' })
            return
          }

          throw new Error(firebaseMessage)
        }
      }

      await registerWithBackend(form)

      setSuccess('Account Created')
      setForm({ name: '', email: '', password: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message || 'Unable to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container page-shell auth-page-shell">
      <div className="auth-card">
        <h1>Signup (User)</h1>
        <p>Create a customer account</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label htmlFor="name">Full name</label>
          <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />

          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />

          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-info">{success}</p>}

          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
          <Link to="/signup-admin">Need vendor/admin account?</Link>
        </div>
      </div>
    </section>
  )
}

export default SignupView
