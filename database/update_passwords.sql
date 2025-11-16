-- Update all user passwords to use Python-compatible bcrypt hash
-- Password for all users: "password123"
-- Hash generated with Python bcrypt (passlib CryptContext)

-- Hash: $2b$12$bNSzdlGKiMMjw36m02iFOOhkPMrTu3mRfXB.utVs658Z7qtc.2HrS

UPDATE users SET password_hash = '$2b$12$bNSzdlGKiMMjw36m02iFOOhkPMrTu3mRfXB.utVs658Z7qtc.2HrS';

-- Verify update
SELECT user_id, name, email, role, LEFT(password_hash, 20) as hash_prefix
FROM users
ORDER BY user_id;

