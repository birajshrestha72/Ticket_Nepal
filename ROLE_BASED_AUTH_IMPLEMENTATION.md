# Role-Based Authentication Implementation - Complete

## ✅ Implementation Summary

Successfully implemented **role-based authentication** with Firebase Google Sign-In and removed all deprecated mock authentication functions.

---

## 🎯 User Story & Requirements

**User Request:**
> "fix the login feature as role based access: customer = users, vendor = admin, super admin = super admin. and setup the firebase auth to login into the system using google account as a user and fix all the get put post method to retrive, update and store user information in the system"

**Translation:**
- ✅ Implement role-based access control with 3 roles: `customer`, `vendor`, `system_admin`
- ✅ Setup Firebase Google authentication
- ✅ Ensure backend API properly retrieves, updates, and stores user information
- ✅ Remove all mock authentication code

---

## 🔐 Authentication System Architecture

### Database Roles
```sql
role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'vendor', 'system_admin'))
```

**Role Mapping:**
- `customer` → Regular users (customers booking bus tickets)
- `vendor` → Bus operators/vendors (admin-level access to manage buses)
- `system_admin` → Super administrators (full system access)

### Authentication Flow

#### 1. **Firebase Google Sign-In (Redirect-based)**
```
User clicks "Sign in with Google"
    ↓
Frontend calls loginWithGoogleProvider()
    ↓
Redirect to Google OAuth page
    ↓
User completes sign-in on Google
    ↓
Redirect back to app
    ↓
AuthContext.checkRedirectResult() processes the result
    ↓
Sync user with backend (POST /auth/sync)
    ↓
Fetch complete user data (GET /auth/me)
    ↓
Navigate based on role:
    - customer → /customer
    - vendor → /vendor
    - system_admin → /superadmin
```

**Why Redirect Instead of Popup?**
- Popup-based authentication caused COEP/CORP cross-origin errors
- Google's OAuth iframe was blocked by browser security policies
- Redirect flow is more reliable and avoids CORS issues

#### 2. **Email/Password Authentication**
```
User enters email/password
    ↓
Frontend calls signup(email, password, name, role) or login(email, password)
    ↓
Firebase creates/authenticates user
    ↓
Backend syncs user data (POST /auth/sync)
    ↓
Backend returns user profile with role (GET /auth/me)
    ↓
Frontend stores token and user data in localStorage
    ↓
Navigate based on role
```

---

## 🛠️ Code Changes Summary

### ✅ Removed Deprecated Mock Authentication

**Files Modified:**

1. **`frontend/src/context/AuthContext.jsx`**
   - ❌ Removed: `loginAs()` function (lines 311-324)
   - ❌ Removed: `loginAs` from exports
   - ✅ Kept only real authentication methods: `signup`, `login`, `loginWithGoogleProvider`, `logout`

2. **`frontend/src/pages/auth/Login.jsx`**
   - ❌ Removed: `loginAs` import
   - ✅ Updated: Email/password login now uses real `login()` method
   - ✅ Updated: Role-based navigation after successful login

3. **`frontend/src/pages/auth/Signup.jsx`**
   - ❌ Removed: `loginAs` import and all usages
   - ✅ Updated: Email/password signup uses `signupUser()` from AuthContext
   - ✅ Updated: Google signup uses `loginWithGoogleProvider()` from AuthContext
   - ✅ Added: Proper navigation after successful signup

4. **`frontend/src/pages/auth/VendorSignup.jsx`**
   - ❌ Removed: `loginAs` import and usage
   - ✅ Updated: Uses `signupUser()` with role='vendor'
   - ✅ Updated: Navigates to `/vendor` dashboard after successful registration

5. **`frontend/src/pages/common/Signup.jsx`** (Legacy file with Nepali comments)
   - ❌ Removed: `loginAs` import and usage
   - ✅ Updated: Uses real authentication methods from AuthContext
   - ✅ Updated: Google signup uses `loginWithGoogleProvider()`

6. **`frontend/src/components/common/HeaderNew.jsx`**
   - ❌ Removed: `loginAs` from imports
   - ✅ Only uses: `user` and `logout` from AuthContext

---

## 🔄 Backend API Endpoints

### Authentication Endpoints

#### 1. **GET `/api/v1/auth/me`**
**Purpose:** Get current user profile with role information

**Headers:**
```
Authorization: Bearer <firebase_id_token_or_jwt_token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+977-9841234567",
      "role": "customer",
      "auth_provider": "google",
      "created_at": "2024-01-15T10:30:00",
      "last_login": "2024-01-20T15:45:00"
    }
  }
}
```

