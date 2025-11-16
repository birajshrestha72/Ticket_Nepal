# Login API Testing Guide

## Test User Accounts

From the seed data, you can use these accounts:

### Test Credentials

**Super Admin:**
- Email: `superadmin@ticketnepal.com`
- Password: `password123`
- Role: system_admin

**Vendors:**
- Email: `ram@abctravels.com`
- Password: `password123`
- Role: vendor

- Email: `sita@xyzbuses.com`
- Password: `password123`
- Role: vendor

**Customers:**
- Email: `bikash@gmail.com`
- Password: `password123`
- Role: customer

- Email: `anjali@gmail.com`
- Password: `password123`
- Role: customer

## API Endpoints

### 1. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bikash@gmail.com",
    "password": "password123"
  }'
```

### 2. Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9801234567",
    "password": "password123",
    "role": "customer"
  }'
```

### 3. Get Profile (requires token)
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Google Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "FIREBASE_ID_TOKEN",
    "role": "customer"
  }'
```

## Testing from Frontend

1. Start backend: `cd backend && python3 -m uvicorn main:app --reload --port 8000`
2. Start frontend: `cd bus-ticketing-frontend && npm run dev`
3. Go to http://localhost:5173/login
4. Use test credentials above

## Response Format

### Success Response:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 5,
      "name": "Bikash Adhikari",
      "email": "bikash@gmail.com",
      "phone": "9851111111",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Response:
```json
{
  "detail": "Invalid email or password"
}
```

## Notes

- All test account passwords are: `password123`
- Tokens expire after 7 days (10080 minutes)
- Store token in localStorage: `localStorage.setItem('token', token)`
- Include token in requests: `Authorization: Bearer <token>`
