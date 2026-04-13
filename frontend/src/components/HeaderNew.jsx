import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoImage from '../assets/logo.png'
import '../css/header.css'

const getDashboardPath = (role) => {
  if (role === 'vendor') {
    return '/admin'
  }
  if (role === 'system_admin') {
    return '/supadmin'
  }
  return '/user'
}

const HeaderNew = () => {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const dashboardPath = getDashboardPath(user?.role)
  const firstName = (user?.name || user?.role || 'User').trim().split(/\s+/)[0]

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev)
  }

  const closeMenu = () => {
    setMobileMenuOpen(false)
    setProfileMenuOpen(false)
  }

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!profileMenuRef.current) return
      if (!profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="header-logo" onClick={closeMenu}>
          <img
            src={logoImage}
            alt="Ticket Nepal Logo"
            className="logo-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <span className="logo-text">Ticket Nepal</span>
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
          <Link to="/vendors" className="nav-link" onClick={closeMenu}>Vendors</Link>
          <Link to="/bus-details" className="nav-link" onClick={closeMenu}>Bus Details</Link>
          <Link to="/destinations" className="nav-link" onClick={closeMenu}>Destinations</Link>

          <div className="nav-profile">
            {user ? (
              <div className="profile-menu" ref={profileMenuRef}>
                <button
                  type="button"
                  className="profile-link profile-trigger"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                >
                  <span className="profile-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="profile-icon-svg" focusable="false">
                      <path
                        d="M12 12.25a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2c-3.84 0-7.25 2.12-9.03 5.34a1 1 0 0 0 .87 1.5h16.32a1 1 0 0 0 .87-1.5c-1.78-3.22-5.19-5.34-9.03-5.34Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="profile-name">{firstName}</span>
                  <span className="profile-caret" aria-hidden="true">▾</span>
                </button>

                {profileMenuOpen && (
                  <div className="profile-dropdown" role="menu">
                    <p className="profile-dropdown-name">{user?.name || 'User'}</p>
                    <p className="profile-dropdown-email">{user?.email || 'No email'}</p>
                    <Link
                      to={dashboardPath}
                      className="profile-dropdown-link"
                      onClick={closeMenu}
                      role="menuitem"
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      type="button"
                      className="profile-dropdown-logout"
                      role="menuitem"
                      onClick={() => {
                        logout()
                        closeMenu()
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="login-btn" onClick={closeMenu}>
                <span>Login</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default HeaderNew