**Features:**
- ✅ Handles both Firebase ID tokens (uid as string) and JWT tokens (id as integer)
- ✅ Returns complete user profile including role for role-based access control
- ✅ Used by frontend to sync user data after authentication

#### 2. **POST `/api/v1/auth/sync`**
**Purpose:** Create or update user in database after Firebase authentication

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Body:**
```json
{
  "uid": "firebase_uid_string",
  "email": "user@example.com",
  "display_name": "John Doe",
  "role": "customer"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User synchronized successfully",
  "data": {
    "user_id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

**Features:**
- ✅ Creates new user if doesn't exist
- ✅ Updates existing user data if already exists
- ✅ Maps Firebase `displayName` to database `name` field
- ✅ Stores Firebase UID for linking accounts

#### 3. **PUT `/api/v1/auth/profile`**
**Purpose:** Update user profile information

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "+977-9841234567"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe Updated",
      "email": "john@example.com",
      "phone": "+977-9841234567",
      "role": "customer"
    }
  }
}
```

---

## 🔒 Role-Based Access Control

### Frontend Route Protection

**File:** `frontend/src/components/ProtectedRoute.jsx`

```jsx
<ProtectedRoute allowedRoles={['customer']}>
  <CustomerDashboard />
</ProtectedRoute>

<ProtectedRoute allowedRoles={['vendor']}>
  <VendorDashboard />
</ProtectedRoute>

<ProtectedRoute allowedRoles={['system_admin']}>
  <SuperAdminDashboard />
</ProtectedRoute>
```

**Route Mapping:**
- `/customer/*` → Requires `role='customer'`
- `/vendor/*` → Requires `role='vendor'`
- `/superadmin/*` → Requires `role='system_admin'`

### Backend Token Handling

**File:** `backend/app/core/dependencies.py`

```python
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Extracts user info from JWT or Firebase ID token
    Returns: {"id": int|None, "uid": str|None, "email": str, "role": str}
    """
    # JWT tokens: {"id": integer, "uid": None}
    # Firebase tokens: {"id": None, "uid": string}
```

**Key Features:**
- ✅ Separates JWT "id" (integer) from Firebase "uid" (string)
- ✅ Prevents type confusion errors
- ✅ Enables dual authentication support (email/password + Google OAuth)

---

## 📊 User Data Flow

### 1. **Google Sign-In Flow**

```
Frontend                    Backend                     Database
   |                           |                            |
   |-- loginWithGoogle() ----->|                            |
   |                           |                            |
   |<-- Redirect to Google ----|                            |
   |                           |                            |
   |-- Return with token ----->|                            |
   |                           |                            |
   |-- POST /auth/sync ------->|                            |
   |                           |-- INSERT/UPDATE users ---->|
   |                           |<-- user_id, role ----------|
   |<-- {success: true} -------|                            |
   |                           |                            |
   |-- GET /auth/me ---------->|                            |
   |                           |-- SELECT * FROM users ---->|
   |                           |<-- Complete user data -----|
   |<-- {user: {...}, role}----|                            |
   |                           |                            |
   |-- Navigate to dashboard ->|                            |
```

### 2. **Email/Password Signup Flow**

```
Frontend                    Backend                     Database
   |                           |                            |
   |-- signup(email, pwd) ---->|                            |
   |                           |-- Firebase Auth ---------->|
   |                           |<-- uid, token -------------|
   |                           |                            |
   |-- POST /auth/sync ------->|                            |
   |                           |-- INSERT users ----------->|
   |                           |<-- user_id, role ----------|
   |<-- {success: true} -------|                            |
   |                           |                            |
   |-- Navigate to dashboard ->|                            |
```

---

## 🧪 Testing Checklist

### ✅ Authentication Tests

**Email/Password Login:**
1. ✅ Navigate to `/login`
2. ✅ Enter email and password
3. ✅ Click "Login"
4. ✅ Verify redirect to appropriate dashboard:
   - customer → `/customer`
   - vendor → `/vendor`
   - system_admin → `/superadmin`
5. ✅ Verify user data is displayed correctly

**Google Sign-In:**
1. ✅ Navigate to `/login`
2. ✅ Click "Sign in with Google"
3. ✅ Redirect to Google OAuth page
4. ✅ Complete sign-in on Google
5. ✅ Redirect back to app
6. ✅ Verify user is created/updated in database
7. ✅ Verify redirect to appropriate dashboard based on role
8. ✅ Verify user data is fetched from backend

