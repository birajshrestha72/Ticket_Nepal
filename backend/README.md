# Ticket Nepal Backend

Backend API for the Ticket Nepal bus ticketing system built with Node.js, Express, and PostgreSQL.

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required environment variables:
- `DB_*`: PostgreSQL database credentials
- `JWT_SECRET`: Secret key for JWT tokens (generate with `openssl rand -base64 32`)
- `FIREBASE_*`: Firebase Admin SDK credentials (optional, for Google OAuth)

### 3. Database Setup
Create the PostgreSQL database and run the schema from the provided SQL file.

```sql
-- Create database
CREATE DATABASE ticket_nepal;

-- Connect and run the schema
\c ticket_nepal
-- Then paste the schema from your SQL file
```

### 4. Start Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000` (or the PORT specified in .env)

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js      # PostgreSQL connection pool
│   └── firebase.js      # Firebase Admin SDK setup
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   ├── authMiddleware.js    # JWT verification
│   ├── errorHandler.js      # Global error handling
│   └── validators.js        # Input validation
├── routes/
│   └── authRoutes.js        # Auth endpoints
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── README.md
└── server.js            # Main entry point
```

## 🔐 Authentication Endpoints

### Base URL: `/api/v1/auth`

#### 1. Register (Email/Password)
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Ram Bahadur Thapa",
  "email": "ram@example.com",
  "phone": "9801234567",
  "password": "password123",
  "role": "customer"  // optional: "customer" or "vendor"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Ram Bahadur Thapa",
      "email": "ram@example.com",
      "phone": "9801234567",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login (Email/Password)
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "ram@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Google OAuth
```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "idToken": "firebase_id_token_here",
  "role": "customer"  // optional
}
```

#### 4. Get Profile (Protected)
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

#### 5. Update Profile (Protected)
```http
PUT /api/v1/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "phone": "9801234567"
}
```

## 🔑 JWT Authentication

All protected routes require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_token_here>
```

Token payload includes:
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "customer",
  "iat": 1700000000,
  "exp": 1700604800
}
```

## 🗄️ Database Schema

The backend expects a PostgreSQL database with the following key tables:
- `users`: User accounts (customers, vendors, admins)
- `vendors`: Vendor details
- `buses`: Bus information
- `routes`: Bus routes
- `bus_schedules`: Schedule information
- `bookings`: Ticket bookings
- `payments`: Payment transactions

Refer to your SQL schema file for complete structure.

## 🛠️ Technologies Used

- **Node.js**: Runtime environment
- **Express**: Web framework
- **PostgreSQL**: Database (via `pg` library)
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **Firebase Admin**: Google OAuth verification
- **express-validator**: Input validation
- **CORS**: Cross-origin resource sharing

## 📝 Development Notes

### Bilingual Comments
Code includes bilingual comments (Nepali romanized + English) for clarity.

### Error Handling
All errors are caught by the global error handler and return consistent JSON responses:
```json
{
  "status": "error",
  "message": "Error description"
}
```

### Security Features
- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- CORS configuration

## 🚧 TODO

- [ ] Add password reset functionality
- [ ] Add email verification
- [ ] Add refresh token mechanism
- [ ] Add rate limiting
- [ ] Add API documentation (Swagger)
- [ ] Add unit tests
- [ ] Add logging system (Winston/Morgan)

## 📞 Support

For issues or questions, refer to the main project documentation.
