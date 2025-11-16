# Ticket Nepal Database Setup Guide

Complete step-by-step guide to set up the PostgreSQL database for Ticket Nepal.

## Prerequisites

1. **PostgreSQL 12 or higher** installed on your system
2. **psql** command-line tool (comes with PostgreSQL)
3. Administrative access to PostgreSQL

## Installation Steps

### Step 1: Check PostgreSQL Installation

```bash
# Check if PostgreSQL is installed
psql --version

# Check if PostgreSQL is running
pg_isready
```

### Step 2: Access PostgreSQL

```bash
# On macOS (using Homebrew installation)
psql postgres

# OR on Linux/Ubuntu
sudo -u postgres psql

# OR with specific user
psql -U postgres
```

### Step 3: Create Database and Tables

**Option A: Using psql command line**

```bash
# Navigate to the database folder
cd /Users/biraj/Ticket_Nepal/database

# Run the schema file
psql -U postgres -f schema.sql
```

**Option B: From inside psql**

```sql
-- First, connect to PostgreSQL
psql -U postgres

-- Then run the file
\i /Users/biraj/Ticket_Nepal/database/schema.sql

-- Or copy-paste the entire schema.sql content
```

**Option C: Step by step (recommended for learning)**

```bash
# 1. Connect to PostgreSQL
psql -U postgres

# 2. Create the database
CREATE DATABASE ticket_nepal;

# 3. Connect to the new database
\c ticket_nepal

# 4. Run the schema file
\i /Users/biraj/Ticket_Nepal/database/schema.sql
```

### Step 4: Verify Database Creation

```sql
-- Connect to the database
\c ticket_nepal

-- List all tables
\dt

-- You should see 14 tables:
-- - users
-- - vendors
-- - vendor_documents
-- - buses
-- - routes
-- - bus_schedules
-- - bookings
-- - payments
-- - tickets
-- - refunds
-- - reviews
-- - notifications
-- - system_settings
-- - audit_logs

-- Check table structure
\d users

-- View all data in a table
SELECT * FROM users;

-- Check created views
\dv

-- You should see:
-- - active_schedules
-- - booking_details
-- - vendor_analytics
```

### Step 5: Update Backend Configuration

Update your backend `.env` file with the database credentials:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticket_nepal
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

## Database Structure Overview

### Core Tables

1. **users** - User accounts (customers, vendors, admins)
2. **vendors** - Bus company information
3. **buses** - Bus fleet details
4. **routes** - Available routes (Kathmandu-Pokhara, etc.)
5. **bus_schedules** - Daily schedules for buses
6. **bookings** - Ticket bookings
7. **payments** - Payment transactions
8. **tickets** - Generated tickets with QR codes

### Supporting Tables

9. **vendor_documents** - Verification documents
10. **refunds** - Cancellation and refund records
11. **reviews** - Customer reviews and ratings
12. **notifications** - User notifications
13. **system_settings** - Application configuration
14. **audit_logs** - System activity tracking

### Views (For Easy Data Access)

- **active_schedules** - All active bus schedules with full details
- **booking_details** - Complete booking information
- **vendor_analytics** - Vendor performance metrics

## Default Data

The schema includes sample data:

- **Admin User**
  - Email: `admin@ticketnepal.com`
  - Password: `admin123` (hashed)
  - Role: `system_admin`

- **Sample Routes**
  - Kathmandu → Pokhara (200 km, Rs. 1200)
  - Kathmandu → Chitwan (150 km, Rs. 1000)
  - Pokhara → Chitwan (120 km, Rs. 800)
  - Kathmandu → Biratnagar (400 km, Rs. 1800)
  - Kathmandu → Butwal (265 km, Rs. 1300)

- **System Settings**
  - Cancellation policy
  - Payment timeout
  - Booking limits

## Common PostgreSQL Commands

```sql
-- Connect to database
\c ticket_nepal

-- List all tables
\dt

-- Describe table structure
\d table_name

-- List all databases
\l

-- List all users
\du

-- Exit psql
\q

-- Show current database
SELECT current_database();

-- Show all tables with row counts
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

## Testing the Database

```sql
-- 1. Check if admin user exists
SELECT * FROM users WHERE role = 'system_admin';

-- 2. View all routes
SELECT * FROM routes;

-- 3. Check system settings
SELECT * FROM system_settings;

-- 4. Test the active_schedules view (will be empty initially)
SELECT * FROM active_schedules;
```

## Adding Sample Vendor & Bus Data

```sql
-- 1. Create a vendor user
INSERT INTO users (name, email, phone, password_hash, role, is_active) 
VALUES ('ABC Travels', 'abc@travels.com', '9801234567', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'vendor', true)
RETURNING user_id;

-- 2. Create vendor details (use the user_id from step 1)
INSERT INTO vendors (user_id, company_name, registration_number, address, city, is_verified, average_rating)
VALUES (2, 'ABC Travels Pvt Ltd', 'REG-ABC-001', 'Kalanki, Kathmandu', 'Kathmandu', true, 4.5)
RETURNING vendor_id;

-- 3. Add a bus (use vendor_id from step 2)
INSERT INTO buses (vendor_id, bus_number, bus_type, total_seats, available_seats, amenities, is_active)
VALUES (1, 'BA 2 KHA 1234', 'Deluxe', 40, 40, ARRAY['WiFi', 'AC', 'Charging Port'], true)
RETURNING bus_id;

-- 4. Create a schedule (use bus_id from step 3 and route_id from routes table)
INSERT INTO bus_schedules (bus_id, route_id, departure_time, arrival_time, price, is_active)
VALUES (1, 1, '07:00:00', '13:00:00', 1200, true);

-- 5. Verify the schedule appears in active_schedules view
SELECT * FROM active_schedules;
```

## Troubleshooting

### Issue: Database already exists
```sql
-- Drop and recreate
DROP DATABASE ticket_nepal;
CREATE DATABASE ticket_nepal;
```

### Issue: Permission denied
```bash
# Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE ticket_nepal TO postgres;
```

### Issue: Connection refused
```bash
# Check if PostgreSQL is running
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux

# Check connection
psql -U postgres -h localhost
```

### Issue: Cannot find psql
```bash
# macOS: Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Ubuntu: Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
```

## Backup & Restore

```bash
# Backup database
pg_dump -U postgres ticket_nepal > ticket_nepal_backup.sql

# Restore database
psql -U postgres ticket_nepal < ticket_nepal_backup.sql

# Backup with custom format (compressed)
pg_dump -U postgres -Fc ticket_nepal > ticket_nepal_backup.dump

# Restore from custom format
pg_restore -U postgres -d ticket_nepal ticket_nepal_backup.dump
```

## Next Steps

After database setup:

1. ✅ Update backend `.env` with database credentials
2. ✅ Start the FastAPI backend: `cd backend && python main.py`
3. ✅ Test API endpoints: `http://localhost:8000/docs`
4. ✅ Start frontend: `npm run dev --prefix bus-ticketing-frontend`
5. ✅ Register test users and create sample bookings

## Need Help?

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- pgAdmin (GUI tool): https://www.pgadmin.org/
- DBeaver (Universal DB tool): https://dbeaver.io/

---

**Note:** Make sure to change default passwords and secure your database in production!
