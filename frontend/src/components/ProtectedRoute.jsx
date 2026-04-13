import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const hasRole = (user, allowedRoles = []) => {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  if (!hasRole(user, allowedRoles)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
}

ProtectedRoute.defaultProps = {
  allowedRoles: [],
}
