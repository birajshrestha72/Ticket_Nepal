-- ============================================================================
-- TICKET NEPAL DATABASE - COMPLETE SETUP
-- PostgreSQL 12+ Database Creation and Schema
-- Run this file first to set up the complete database structure
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE DATABASE
-- ============================================================================

-- Drop database if exists (CAUTION: This will delete all data!)
DROP DATABASE IF EXISTS ticket_nepal;

-- Create new database
CREATE DATABASE ticket_nepal
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Connect to the new database
\c ticket_nepal;

-- ============================================================================
-- STEP 2: ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 3: CREATE TABLES
-- ============================================================================

-- TABLE 1: USERS
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'vendor', 'system_admin')),
    auth_provider VARCHAR(20) DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'facebook')),
    firebase_uid VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- TABLE 2: VENDORS
CREATE TABLE vendors (
    vendor_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    pan_number VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(50),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(15),
    contact_email VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 3: VENDOR DOCUMENTS
CREATE TABLE vendor_documents (
    document_id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('license', 'registration', 'pan', 'tax_clearance', 'insurance', 'other')),
    document_url TEXT NOT NULL,
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by INTEGER REFERENCES users(user_id),
    verified_at TIMESTAMP,
    notes TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 4: BUSES
CREATE TABLE buses (
    bus_id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    bus_type VARCHAR(30) NOT NULL CHECK (bus_type IN ('AC', 'Non-AC', 'Deluxe', 'Semi-Deluxe', 'Sleeper', 'Seater')),
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
    amenities TEXT[],
    registration_year INTEGER,
    insurance_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 5: ROUTES
CREATE TABLE routes (
    route_id SERIAL PRIMARY KEY,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DECIMAL(6,2) NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(origin, destination)
);

-- TABLE 6: BUS SCHEDULES
CREATE TABLE bus_schedules (
    schedule_id SERIAL PRIMARY KEY,
    bus_id INTEGER REFERENCES buses(bus_id) ON DELETE CASCADE,
    route_id INTEGER REFERENCES routes(route_id) ON DELETE CASCADE,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    operating_days VARCHAR(50)[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 7: BOOKINGS
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    schedule_id INTEGER REFERENCES bus_schedules(schedule_id) ON DELETE RESTRICT,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    journey_date DATE NOT NULL,
    number_of_seats INTEGER NOT NULL CHECK (number_of_seats > 0),
    seat_numbers VARCHAR(10)[] NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(20) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded')),
    passenger_name VARCHAR(100) NOT NULL,
    passenger_phone VARCHAR(15) NOT NULL,
    passenger_email VARCHAR(255),
    pickup_point VARCHAR(200),
    drop_point VARCHAR(200),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 8: PAYMENTS
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) UNIQUE,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('esewa', 'khalti', 'bank_transfer', 'cash', 'card')),
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed', 'refunded')),
    payment_gateway_response TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 9: TICKETS
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE CASCADE,
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    qr_code_url TEXT,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 10: REFUNDS
CREATE TABLE refunds (
    refund_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE CASCADE,
    payment_id INTEGER REFERENCES payments(payment_id) ON DELETE CASCADE,
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_reason TEXT,
    refund_status VARCHAR(20) DEFAULT 'pending' CHECK (refund_status IN ('pending', 'approved', 'rejected', 'processed')),
    cancellation_charges DECIMAL(10,2) DEFAULT 0.0,
    refund_method VARCHAR(30),
    refund_transaction_id VARCHAR(100),
    processed_by INTEGER REFERENCES users(user_id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- TABLE 11: REVIEWS
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    bus_id INTEGER REFERENCES buses(bus_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    approved_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 12: NOTIFICATIONS
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) CHECK (notification_type IN ('booking', 'payment', 'cancellation', 'promotion', 'system')),
    is_read BOOLEAN DEFAULT false,
    related_booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 13: SYSTEM SETTINGS
CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 14: AUDIT LOGS
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Vendors indexes
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_verified ON vendors(is_verified);

-- Vendor documents indexes
CREATE INDEX idx_vendor_docs_vendor ON vendor_documents(vendor_id);

-- Buses indexes
CREATE INDEX idx_buses_vendor ON buses(vendor_id);
CREATE INDEX idx_buses_active ON buses(is_active);
CREATE INDEX idx_buses_number ON buses(bus_number);

-- Routes indexes
CREATE INDEX idx_routes_origin ON routes(origin);
CREATE INDEX idx_routes_destination ON routes(destination);
CREATE INDEX idx_routes_active ON routes(is_active);

-- Bus schedules indexes
CREATE INDEX idx_schedules_bus ON bus_schedules(bus_id);
CREATE INDEX idx_schedules_route ON bus_schedules(route_id);
CREATE INDEX idx_schedules_active ON bus_schedules(is_active);

-- Bookings indexes
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_schedule ON bookings(schedule_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_journey_date ON bookings(journey_date);
CREATE INDEX idx_bookings_status ON bookings(booking_status);

-- Payments indexes
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Tickets indexes
CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_tickets_number ON tickets(ticket_number);

-- Refunds indexes
CREATE INDEX idx_refunds_booking ON refunds(booking_id);
CREATE INDEX idx_refunds_status ON refunds(refund_status);

-- Reviews indexes
CREATE INDEX idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX idx_reviews_bus ON reviews(bus_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- STEP 5: CREATE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buses_updated_at BEFORE UPDATE ON buses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bus_schedules_updated_at BEFORE UPDATE ON bus_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_reference = 'TN' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || LPAD(NEW.booking_id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_booking_ref BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();

-- Function: Generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number = 'TKT' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || LPAD(NEW.ticket_id::TEXT, 8, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_ticket_num BEFORE INSERT ON tickets
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- ============================================================================
-- STEP 6: CREATE VIEWS
-- ============================================================================

-- View: Active schedules with full details
CREATE OR REPLACE VIEW active_schedules AS
SELECT 
    bs.schedule_id,
    bs.departure_time,
    bs.arrival_time,
    bs.price,
    bs.operating_days,
    b.bus_id,
    b.bus_number,
    b.bus_type,
    b.total_seats,
    b.amenities,
    r.route_id,
    r.origin,
    r.destination,
    r.distance_km,
    r.estimated_duration_minutes,
    v.vendor_id,
    v.company_name,
    v.average_rating
FROM bus_schedules bs
JOIN buses b ON bs.bus_id = b.bus_id
JOIN routes r ON bs.route_id = r.route_id
JOIN vendors v ON b.vendor_id = v.vendor_id
WHERE bs.is_active = true 
  AND b.is_active = true 
  AND r.is_active = true
  AND v.is_verified = true;

-- View: Booking details with payment status
CREATE OR REPLACE VIEW booking_details AS
SELECT 
    bk.booking_id,
    bk.booking_reference,
    bk.journey_date,
    bk.number_of_seats,
    bk.seat_numbers,
    bk.total_amount,
    bk.booking_status,
    bk.passenger_name,
    bk.passenger_phone,
    u.name as customer_name,
    u.email as customer_email,
    bs.departure_time,
    bs.arrival_time,
    b.bus_number,
    b.bus_type,
    r.origin,
    r.destination,
    v.company_name,
    p.payment_status,
    p.payment_method,
    bk.created_at
FROM bookings bk
LEFT JOIN users u ON bk.user_id = u.user_id
JOIN bus_schedules bs ON bk.schedule_id = bs.schedule_id
JOIN buses b ON bs.bus_id = b.bus_id
JOIN routes r ON bs.route_id = r.route_id
JOIN vendors v ON b.vendor_id = v.vendor_id
LEFT JOIN payments p ON bk.booking_id = p.booking_id;

-- View: Vendor analytics
CREATE OR REPLACE VIEW vendor_analytics AS
SELECT 
    v.vendor_id,
    v.company_name,
    v.average_rating,
    v.total_reviews,
    COUNT(DISTINCT b.bus_id) as total_buses,
    COUNT(DISTINCT bs.schedule_id) as total_schedules,
    COUNT(DISTINCT bk.booking_id) as total_bookings,
    COALESCE(SUM(bk.total_amount), 0) as total_revenue
FROM vendors v
LEFT JOIN buses b ON v.vendor_id = b.vendor_id
LEFT JOIN bus_schedules bs ON b.bus_id = bs.bus_id
LEFT JOIN bookings bk ON bs.schedule_id = bk.schedule_id 
    AND bk.booking_status IN ('confirmed', 'completed')
GROUP BY v.vendor_id, v.company_name, v.average_rating, v.total_reviews;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Verify setup
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT COUNT(*) as total_views FROM information_schema.views WHERE table_schema = 'public';

COMMIT;
