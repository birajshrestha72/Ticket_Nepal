/**
 * Authentication Context Provider
 * Manages user authentication state using Firebase
 * Handles login, logout, signup, and role management
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signupWithEmail, 
  loginWithEmail, 
  loginWithGoogle, 
  logoutUser,
  resetPassword,
  getCurrentUserToken,
  subscribeToAuthChanges,
  handleRedirectResult
} from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



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
   * Subscribe to Firebase auth state changes and check localStorage
   */
  useEffect(() => {
    let isMounted = true;
    
    // Check localStorage for backend JWT auth
    const checkLocalStorage = () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setLoading(false);
          return true; // Found stored user
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      return false; // No stored user
    };
    
    // Initialize auth state
    const initializeAuth = async () => {
      console.log('🔵 AuthContext: Initializing auth...');
      
      // Check localStorage for existing session
      console.log('🔵 AuthContext: Checking localStorage...');
      const hasStoredUser = checkLocalStorage();
      
      if (hasStoredUser) {
        // Found stored user, we're done
        console.log('✅ AuthContext: Found stored user');
        return;
      }
      
      // Subscribe to Firebase auth state changes
      console.log('🔵 AuthContext: Subscribing to Firebase auth changes...');
      const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
        if (isMounted) {
          console.log('🔵 AuthContext: Firebase auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
          await updateUserState(firebaseUser);
          setLoading(false);
        }
      });
      
      return unsubscribe;
    };
    
    // Run initialization
    let unsubscribe;
    initializeAuth().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigate]);

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
   * Login with Google using popup flow
   */
  const loginWithGoogleProvider = async () => {
    try {
      console.log('🔵 AuthContext: Starting Google login...');
      setLoading(true);
      setError(null);
      
      // Use popup for immediate response
      console.log('🔵 AuthContext: Calling loginWithGoogle()...');
      const result = await loginWithGoogle();
      
      if (result && result.user) {
        console.log('✅ AuthContext: Google sign-in successful:', result.user.email);
        // Sync with backend and update state
        await syncUserWithBackend(result.user);
        const userData = await updateUserState(result.user);
        
        // Navigate based on role
        if (userData && userData.role) {
          console.log('✅ AuthContext: Navigating to dashboard for role:', userData.role);
          if (userData.role === 'system_admin') {
            navigate('/superadmin');
          } else if (userData.role === 'vendor') {
            navigate('/vendor');
          } else if (userData.role === 'customer') {
            navigate('/customer');
          } else {
            navigate('/');
          }
        }
        
        setLoading(false);
        return { success: true, user: result.user };
      }
      
      setLoading(false);
      return { success: false, error: 'No user returned from Google' };
    } catch (error) {
      console.error('🔴 AuthContext: Google login error:', error);
      const errorMessage = getFirebaseErrorMessage(error);
      setError(errorMessage);
      setLoading(false);
      
      // Re-throw the error so Login.jsx can handle it properly
      throw error;
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
   * Update user state from backend login (for email/password with JWT)
   * This is used by Login.jsx after successful backend authentication
   */
  const updateUserFromBackend = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
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
    updateUserFromBackend,
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
