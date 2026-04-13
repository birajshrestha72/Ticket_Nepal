import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredKeys = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
]

export const isFirebaseConfigured = requiredKeys.every(Boolean)

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
const auth = app ? getAuth(app) : null
const googleProvider = app ? new GoogleAuthProvider() : null

const IDENTITY_TOOLKIT_PROJECTS = 'https://identitytoolkit.googleapis.com/v1/projects'

export const checkFirebaseProjectConfig = async () => {
  if (!isFirebaseConfigured || !firebaseConfig.apiKey) {
    return {
      ok: false,
      message: 'Google login disabled: missing Firebase client configuration.',
    }
  }

  try {
    const response = await fetch(`${IDENTITY_TOOLKIT_PROJECTS}?key=${firebaseConfig.apiKey}`)
    const data = await response.json()

    if (response.ok) {
      return { ok: true, message: '' }
    }

    const reason = String(data?.error?.message || '')
    if (reason.includes('CONFIGURATION_NOT_FOUND')) {
      return {
        ok: false,
        message: 'Firebase project is not linked to this API key for Authentication. Re-copy Web App config from Firebase Console and enable Authentication providers.',
      }
    }

    return {
      ok: false,
      message: `Firebase Auth configuration check failed: ${reason || 'Unknown error'}`,
    }
  } catch {
    return {
      ok: false,
      message: 'Unable to verify Firebase configuration. Check internet and Firebase project settings.',
    }
  }
}

export { auth, googleProvider }
