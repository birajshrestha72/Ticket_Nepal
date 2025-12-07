/**
 * Authentication Context Provider
 * Manages user authentication state using Firebase
 * Handles login, logout, signup, and role management
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signupWithEmail, 
  loginWithEmail, 
  loginWithGoogle, 
  logoutUser,
  resetPassword,
  getCurrentUserToken,
  subscribeToAuthChanges
} from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch user role from backend
   */
  const fetchUserRole = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.role || 'customer';
      }
      
      // Silent fallback - Firebase backend not configured
      return 'customer';
    } catch (error) {
      // Silent fallback
      return 'customer';
    }
  };

  /**
   * Sync user with backend (create/update user record)
   */
  const syncUserWithBackend = async (firebaseUser, role = 'customer') => {
    try {
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch(`${API_URL}/auth/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          display_name: firebaseUser.displayName,
          role: role
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      // Silent fallback - Firebase backend not configured
      return null;
    } catch (error) {
      // Silent fallback
      return null;
    }
  };

  /**
   * Update user state from Firebase user
   */
  const updateUserState = async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        
        // Fetch complete user data from backend
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let backendUserData = null;
        if (response.ok) {
          const data = await response.json();
          backendUserData = data.data.user; // Extract user object from response
        }
        
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: backendUserData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          name: backendUserData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          phone: backendUserData?.phone || null,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          role: backendUserData?.role || 'customer',
          token: token,
          isFirebaseUser: true  // Flag to indicate this is a Firebase user
        };

        setUser(userData);
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        return userData;
      } catch (error) {
        console.error('Error updating user state:', error);
        setError(error.message);
      }
    } else {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  /**
   * Subscribe to Firebase auth state changes
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      await updateUserState(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Sign up with email and password
   */
  const signup = async (email, password, displayName, role = 'customer') => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await signupWithEmail(email, password, displayName);
      await syncUserWithBackend(userCredential.user, role);
      await updateUserState(userCredential.user);
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Signup error:', error);
      setError(getFirebaseErrorMessage(error));
      return { success: false, error: getFirebaseErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await loginWithEmail(email, password);
      await updateUserState(userCredential.user);
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      setError(getFirebaseErrorMessage(error));
      return { success: false, error: getFirebaseErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with Google
   */
  const loginWithGoogleProvider = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await loginWithGoogle();
      await syncUserWithBackend(userCredential.user, 'customer');
      await updateUserState(userCredential.user);
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Google login error:', error);
      setError(getFirebaseErrorMessage(error));
      return { success: false, error: getFirebaseErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send password reset email
   */
  const sendPasswordReset = async (email) => {
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Password reset error:', error);
      setError(getFirebaseErrorMessage(error));
      return { success: false, error: getFirebaseErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh user token
   */
  const refreshToken = async () => {
    try {
      const token = await getCurrentUserToken();
      if (token && user) {
        const updatedUser = { ...user, token };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('token', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };

  /**
   * Legacy compatibility - mock login (deprecated)
   */
  const loginAs = (role = 'customer') => {
    console.warn('loginAs() is deprecated. Use login() or signup() instead.');
    const mockUser = {
      uid: `mock-${role}-${Date.now()}`,
      email: `${role}@ticketnepal.com`,
      displayName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      role: role,
      token: 'mock-token',
      isMock: true
    };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-token');
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    loginWithGoogleProvider,
    logout,
    sendPasswordReset,
    refreshToken,
    loginAs, // Legacy compatibility
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
const getFirebaseErrorMessage = (error) => {
  const errorCode = error.code;
  
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please signup first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completing the sign in.',
    'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.',
  };

  return errorMessages[errorCode] || error.message || 'An error occurred. Please try again.';
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
