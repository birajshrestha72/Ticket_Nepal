-- Firebase Authentication Support - Database Schema Updates
-- Run this script to add columns needed for Firebase Google Sign-In
-- Database: ticket_nepal

-- Connect to database first:
-- psql -U postgres -d ticket_nepal

\echo '🔧 Adding Firebase Authentication Support...'

-- 1. Add Firebase UID column (unique identifier from Firebase)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS uid VARCHAR(255) UNIQUE;

\echo '✅ Added uid column'

-- 2. Add index on uid for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);

\echo '✅ Added uid index'

-- 3. Add email verification status
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

\echo '✅ Added email_verified column'

-- 4. Add last login timestamp
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

\echo '✅ Added last_login column'

-- 5. Add photo URL for Google profile pictures
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

\echo '✅ Added photo_url column'

-- 6. Make password optional (not required for OAuth users)
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

\echo '✅ Made password nullable (for OAuth users)'

-- 7. Add provider column to track sign-in method
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';

\echo '✅ Added auth_provider column'

-- 8. Verify changes
\echo ''
\echo '📊 Verifying schema updates...'
\d users

\echo ''
\echo '✅ Firebase Authentication schema updates complete!'
\echo ''
\echo 'New columns added:'
\echo '  - uid (VARCHAR 255, UNIQUE) - Firebase user ID'
\echo '  - email_verified (BOOLEAN) - Email verification status'
\echo '  - last_login (TIMESTAMP) - Last login timestamp'
\echo '  - photo_url (VARCHAR 500) - Profile picture URL'
\echo '  - auth_provider (VARCHAR 50) - Sign-in method (email/google)'
\echo ''
\echo '🎉 Database is ready for Firebase Google Sign-In!'
