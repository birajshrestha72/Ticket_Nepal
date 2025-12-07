/**
 * Firebase Configuration and Initialization
 * Handles Firebase Authentication setup
 */
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

// Firebase configuration - Replace with your actual Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

// Initialize Firebase
let app;
let auth = null;
let googleProvider = null;
let isCheckingRedirect = false; // Flag to prevent multiple redirect checks

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Configure Google Provider
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Continue with mock auth if Firebase fails
}

/**
 * Sign up with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<UserCredential>}
 */
export const signupWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<UserCredential>}
 */
export const loginWithEmail = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Sign in with Google using popup
 * @returns {Promise<UserCredential>}
 */
export const loginWithGoogle = async () => {
  try {
    console.log('🔵 Firebase: Starting Google popup...');
    console.log('🔵 Firebase: Auth object:', auth);
    console.log('🔵 Firebase: Google provider:', googleProvider);
    
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    
    if (!googleProvider) {
      throw new Error('Google provider not initialized');
    }
    
    // Use popup for immediate response
    console.log('🔵 Firebase: Calling signInWithPopup...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('✅ Firebase: signInWithPopup succeeded:', result.user.email);
    
    return result;
  } catch (error) {
    console.error('🔴 Firebase: Google login error:', error);
    throw error;
  }
};

/**
 * Get redirect result after Google sign-in redirect
 * Call this on app initialization to handle redirect results
 * @returns {Promise<UserCredential|null>}
 */
export const handleRedirectResult = async () => {
  // Prevent multiple simultaneous calls
  if (isCheckingRedirect) {
    console.log('⚠️  Firebase: Already checking redirect, skipping...');
    return null;
  }

  try {
    isCheckingRedirect = true;
    console.log('🔵 Firebase: Checking for redirect result...');
    
    if (!auth) {
      console.log('⚠️  Firebase: Auth not initialized, skipping redirect check');
      return null;
    }
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('⏱️  Firebase: Redirect check timeout (5s), returning null');
        resolve(null);
      }, 5000);
    });
    
    const resultPromise = getRedirectResult(auth);
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    if (result) {
      console.log('✅ Firebase: Got redirect result:', result.user?.email);
    } else {
      console.log('🔵 Firebase: No redirect result (user did not just sign in)');
    }
    
    return result;
  } catch (error) {
    console.error('🔴 Firebase: Redirect result error:', error);
    // Don't throw - just return null so app can continue
    return null;
  } finally {
    isCheckingRedirect = false;
  }
};

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Get current user's ID token
 * @returns {Promise<string|null>}
 */
export const getCurrentUserToken = async () => {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(true);
    }
    return null;
  } catch (error) {
    console.error('Token error:', error);
    return null;
  }
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Callback function to handle auth state
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, googleProvider };
