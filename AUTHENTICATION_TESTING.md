# Authentication Testing Guide

Quick guide to test the role-based authentication system.

---

## 🚀 Quick Start

### 1. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```
Backend should be running on: http://localhost:8000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend should be running on: http://localhost:5173

---

## 🧪 Test Scenarios

### Test 1: Google Sign-In (Redirect Flow)

**Steps:**
1. Open browser: http://localhost:5173/login
2. Click "Sign in with Google" button
3. **Expected:** Redirect to Google OAuth page (not a popup)
4. Sign in with your Google account
5. **Expected:** Redirect back to app at http://localhost:5173
6. **Expected:** AuthContext processes redirect result
7. **Expected:** Backend creates/updates user with role='customer'
8. **Expected:** Redirect to `/customer` dashboard
9. **Expected:** User data displays correctly (name, email from Google)

**What to Check:**
- ✅ No COEP/CORP errors in console
- ✅ No popup blockers triggered
- ✅ User data in localStorage: `localStorage.getItem('user')`
- ✅ Token in localStorage: `localStorage.getItem('token')`
- ✅ User role is 'customer' by default
- ✅ Dashboard shows user name from Google account

**Console Commands to Verify:**
```javascript
// Check user data
console.log(JSON.parse(localStorage.getItem('user')));

// Should show:
// {
//   uid: "firebase_uid_...",
//   email: "your@gmail.com",
//   displayName: "Your Name",
//   name: "Your Name",
//   role: "customer",
//   token: "eyJ...",
//   isFirebaseUser: true
// }
```

---

### Test 2: Email/Password Signup (Customer)

**Steps:**
1. Open browser: http://localhost:5173/signup
2. Fill in the form:
   - Name: "Test Customer"
   - Email: "customer@test.com"
   - Password: "test123456"
   - Confirm Password: "test123456"
3. Click "Sign Up"
4. **Expected:** User created in database with role='customer'
5. **Expected:** Redirect to `/customer` dashboard
6. **Expected:** User data displays correctly

**Database Check:**
```sql
-- Check if user was created
SELECT user_id, name, email, role, auth_provider, firebase_uid 
FROM users 
WHERE email = 'customer@test.com';

-- Expected:
-- user_id | name          | email              | role     | auth_provider | firebase_uid
-- --------+---------------+--------------------+----------+---------------+-------------
-- 1       | Test Customer | customer@test.com  | customer | email         | firebase_uid_...
```

---

### Test 3: Vendor Signup

**Steps:**
1. Open browser: http://localhost:5173/vendor-signup
2. Fill in **User Account** section:
   - Name: "Test Vendor"
   - Email: "vendor@test.com"
   - Phone: "+977-9841234567"
   - Password: "vendor123"
   - Confirm Password: "vendor123"
3. Fill in **Company Details** section:
   - Company Name: "Test Bus Company"
   - Registration Number: "REG123456"
   - Address: "Kathmandu, Nepal"
   - License Number: "LIC123456"
4. Click "Register as Vendor"
5. **Expected:** User created with role='vendor'
6. **Expected:** Redirect to `/vendor` dashboard
7. **Expected:** Vendor can access vendor routes

**Database Check:**
```sql
SELECT user_id, name, email, role 
FROM users 
WHERE email = 'vendor@test.com';

-- Expected role: 'vendor'
```

---

### Test 4: Email/Password Login

**Steps:**
1. Open browser: http://localhost:5173/login
2. Enter email: "customer@test.com"
3. Enter password: "test123456"
4. Click "Login"
5. **Expected:** Redirect based on role:
   - customer → `/customer`
   - vendor → `/vendor`
   - system_admin → `/superadmin`

**Backend API Call:**
```bash
# Test login API directly
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "test123456"
  }'

# Expected response:
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Test Customer",
      "email": "customer@test.com",
      "role": "customer",
      ...
    },
    "token": "eyJ..."
  }
}
```

---

### Test 5: Role-Based Access Control

**Test Customer Access:**
1. Login as customer (role='customer')
2. Try to access: http://localhost:5173/customer/bookings
   - **Expected:** ✅ Access granted
3. Try to access: http://localhost:5173/vendor
   - **Expected:** ❌ Redirect to `/403` or `/login`
4. Try to access: http://localhost:5173/superadmin
   - **Expected:** ❌ Redirect to `/403` or `/login`

**Test Vendor Access:**
1. Login as vendor (role='vendor')
2. Try to access: http://localhost:5173/vendor/buses
   - **Expected:** ✅ Access granted
3. Try to access: http://localhost:5173/superadmin
   - **Expected:** ❌ Redirect to `/403` or `/login`

**Test SuperAdmin Access:**
1. Login as system_admin
2. Try to access: http://localhost:5173/superadmin
   - **Expected:** ✅ Access granted

---

### Test 6: Backend API - Get Current User

