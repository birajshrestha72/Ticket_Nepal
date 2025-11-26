import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PublicRoute Component
 * Prevents authenticated users from accessing login/signup pages
 * Redirects them to their respective dashboards based on role
 */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Wait for auth state to load
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // If user is logged in, redirect to appropriate dashboard
  if (user) {
    switch (user.role) {
      case 'system_admin':
        return <Navigate to="/superadmin" replace />;
      case 'vendor':
        return <Navigate to="/vendor" replace />;
      case 'customer':
        return <Navigate to="/customer" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // If not logged in, show the public page (login/signup)
  return children;
};

export default PublicRoute;
