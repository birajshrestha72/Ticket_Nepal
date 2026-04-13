import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

const ProfileView = () => {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    updateProfile({ name: name.trim(), email: email.trim() })
    setMessage('Profile updated successfully')
  }

  return (
    <section className="container page-shell">
      <div className="auth-card">
        <h1>Edit Profile</h1>
        <p>Update your account details.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="profile-name">Full Name</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />

          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="profile-role">Role</label>
          <input
            id="profile-role"
            type="text"
            value={user?.role || ''}
            disabled
          />

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button type="submit">Save Profile</button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot Password? Reset here</Link>
        </div>
      </div>
    </section>
  )
}

export default ProfileView
