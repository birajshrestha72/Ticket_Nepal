# Ticket Nepal Backend - FastAPI

Backend API for Ticket Nepal bus ticketing system built with **Python FastAPI** and **PostgreSQL**.

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DB_*`: PostgreSQL credentials
- `JWT_SECRET_KEY`: Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- `FIREBASE_*`: Optional, for Google OAuth

### 3. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE ticket_nepal;
```

Run the schema from your SQL file.

### 4. Run Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload --port 5000

# Or use Python directly
python main.py
```

Server runs on: `http://localhost:5000`
- **API Docs**: http://localhost:5000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:5000/redoc

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       └── auth.py          # Auth endpoints
│   ├── config/
│   │   ├── database.py          # PostgreSQL connection
│   │   ├── firebase.py          # Firebase Admin SDK
│   │   └── settings.py          # Environment config
│   ├── core/
│   │   ├── dependencies.py      # FastAPI dependencies
│   │   ├── exceptions.py        # Custom exceptions
│   │   └── security.py          # Password hashing, JWT
│   └── models/
│       └── user.py              # Pydantic schemas
├── main.py                      # FastAPI app entry point
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables
└── README.md
```

## 🔐 Authentication Endpoints

### Base URL: `/api/v1/auth`

All endpoints documented at `/docs` with interactive testing.

#### 1. **Register** (POST `/register`)

```json
{
  "name": "Ram Bahadur Thapa",
  "email": "ram@example.com",
  "phone": "9801234567",
  "password": "password123",
  "role": "customer"
}
```

#### 2. **Login** (POST `/login`)

```json
{
  "email": "ram@example.com",
  "password": "password123"
}
```

#### 3. **Google OAuth** (POST `/google`)

```json
{
  "idToken": "firebase_token_here",
  "role": "customer"
}
```

#### 4. **Get Profile** (GET `/me`)

Protected route - requires Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

#### 5. **Update Profile** (PUT `/profile`)

```json
{
  "name": "New Name",
  "phone": "9801234567"
}
```

## 🛠️ Technology Stack

- **FastAPI**: Modern async web framework
- **Uvicorn**: ASGI server
- **asyncpg**: Async PostgreSQL driver
- **Pydantic**: Data validation with Python type hints
- **python-jose**: JWT token handling
- **passlib**: Password hashing with bcrypt
- **firebase-admin**: Google OAuth verification

## 🔑 Authentication Flow

1. **Email/Password**: 
   - Password hashed with bcrypt (12 rounds)
   - JWT token returned on successful login
   
2. **Google OAuth**:
   - Frontend sends Firebase ID token
   - Backend verifies with Firebase Admin SDK
   - Creates/logs in user, returns JWT

3. **Protected Routes**:
   - Require `Authorization: Bearer <token>` header
   - Token decoded and validated
   - User info attached to request

## 📊 Database Schema

Uses PostgreSQL with the following tables:
- `users`: User accounts
- `vendors`: Vendor information
- `buses`: Bus details
- `routes`: Bus routes
- `bus_schedules`: Schedules
- `bookings`: Ticket bookings
- `payments`: Transactions

## 🔧 Development

### Run with Auto-Reload

```bash
uvicorn main:app --reload --port 5000
```

### Interactive API Docs

FastAPI automatically generates:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

### Testing API

Use the `/docs` page to test all endpoints interactively, or use curl/Postman:

```bash
# Register user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 🌐 Frontend Integration

Update frontend API calls to:

```javascript
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Register
const response = await fetch(`${API_BASE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
});

// Protected routes
const response = await fetch(`${API_BASE_URL}/auth/me`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📝 Code Features

- ✅ **Async/Await**: All database operations are async
- ✅ **Type Hints**: Full Python type annotations
- ✅ **Bilingual Comments**: Nepali (romanized) + English
- ✅ **Auto Validation**: Pydantic models validate input/output
- ✅ **Interactive Docs**: Swagger UI built-in
- ✅ **Error Handling**: Custom exception classes
- ✅ **Security**: Password hashing, JWT tokens, CORS

## 🚧 TODO

- [ ] Add password reset functionality
- [ ] Add email verification
- [ ] Add refresh tokens
- [ ] Add rate limiting
- [ ] Add unit tests (pytest)
- [ ] Add logging (structlog)
- [ ] Add database migrations (Alembic)

## 🆚 Why FastAPI over Node.js?

- **Performance**: FastAPI is one of the fastest Python frameworks
- **Type Safety**: Built-in validation with Pydantic
- **Auto Documentation**: Swagger/OpenAPI docs generated automatically
- **Modern Python**: Uses async/await, type hints
- **Easy to Learn**: Clear, intuitive syntax
- **Great DX**: Excellent error messages and debugging

---

**Note**: Old Node.js files are in the same directory. You can delete `server.js`, `routes/`, `controllers/`, `middleware/`, `config/*.js` files after confirming FastAPI works correctly.
