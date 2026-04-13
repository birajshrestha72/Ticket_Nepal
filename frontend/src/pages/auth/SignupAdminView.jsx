import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../css/auth.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const SignupAdminView = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company_registration_document: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (!form.company_registration_document) {
        throw new Error('Company registration document is required')
      }

      const payload = new FormData()
      payload.append('name', form.name)
      payload.append('email', form.email)
      payload.append('password', form.password)
      payload.append('company_registration_document', form.company_registration_document)

      const response = await fetch(`${API_BASE}/api/auth/register-vendor`, {
        method: 'POST',
        body: payload,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Vendor signup failed')
      }

      navigate('/login')
    } catch (err) {
      setError(err.message || 'Unable to create vendor/admin account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container page-shell auth-page-shell">
      <div className="auth-card">
        <h1>Signup (Vendor/Admin)</h1>
        <p>Create a vendor account. Verification starts after document review by superadmin.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label htmlFor="name">Full name</label>
          <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />

          <label htmlFor="email">Business email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />

          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />

          <label htmlFor="companyRegistrationDocument">Company registration certificate (PDF/JPG/PNG)</label>
          <input
            id="companyRegistrationDocument"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => update('company_registration_document', e.target.files?.[0] || null)}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Vendor Registration'}</button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
          <Link to="/signup">Create user account instead</Link>
        </div>
      </div>
    </section>
  )
}

export default SignupAdminView
