-- Seat Locking Table for Temporary Seat Reservation
-- Prevents double booking during the seat selection process
-- Locks expire after 10 minutes of inactivity

IF OBJECT_ID('seat_locks', 'U') IS NULL
CREATE TABLE seat_locks (
    lock_id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES bus_schedules(schedule_id) ON DELETE CASCADE,
    journey_date DATE NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL, -- Browser session identifier
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate locks on same seat
    UNIQUE(schedule_id, journey_date, seat_number)
);
-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_seat_locks_schedule_date 
ON seat_locks(schedule_id, journey_date);

CREATE INDEX IF NOT EXISTS idx_seat_locks_expires 
ON seat_locks(expires_at);

CREATE INDEX IF NOT EXISTS idx_seat_locks_session 
ON seat_locks(session_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_seat_locks_schedule_date')
CREATE INDEX idx_seat_locks_schedule_date 
ON seat_locks(schedule_id, journey_date);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_seat_locks_expires')
CREATE INDEX idx_seat_locks_expires 
ON seat_locks(expires_at);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_seat_locks_session')
CREATE INDEX idx_seat_locks_session 
ON seat_locks(session_id);
ON seat_locks(session_id);

-- Function to automatically clean expired locks
CREATE OR REPLACE FUNCTION clean_expired_seat_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM seat_locks WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE seat_locks IS 'Temporary seat locks during booking process (10 minute expiry)';
COMMENT ON COLUMN seat_locks.session_id IS 'Browser session ID to identify lock owner';
COMMENT ON COLUMN seat_locks.expires_at IS 'Automatic expiry timestamp (10 minutes from lock)';