**With JWT Token (Email/Password Login):**
```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"test123456"}' \
  | jq -r '.data.token')

# Then get user profile
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Test Customer",
      "email": "customer@test.com",
      "phone": null,
      "role": "customer",
      "auth_provider": "email",
      "created_at": "2024-01-20T10:00:00",
      "last_login": "2024-01-20T15:30:00"
    }
  }
}
```

**With Firebase Token (Google Sign-In):**
```bash
# Get Firebase token from browser console:
# localStorage.getItem('token')

curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <firebase_id_token>"

# Expected: Same response format with user data
```

---

### Test 7: Profile Update

**Steps:**
1. Login to app
2. Navigate to profile page
3. Update name and phone number
4. Click "Save"
5. **Expected:** Backend updates user record
6. **Expected:** UI reflects changes
7. **Expected:** Refresh page - changes persist

**API Test:**
```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"test123456"}' \
  | jq -r '.data.token')

# Update profile
curl -X PUT http://localhost:8000/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Customer Name",
    "phone": "+977-9841234567"
  }'

# Expected response:
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Updated Customer Name",
      "email": "customer@test.com",
      "phone": "+977-9841234567",
      "role": "customer"
    }
  }
}
```

---

### Test 8: Logout

**Steps:**
1. Login to app
2. Click "Logout" button
3. **Expected:** Clear localStorage
4. **Expected:** Clear user state in AuthContext
5. **Expected:** Redirect to homepage or login page
6. **Expected:** Cannot access protected routes

**Console Verification:**
```javascript
// After logout, these should be null/undefined
console.log(localStorage.getItem('user')); // null
console.log(localStorage.getItem('token')); // null
```

---

## 🐛 Troubleshooting

### Issue: "Address already in use" (Backend)

**Solution:**
```bash
# Find process using port 8000
lsof -ti:8000

# Kill the process
kill -9 $(lsof -ti:8000)

# Or use a different port in main.py:
# uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)
```

---

### Issue: "Firebase not configured" Error

**Solution:**
1. Check `frontend/.env` has all Firebase config variables
2. Verify `backend/firebase-credentials.json` exists
3. Check Firebase Console that Google Sign-In is enabled
4. Verify authorized domains include `localhost`

---

### Issue: CORS Errors

**Solution:**
1. Check backend CORS configuration in `main.py`
2. Verify frontend is using correct API URL
3. Ensure both servers are running

**Backend CORS Config:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue: "User not found" After Google Sign-In

**Possible Causes:**
1. `/auth/sync` endpoint not called
2. Backend database connection failed
3. Firebase UID not stored properly

**Debug Steps:**
```bash
# Check backend logs
tail -f backend/logs/app.log

# Check database
psql -U postgres -d ticket_nepal -c "SELECT * FROM users WHERE auth_provider='google';"

# Test sync endpoint manually
curl -X POST http://localhost:8000/api/v1/auth/sync \
  -H "Authorization: Bearer <firebase_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test_uid",
    "email": "test@example.com",
    "display_name": "Test User",
    "role": "customer"
  }'
```

---

### Issue: Redirect Not Working After Google Sign-In

**Check:**
1. Browser console for errors
2. AuthContext `checkRedirectResult()` is being called
3. Firebase Auth state change listener is active

**Debug:**
```javascript
// Add to AuthContext.jsx temporarily
useEffect(() => {
  const checkRedirect = async () => {
    console.log('Checking redirect result...');
    const result = await handleRedirectResult();
    console.log('Redirect result:', result);
  };
  checkRedirect();
}, []);
```

---

## ✅ Success Checklist

After completing all tests, verify:

- [ ] Google Sign-In works without popup errors
- [ ] Email/password signup creates users correctly
- [ ] Vendor signup assigns role='vendor'
- [ ] Email/password login redirects based on role
- [ ] Role-based access control blocks unauthorized routes
- [ ] `/auth/me` endpoint returns correct user data
- [ ] Profile updates work correctly
- [ ] Logout clears all user data
- [ ] No `loginAs()` deprecation warnings in console
- [ ] Database has users with correct roles
- [ ] Firebase tokens work with backend APIs
- [ ] JWT tokens work with backend APIs

---

## 📊 Database Verification Queries

```sql
-- Check all users and their roles
SELECT user_id, name, email, role, auth_provider, created_at 
FROM users 
ORDER BY created_at DESC;

-- Count users by role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- Check users by auth provider
SELECT auth_provider, COUNT(*) as count 
FROM users 
GROUP BY auth_provider;

-- Find users with Firebase UID
SELECT user_id, name, email, role, firebase_uid 
FROM users 
WHERE firebase_uid IS NOT NULL;

-- Check last logins
SELECT user_id, name, email, last_login 
FROM users 
ORDER BY last_login DESC 
LIMIT 10;
```

---

**Testing Complete!** 🎉

If all tests pass, the role-based authentication system is working correctly.
