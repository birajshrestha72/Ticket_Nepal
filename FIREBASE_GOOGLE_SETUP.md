# Firebase Google Authentication Setup Guide

## 🎯 Quick Start - Get Google Sign-In Working in 10 Minutes

### Step 1: Create Firebase Project (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `ticket-nepal` (or your preferred name)
4. **Disable** Google Analytics (optional, can enable later)
5. Click **"Create Project"**
6. Wait for project creation (30 seconds)
7. Click **"Continue"**

---

### Step 2: Enable Google Authentication (1 minute)

1. In Firebase Console, click **"Authentication"** in left sidebar
2. Click **"Get started"** button
3. Go to **"Sign-in method"** tab
4. Click on **"Google"** in the providers list
5. Toggle **Enable** switch to ON
6. **Project support email:** Select your email from dropdown
7. Click **"Save"**

✅ Google Sign-In is now enabled!

---

### Step 3: Get Firebase Web App Credentials (2 minutes)

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** `</>`
5. **App nickname:** Enter `Ticket Nepal Web`
6. **Check the box** "Also set up Firebase Hosting" (optional)
7. Click **"Register app"**

You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "ticket-nepal-xxxxx.firebaseapp.com",
  projectId: "ticket-nepal-xxxxx",
  storageBucket: "ticket-nepal-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

8. **Copy** these values (you'll need them in next step)
9. Click **"Continue to console"**

---

### Step 4: Configure Frontend Environment (2 minutes)

1. Create `.env` file in `bus-ticketing-frontend/` folder:

```bash
cd /Users/biraj/Ticket_Nepal/bus-ticketing-frontend
touch .env
```

2. Open `.env` and paste your Firebase config:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=ticket-nepal-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ticket-nepal-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=ticket-nepal-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Backend API URL
VITE_API_URL=http://localhost:8000/api/v1
```

3. **Save** the file

---

### Step 5: Add Authorized Domains (1 minute)

1. In Firebase Console, go to **Authentication** > **Settings** tab
2. Scroll to **"Authorized domains"** section
3. You should see `localhost` already listed ✅
4. For production, click **"Add domain"** and add:
   - Your production domain (e.g., `ticketnepal.com`)
   - Your staging domain (e.g., `staging.ticketnepal.com`)

---

### Step 6: Get Backend Service Account (2 minutes)

1. In Firebase Console, click **gear icon** ⚙️ > **"Project settings"**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"** button
4. Click **"Generate key"** in confirmation dialog
5. A JSON file will download (e.g., `ticket-nepal-xxxxx-firebase-adminsdk-xxxxx.json`)
6. **Rename** it to `firebase-credentials.json`
7. **Move** it to your backend folder:

```bash
mv ~/Downloads/ticket-nepal-xxxxx-firebase-adminsdk-xxxxx.json /Users/biraj/Ticket_Nepal/backend/firebase-credentials.json
```

8. **IMPORTANT:** Add to `.gitignore`:

```bash
cd /Users/biraj/Ticket_Nepal/backend
echo "firebase-credentials.json" >> .gitignore
```

---

### Step 7: Update Database Schema (1 minute)

Run this SQL to add Firebase support:

```sql
-- Connect to database
psql -U postgres -d ticket_nepal

-- Add Firebase UID column
ALTER TABLE users ADD COLUMN IF NOT EXISTS uid VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);

-- Add email verification column
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add last login timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Add photo URL for Google profile pics
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- Verify columns added
\d users
```

---

### Step 8: Restart Servers (30 seconds)

1. **Stop** both frontend and backend (Ctrl+C)

2. **Restart Backend:**
```bash
cd /Users/biraj/Ticket_Nepal/backend
python3 -m uvicorn main:app --reload --port 8000
```

You should see:
```
✅ Firebase Admin SDK initialized successfully
```

3. **Restart Frontend:**
```bash
cd /Users/biraj/Ticket_Nepal/bus-ticketing-frontend
npm run dev
```

You should see:
```
✅ Firebase initialized successfully
```

---

### Step 9: Test Google Sign-In (1 minute)

1. Open browser: http://localhost:5173/login
2. Click **"Sign in with Google"** button
3. Select your Google account
4. Click **"Allow"** to grant permissions
5. You should be redirected to dashboard

**Expected Flow:**
```
Click Google Button
  ↓
Google Account Selection Popup
  ↓
Grant Permissions
  ↓
Firebase Authentication
  ↓
Backend User Sync
  ↓
Redirect to Dashboard
```

---

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Google sign-in enabled in Firebase Console
- [ ] `.env` file created with Firebase credentials
- [ ] `firebase-credentials.json` downloaded and placed in backend
- [ ] Database columns added (uid, email_verified, last_login, photo_url)
- [ ] Backend shows "✅ Firebase Admin SDK initialized"
- [ ] Frontend shows "✅ Firebase initialized successfully"
- [ ] Google Sign-In button appears on login page
- [ ] Can click Google button and see account selection
- [ ] Successfully logs in and redirects to dashboard
- [ ] User synced to database (check `users` table)

---

## 🐛 Troubleshooting

### Error: "Firebase not initialized"

**Cause:** `.env` file missing or incorrect

**Solution:**
```bash
cd bus-ticketing-frontend
cat .env  # Verify file exists and has correct values
```

Restart frontend server after creating `.env`

---

### Error: "auth/unauthorized-domain"

**Cause:** Domain not authorized in Firebase Console

**Solution:**
1. Go to Firebase Console > Authentication > Settings > Authorized domains
2. Add `localhost` (should be there by default)
3. For production, add your actual domain

---

### Error: "Popup closed by user"

**Cause:** User closed Google popup before completing sign-in

**Solution:** This is normal user behavior. Ask user to try again.

---

### Error: "Firebase credentials not configured"

**Cause:** Backend can't find `firebase-credentials.json`

**Solution:**
```bash
# Check if file exists
ls -la /Users/biraj/Ticket_Nepal/backend/firebase-credentials.json

