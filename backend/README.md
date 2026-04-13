# Backend (FastAPI + PostgreSQL)

FastAPI backend with service/controller structure.

## Run with python3 main.py

1. Go to backend folder
2. Activate virtual environment
3. Install dependencies
4. Configure database env vars
5. Start backend

```bash
cd backend
source ../.venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

## Database configuration

Preferred option is `DATABASE_URL`.

```bash
export DATABASE_URL="postgresql+psycopg://postgres:password@localhost:5432/ticket_nepal"
```

Or use split vars:

```bash
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="ticket_nepal"
export DB_USER="postgres"
export DB_PASSWORD="password"
```

Optional controls:

- `DB_AUTO_CREATE`: create tables automatically (`true/false`)
- `DB_SEED_DEMO`: insert demo records (`true/false`)

Defaults:

- PostgreSQL: `DB_AUTO_CREATE=false`, `DB_SEED_DEMO=false`
- SQLite fallback: `DB_AUTO_CREATE=true`, `DB_SEED_DEMO=true`

## Current API endpoints

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/firebase-login`
- `POST /api/auth/google-login`
- `GET /api/users`
- `GET /api/users/{user_id}`
- `GET /api/buses`
- `POST /api/buses`
- `GET /api/bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/{booking_id}/payment`
- `POST /api/bookings/{booking_id}/payment/esewa/verify`
- `POST /api/bookings/{booking_id}/payment/khalti/verify`
- `GET /api/admin/bookings`
- `GET /api/admin/analytics`
- `GET/POST/PUT/PATCH/DELETE /api/admin/buses...`
- `GET/POST/PUT/PATCH/DELETE /api/admin/routes...`
- `GET/POST/PUT/PATCH/DELETE /api/admin/schedules...`

## Notes

- Backend services are mapped to PostgreSQL tables in your existing schema (`users`, `buses`, `routes`, `bus_schedules`, `bookings`).
- If your local PostgreSQL schema already exists, keep `DB_AUTO_CREATE=false`.

## Firebase Admin setup (Google login)

Use either option A or option B for backend token verification.

Option A: service account file path (closest to your snippet):

```bash
export FIREBASE_SERVICE_ACCOUNT_PATH="/absolute/path/to/serviceAccountKey.json"
```

Option B: inline service account values via env:

```bash
export FIREBASE_PROJECT_ID="your-firebase-project-id"
export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
```

Optional fallback supported: `GOOGLE_APPLICATION_CREDENTIALS`.

Frontend Firebase client variables are listed in `frontend/.env.example`.

## eSewa verification setup

Backend verifies eSewa transaction status before confirming booking payment.

Set these env values in backend runtime:

```bash
export ESEWA_VERIFY_BASE_URL="https://rc.esewa.com.np"  # live: https://esewa.com.np
export ESEWA_MERCHANT_ID="your-merchant-id"
export ESEWA_MERCHANT_SECRET="your-merchant-secret"
```

Verification endpoint:

```text
POST /api/bookings/{booking_id}/payment/esewa/verify
```

Request body:

```json
{
	"user_id": 1,
	"ref_id": "0004VZR",
	"amount": 1450,
	"product_id": "BK12345"
}
```

## Khalti verification setup

Backend verifies Khalti transaction status before confirming booking payment.

Set these env values in backend runtime:

```bash
export KHALTI_VERIFY_BASE_URL="https://dev.khalti.com/api/v2"  # live: https://khalti.com/api/v2
export KHALTI_SECRET_KEY="your-khalti-secret-key"
```

Verification endpoint:

```text
POST /api/bookings/{booking_id}/payment/khalti/verify
```

Request body:

```json
{
	"user_id": 1,
	"pidx": "khalti_pidx_token",
	"amount": 1450,
	"purchase_order_id": "BK12345"
}
```

## Email verification setup

New users must verify email before login. Backend endpoints are already available:

- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/verify-email/resend`

Set these env values:

```bash
export FRONTEND_URL="http://localhost:5173"
export APP_SECRET_KEY="change-this-for-production"
export EMAIL_VERIFY_TTL_SECONDS="86400"
```

## SMTP setup (required for verification and ticket emails)

Set SMTP env values in backend runtime:

```bash
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
export SENDER_EMAIL="your-mail@gmail.com"
export SENDER_PASSWORD="your-app-password"
```

Recommended for Gmail:

1. Enable 2-Step Verification in your Google account.
2. Create an App Password.
3. Use that App Password as `SENDER_PASSWORD`.

## Ticket PDF receipt setup

Ticket PDF is generated from backend and attached to booking email.

- PDF template file: `backend/app/services/pdf_service.py`
- Email template file: `backend/app/services/email_service.py`
- Ticket Nepal logo source used in PDF: `frontend/src/assets/logo.png`

## Refund flow note for this college project

Payment gateway refund APIs are intentionally not integrated. Refund handling is managed as an internal process, and receipt proof is shared through ticket/receipt email + PDF.