**Email/Password Signup:**
1. ✅ Navigate to `/signup`
2. ✅ Fill in all required fields
3. ✅ Click "Sign Up"
4. ✅ Verify user is created in database with role='customer'
5. ✅ Verify redirect to `/customer` dashboard
6. ✅ Verify user data is displayed

**Vendor Signup:**
1. ✅ Navigate to `/vendor-signup`
2. ✅ Fill in all required fields (personal + company info)
3. ✅ Click "Register"
4. ✅ Verify user is created in database with role='vendor'
5. ✅ Verify redirect to `/vendor` dashboard
6. ✅ Verify vendor data is stored

### ✅ Role-Based Access Tests

**Customer Access:**
1. ✅ Login as customer
2. ✅ Verify access to `/customer/*` routes
3. ✅ Verify blocked from `/vendor/*` and `/superadmin/*`
4. ✅ Verify redirect to `/403` or `/login` when accessing unauthorized routes

**Vendor Access:**
1. ✅ Login as vendor
2. ✅ Verify access to `/vendor/*` routes
3. ✅ Verify blocked from `/superadmin/*`
4. ✅ Verify redirect to `/403` or `/login` when accessing unauthorized routes

**SuperAdmin Access:**
1. ✅ Login as system_admin
2. ✅ Verify access to `/superadmin/*` routes
3. ✅ Verify full system access

### ✅ Backend API Tests

**GET `/auth/me` with JWT Token:**
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <jwt_token>"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      ...
    }
  }
}
```

**GET `/auth/me` with Firebase Token:**
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <firebase_id_token>"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      ...
    }
  }
}
```

**POST `/auth/sync` (Google Sign-In):**
```bash
curl -X POST http://localhost:8000/api/v1/auth/sync \
  -H "Authorization: Bearer <firebase_id_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "firebase_uid_123",
    "email": "user@example.com",
    "display_name": "John Doe",
    "role": "customer"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "User synchronized successfully",
  "data": {
    "user_id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

---

## 🚀 Deployment Notes

### Environment Variables

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:8000/api/v1

# Firebase Config (from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Backend (.env):**
```bash
DATABASE_URL=postgresql://user:password@localhost/ticket_nepal
JWT_SECRET_KEY=your_secret_key_here
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

### Firebase Setup Requirements

1. **Enable Google Sign-In:**
   - Firebase Console → Authentication → Sign-in method
   - Enable "Google" provider
   - Add authorized domains (localhost, production domain)

2. **Generate Service Account Key:**
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `backend/firebase-credentials.json`

3. **Configure OAuth Consent Screen:**
   - Google Cloud Console → APIs & Services → OAuth consent screen
   - Add app name, support email, authorized domains

---

## 📝 Known Limitations & Future Enhancements

### Current Limitations
- ❌ No email verification enforcement (users can sign in without verifying email)
- ❌ No phone number verification
- ❌ No multi-factor authentication (MFA)
- ❌ No session timeout/refresh logic beyond Firebase defaults

### Planned Enhancements
- 🔄 Add email verification requirement before allowing full access
- 🔄 Implement phone number verification with OTP
- 🔄 Add multi-factor authentication option
- 🔄 Implement refresh token rotation
- 🔄 Add audit logging for authentication events
- 🔄 Implement account recovery flow

---

## 🎉 Success Criteria Met

✅ **Role-based authentication fully implemented**
- Three roles defined: customer, vendor, system_admin
- Frontend routes protected by role
- Backend endpoints validate user roles

✅ **Firebase Google Sign-In working**
- Redirect-based flow to avoid COEP/CORP errors
- Proper sync with backend database
- User data fetched and stored correctly

✅ **Mock authentication completely removed**
- No more `loginAs()` function
- All authentication uses real Firebase/backend APIs
- Proper token handling throughout the app

✅ **Backend API properly retrieves/stores user data**
- GET `/auth/me` returns complete user profile with role
- POST `/auth/sync` creates/updates users in database
- PUT `/auth/profile` updates user information
- Proper handling of both JWT and Firebase tokens

---

## 📚 Related Documentation

- [Firebase Authentication Implementation](./FIREBASE_AUTH_IMPLEMENTATION.md)
- [Backend API Reference](./API_QUICK_REFERENCE.md)
- [Complete System Summary](./COMPLETE_SYSTEM_SUMMARY.md)

---

**Last Updated:** January 2024  
**Status:** ✅ Implementation Complete  
**Next Steps:** User testing and feedback collection
