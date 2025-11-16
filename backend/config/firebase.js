/**
 * Firebase Admin Configuration - Google OAuth verification ko lagi
 * Firebase Admin SDK use garera user tokens verify garcha
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Firebase Admin initialize garcha
let firebaseApp;

try {
  // Service account credentials
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  // Check if credentials are provided
  if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    console.warn('⚠️  Firebase credentials not configured. Google OAuth will not work.');
  } else {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token from frontend
 * @returns {Promise<Object>} Decoded token with user info
 */
export const verifyIdToken = async (idToken) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};

export default firebaseApp;