# If missing, download again from Firebase Console
# Service Accounts > Generate new private key
```

---

### Error: "Failed to sync user with backend"

**Cause:** Database missing `uid` column or backend not running

**Solution:**
1. Run the SQL schema update (Step 7)
2. Verify backend is running on port 8000
3. Check backend logs for errors

---

### Google Sign-In Button Not Appearing

**Cause:** Frontend JavaScript error

**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Verify `firebase.js` imported correctly
4. Restart frontend server

---

## 📊 What Happens Behind the Scenes

### Google Sign-In Flow:

```
1. User clicks "Sign in with Google"
   ↓
2. Frontend: Opens Google OAuth popup
   signInWithPopup(auth, googleProvider)
   ↓
3. User selects Google account
   ↓
4. Google: Verifies user identity
   ↓
5. Firebase: Creates Firebase user (or logs in existing)
   Returns: user object with UID, email, name, photo
   ↓
6. Frontend: Gets Firebase ID token
   await user.getIdToken()
   ↓
7. Frontend: Calls backend sync endpoint
   POST /api/v1/auth/sync
   Headers: { Authorization: Bearer <firebase_token> }
   Body: { uid, email, display_name }
   ↓
8. Backend: Verifies Firebase token
   firebase_admin.auth.verify_id_token(token)
   ↓
9. Backend: Checks if user exists in PostgreSQL
   SELECT * FROM users WHERE uid = $1
   ↓
10. Backend: Creates or updates user
    INSERT INTO users (uid, email, display_name, photo_url, role)
    VALUES ($1, $2, $3, $4, 'customer')
    ↓
11. Backend: Returns user data
    { user_id, uid, email, role, ... }
    ↓
12. Frontend: Stores user in AuthContext
    setUser({ ...userData, token })
    ↓
13. Frontend: Redirects to dashboard
    navigate('/dashboard')
```

---

## 🔐 Security Features

### Token Security:
- Firebase ID tokens expire after 1 hour
- Auto-refresh handled by `firebase/auth`
- Backend verifies every token on every request
- Tokens are signed and can't be forged

### User Data Protection:
- Passwords never stored (Google handles authentication)
- Firebase tokens transmitted via HTTPS only
- Backend uses JWT for subsequent requests
- Role-based access control enforced

### Google OAuth Scopes:
- `profile` - Access to name, profile picture
- `email` - Access to email address
- No access to Google Drive, Calendar, etc.

---

## 📱 Testing on Different Devices

### Desktop Browsers:
- Chrome ✅ (Best support)
- Firefox ✅
- Safari ✅
- Edge ✅

### Mobile Browsers:
- Chrome Mobile ✅
- Safari iOS ✅
- Firefox Mobile ✅

### Known Limitations:
- Popup blockers may prevent Google popup (users need to allow popups)
- Private/Incognito mode may have restrictions
- Some browsers block third-party cookies (affects OAuth)

---

## 🚀 Production Deployment

### Before going live:

1. **Add Production Domain:**
   - Firebase Console > Authentication > Settings > Authorized domains
   - Add your domain: `ticketnepal.com`

2. **Update Environment Variables:**
   ```env
   # Production .env
   VITE_FIREBASE_API_KEY=same_as_development
   VITE_FIREBASE_AUTH_DOMAIN=same_as_development
   VITE_API_URL=https://api.ticketnepal.com/api/v1
   ```

3. **Secure Service Account:**
   - Store `firebase-credentials.json` securely on server
   - Use environment variable: `FIREBASE_CREDENTIALS_PATH`
   - Never commit to git!

4. **Enable HTTPS:**
   - Google OAuth requires HTTPS in production
   - Use Let's Encrypt for free SSL certificate
   - Configure Nginx/Apache accordingly

5. **Monitor Authentication:**
   - Firebase Console > Authentication > Users
   - View sign-in methods, user count, activity

---

## 📈 Firebase Usage Limits (Free Tier)

**Spark Plan (Free):**
- ✅ Authentication: Unlimited users
- ✅ 10 GB storage
- ✅ 1 GB/day downloads
- ✅ Phone auth: 10,000/month (if enabled)

**No credit card required for authentication!**

---

## 🎉 Success!

Once setup is complete, you'll have:

✅ **Google One-Click Sign-In**
✅ **No password management needed**
✅ **Secure token-based authentication**
✅ **User profile pictures from Google**
✅ **Email verification (Google accounts are pre-verified)**
✅ **Seamless user experience**

Users can now sign up and log in with a single click! 🚀

---

## 📞 Support

**Firebase Documentation:**
- https://firebase.google.com/docs/auth/web/google-signin

**Common Issues:**
- Check Firebase Console > Authentication > Users (see who's signed up)
- Check browser console for errors (F12)
- Check backend logs for authentication failures
- Verify `.env` file has correct values

**Need Help?**
- Firebase Community: https://firebase.google.com/community
- Stack Overflow: Tag `firebase-authentication`

---

**Last Updated:** December 6, 2025
**Version:** 1.0
**Status:** Ready to Deploy 🚀
