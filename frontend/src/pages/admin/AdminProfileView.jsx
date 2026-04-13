import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import '../../css/adminDashboard.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const AdminProfileView = () => {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const email = user?.email || ''
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update profile')
      }

      const updatedUser = data.data?.user
      if (updatedUser) {
        updateProfile(updatedUser)
        setPhone(updatedUser.phone || '')
      } else {
        updateProfile({ name: name.trim(), phone: phone.trim() || null })
      }

      setMessage('Profile updated successfully')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (!currentPassword.trim()) {
      setPasswordError('Current password is required')
      return
    }

    if (newPassword.trim().length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match')
      return
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    setPasswordLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: (email || user?.email || '').trim(),
          new_password: newPassword,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Unable to change password')
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordMessage(data.message || 'Password changed successfully')
    } catch (err) {
      setPasswordError(err.message || 'Unable to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <section className="container page-shell admin-dashboard admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h1>Ticket Nepal</h1>
          <p>Vendor Command Center</p>
        </div>

        <nav className="admin-tabs side-tabs">
          <Link to="/admin" className="admin-tab admin-tab-link">
            Back to Dashboard
          </Link>
        </nav>
      </aside>

      <div className="admin-main">
        <div className="admin-header">
          <h2>Admin Profile</h2>
          <p>Manage your vendor account details.</p>
        </div>

        <div className="admin-section admin-profile-card">
          <div className="admin-profile-head">
            <div className="admin-profile-avatar" aria-hidden="true">
              {(name || user?.name || 'U').trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <h3>{name || user?.name || 'Vendor User'}</h3>
              <p>{email || user?.email || 'No email set'}</p>
              {phone && <p>{phone}</p>}
            </div>
          </div>

          <form className="admin-form admin-profile-form" onSubmit={handleSubmit}>
            <div className="profile-field">
              <label htmlFor="admin-name">Full Name</label>
              <input
                id="admin-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                disabled
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Email cannot be changed after registration</small>
            </div>

            <div className="profile-field">
              <label htmlFor="admin-phone">Phone Number</label>
              <input
                id="admin-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +977-9841234567"
              />
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="admin-role">Role</label>
              <input
                id="admin-role"
                type="text"
                value={user?.role || 'vendor'}
                disabled
              />
            </div>

            {error && <p className="admin-error">{error}</p>}
            {message && <p className="admin-success">{message}</p>}

            <div className="profile-actions">
              <button type="submit" className="profile-save-btn">Save Changes</button>
            </div>
          </form>

          <div className="profile-divider" />

          <div className="admin-password-head">
            <h3>Change Password</h3>
            <p>Update your account password securely.</p>
          </div>

          <form className="admin-form admin-password-form" onSubmit={handlePasswordChange}>
            <div className="profile-field">
              <label htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="confirm-new-password">Confirm New Password</label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            {passwordError && <p className="admin-error">{passwordError}</p>}
            {passwordMessage && <p className="admin-success">{passwordMessage}</p>}

            <div className="profile-actions">
              <button type="submit" className="profile-save-btn" disabled={passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default AdminProfileView
