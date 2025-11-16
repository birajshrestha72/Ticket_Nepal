-- ============================================================================
-- TICKET NEPAL - SEED DATA
-- Dummy/Sample data for testing and development
-- Run this AFTER running setup.sql
-- ============================================================================

-- Note: Ensure you are connected to the 'ticket_nepal' database before running this script
-- If using psql: psql -U your_user -d ticket_nepal -f seed.sql

-- ============================================================================
-- SEED DATA: USERS (1 Super Admin + 3 Vendors + 5 Customers)
-- Password: "password123" (bcrypt hashed)
-- ============================================================================

INSERT INTO users (name, email, phone, password_hash, role, auth_provider, is_active, email_verified) VALUES
-- Super Admin
('Super Admin', 'superadmin@ticketnepal.com', '9801111111', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'system_admin', 'email', true, true),

-- Vendor Accounts
('Ram Bahadur Thapa', 'ram@abctravels.com', '9801234567', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'vendor', 'email', true, true),
('Sita Sharma', 'sita@xyzbuses.com', '9801234568', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'vendor', 'email', true, true),
('Krishna Prasad Ghimire', 'krishna@nepalyatayat.com', '9801234569', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'vendor', 'email', true, true),

-- Customer Accounts
('Bikash Adhikari', 'bikash@gmail.com', '9851111111', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'customer', 'email', true, true),
('Anjali Tamang', 'anjali@gmail.com', '9851111112', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'customer', 'email', true, true),
('Prakash Shrestha', 'prakash@gmail.com', '9851111113', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'customer', 'email', true, true),
('Sunita Rai', 'sunita@gmail.com', '9851111114', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'customer', 'email', true, true),
('Rajesh Karki', 'rajesh@gmail.com', '9851111115', '$2a$10$X8qJ5vZ9xKQe.HJwx4WmYeKpVU0b8JZlZ9YqC6WnZJY9xKQe.HJwx', 'customer', 'email', true, true);

-- ============================================================================
-- SEED DATA: VENDORS (3 Bus Companies)
-- ============================================================================

INSERT INTO vendors (user_id, company_name, registration_number, pan_number, address, city, province, contact_person, contact_phone, contact_email, is_verified, verification_date, average_rating, total_reviews) VALUES
(2, 'ABC Travels Pvt. Ltd.', 'REG-ABC-2023-001', '123456789', 'Kalanki, Kathmandu', 'Kathmandu', 'Bagmati', 'Ram Bahadur Thapa', '9801234567', 'ram@abctravels.com', true, '2024-01-15 10:30:00', 4.5, 150),
(3, 'XYZ Bus Service', 'REG-XYZ-2023-002', '987654321', 'Prithvi Chowk, Pokhara', 'Pokhara', 'Gandaki', 'Sita Sharma', '9801234568', 'sita@xyzbuses.com', true, '2024-02-20 14:45:00', 4.2, 98),
(4, 'Nepal Yatayat Sewa', 'REG-NYS-2022-003', '456789123', 'Pulchowk, Lalitpur', 'Lalitpur', 'Bagmati', 'Krishna Prasad Ghimire', '9801234569', 'krishna@nepalyatayat.com', true, '2023-12-10 09:00:00', 4.7, 220);

-- ============================================================================
-- SEED DATA: VENDOR DOCUMENTS (8 Documents)
-- ============================================================================

INSERT INTO vendor_documents (vendor_id, document_type, document_url, document_number, issue_date, expiry_date, is_verified, verified_by, verified_at) VALUES
(1, 'license', 'https://storage.ticketnepal.com/docs/abc_license.pdf', 'LIC-2023-ABC-001', '2023-01-15', '2028-01-14', true, 1, '2024-01-16 11:00:00'),
(1, 'registration', 'https://storage.ticketnepal.com/docs/abc_reg.pdf', 'REG-ABC-2023-001', '2023-01-10', NULL, true, 1, '2024-01-16 11:00:00'),
(1, 'insurance', 'https://storage.ticketnepal.com/docs/abc_insurance.pdf', 'INS-ABC-2024-001', '2024-01-01', '2025-12-31', true, 1, '2024-01-16 11:00:00'),
(2, 'license', 'https://storage.ticketnepal.com/docs/xyz_license.pdf', 'LIC-2023-XYZ-002', '2023-02-20', '2028-02-19', true, 1, '2024-02-21 10:30:00'),
(2, 'registration', 'https://storage.ticketnepal.com/docs/xyz_reg.pdf', 'REG-XYZ-2023-002', '2023-02-15', NULL, true, 1, '2024-02-21 10:30:00'),
(3, 'license', 'https://storage.ticketnepal.com/docs/nys_license.pdf', 'LIC-2022-NYS-003', '2022-12-10', '2027-12-09', true, 1, '2023-12-11 09:30:00'),
(3, 'registration', 'https://storage.ticketnepal.com/docs/nys_reg.pdf', 'REG-NYS-2022-003', '2022-12-05', NULL, true, 1, '2023-12-11 09:30:00'),
(3, 'pan', 'https://storage.ticketnepal.com/docs/nys_pan.pdf', '456789123', '2022-12-01', NULL, true, 1, '2023-12-11 09:30:00');

-- ============================================================================
-- SEED DATA: ROUTES (10 Popular Routes)
-- ============================================================================

INSERT INTO routes (origin, destination, distance_km, estimated_duration_minutes, base_price, is_active) VALUES
('Kathmandu', 'Pokhara', 200, 360, 1200, true),
('Kathmandu', 'Chitwan', 150, 300, 1000, true),
('Kathmandu', 'Biratnagar', 400, 720, 1800, true),
('Kathmandu', 'Butwal', 265, 480, 1300, true),
('Kathmandu', 'Dharan', 380, 690, 1700, true),
('Pokhara', 'Chitwan', 120, 240, 800, true),
('Pokhara', 'Butwal', 125, 240, 850, true),
('Butwal', 'Chitwan', 80, 150, 600, true),
('Kathmandu', 'Bhairahawa', 275, 510, 1350, true),
('Kathmandu', 'Hetauda', 135, 270, 900, true);

-- ============================================================================
-- SEED DATA: BUSES (8 Buses)
-- ============================================================================

INSERT INTO buses (vendor_id, bus_number, bus_type, total_seats, available_seats, amenities, registration_year, insurance_expiry, is_active) VALUES
(1, 'BA 2 KHA 1234', 'Deluxe', 40, 40, ARRAY['AC', 'Charging Port'], 2022, '2025-12-31', true),
(1, 'BA 2 KHA 5678', 'AC', 45, 45, ARRAY['AC', 'Charging Port'], 2021, '2025-06-30', true),
(1, 'BA 3 KHA 9101', 'Semi-Deluxe', 50, 50, ARRAY['Charging Port', 'Music System'], 2020, '2025-03-31', true),
(2, 'GA 1 CHA 2345', 'AC', 42, 42, ARRAY['AC', 'WiFi', 'TV'], 2023, '2026-01-15', true),
(2, 'GA 1 CHA 6789', 'Sleeper', 32, 32, ARRAY['AC', 'WiFi', 'Blanket', 'Pillow'], 2022, '2025-11-30', true),
(2, 'GA 2 JHA 1234', 'Seater', 48, 48, ARRAY['Music System'], 2021, '2025-08-31', true),
(3, 'BA 1 PA 4567', 'Deluxe', 40, 40, ARRAY['WiFi', 'AC', 'Charging Port', 'TV', 'Restroom'], 2023, '2026-03-31', true),
(3, 'BA 1 PA 8910', 'AC', 44, 44, ARRAY['AC', 'Charging Port', 'TV'], 2022, '2025-09-30', true);

-- ============================================================================
-- SEED DATA: BUS SCHEDULES (10 Schedules)
-- ============================================================================

INSERT INTO bus_schedules (bus_id, route_id, departure_time, arrival_time, operating_days, price, is_active) VALUES
(1, 1, '07:00:00', '13:00:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 1200, true),
(2, 2, '08:30:00', '13:30:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 1000, true),
(3, 4, '06:00:00', '14:00:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 1300, true),
(4, 1, '09:00:00', '15:00:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 1250, true),
(5, 3, '19:00:00', '07:00:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 1900, true),
(6, 6, '10:00:00', '14:00:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 800, true),
(7, 1, '15:00:00', '21:00:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 1300, true),
(8, 2, '07:30:00', '12:30:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 1050, true),
(7, 5, '20:00:00', '08:30:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 1800, true),
(8, 9, '08:00:00', '16:30:00', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], 1350, true);

-- ============================================================================
-- SEED DATA: BOOKINGS (10 Bookings)
-- ============================================================================

INSERT INTO bookings (user_id, schedule_id, booking_reference, journey_date, number_of_seats, seat_numbers, total_amount, booking_status, passenger_name, passenger_phone, passenger_email, pickup_point, drop_point, special_requests) VALUES
(5, 1, 'TN20251115000001', '2025-11-20', 2, ARRAY['A1', 'A2'], 2400, 'confirmed', 'Bikash Adhikari', '9851111111', 'bikash@gmail.com', 'Kalanki', 'Lakeside Pokhara', 'Window seat preferred'),
(6, 2, 'TN20251115000002', '2025-11-21', 1, ARRAY['B5'], 1000, 'confirmed', 'Anjali Tamang', '9851111112', 'anjali@gmail.com', 'New Bus Park', 'Sauraha', NULL),
(7, 4, 'TN20251115000003', '2025-11-22', 3, ARRAY['C1', 'C2', 'C3'], 3750, 'confirmed', 'Prakash Shrestha', '9851111113', 'prakash@gmail.com', 'Koteshwor', 'Lakeside', 'Family trip'),
(8, 7, 'TN20251115000004', '2025-11-23', 2, ARRAY['D4', 'D5'], 2600, 'pending', 'Sunita Rai', '9851111114', 'sunita@gmail.com', 'Balaju', 'Pokhara', NULL),
(9, 8, 'TN20251114000005', '2025-11-19', 1, ARRAY['E8'], 1050, 'completed', 'Rajesh Karki', '9851111115', 'rajesh@gmail.com', 'Gongabu', 'Chitwan', NULL),
(5, 5, 'TN20251114000006', '2025-11-25', 2, ARRAY['F1', 'F2'], 3800, 'confirmed', 'Bikash Adhikari', '9851111111', 'bikash@gmail.com', 'Kalanki', 'Biratnagar', 'Late night travel'),
(6, 9, 'TN20251113000007', '2025-11-18', 1, ARRAY['G3'], 1800, 'completed', 'Anjali Tamang', '9851111112', 'anjali@gmail.com', 'Gongabu', 'Dharan', NULL),
(7, 3, 'TN20251112000008', '2025-11-17', 2, ARRAY['H1', 'H2'], 2600, 'completed', 'Prakash Shrestha', '9851111113', 'prakash@gmail.com', 'Kalanki', 'Butwal', NULL),
(8, 6, 'TN20251116000009', '2025-11-24', 1, ARRAY['A10'], 800, 'confirmed', 'Sunita Rai', '9851111114', 'sunita@gmail.com', 'Pokhara', 'Chitwan', NULL),
(9, 10, 'TN20251116000010', '2025-11-26', 2, ARRAY['B3', 'B4'], 2700, 'pending', 'Rajesh Karki', '9851111115', 'rajesh@gmail.com', 'Ratnapark', 'Bhairahawa', NULL);

-- ============================================================================
-- SEED DATA: PAYMENTS (10 Payments)
-- ============================================================================

INSERT INTO payments (booking_id, transaction_id, payment_method, amount, payment_status, payment_gateway_response, paid_at) VALUES
(1, 'ESEWA-2025111500001', 'esewa', 2400, 'success', '{"status": "success", "ref_id": "0012ABC"}', '2025-11-15 10:30:00'),
(2, 'KHALTI-2025111500002', 'khalti', 1000, 'success', '{"status": "success", "ref_id": "KTM123"}', '2025-11-15 11:45:00'),
(3, 'ESEWA-2025111500003', 'esewa', 3750, 'success', '{"status": "success", "ref_id": "0013DEF"}', '2025-11-15 14:20:00'),
(4, 'PENDING-2025111500004', 'esewa', 2600, 'pending', NULL, NULL),
(5, 'KHALTI-2025111400005', 'khalti', 1050, 'success', '{"status": "success", "ref_id": "KTM456"}', '2025-11-14 09:15:00'),
(6, 'ESEWA-2025111400006', 'esewa', 3800, 'success', '{"status": "success", "ref_id": "0014GHI"}', '2025-11-14 16:30:00'),
(7, 'BANK-2025111300007', 'bank_transfer', 1800, 'success', '{"status": "success", "ref_id": "BNK789"}', '2025-11-13 10:00:00'),
(8, 'KHALTI-2025111200008', 'khalti', 2600, 'success', '{"status": "success", "ref_id": "KTM789"}', '2025-11-12 13:45:00'),
(9, 'ESEWA-2025111600009', 'esewa', 800, 'success', '{"status": "success", "ref_id": "0015JKL"}', '2025-11-16 08:20:00'),
(10, 'PENDING-2025111600010', 'khalti', 2700, 'pending', NULL, NULL);

-- ============================================================================
-- SEED DATA: TICKETS (8 Tickets)
-- ============================================================================

INSERT INTO tickets (booking_id, ticket_number, qr_code_url, is_used, used_at, issued_at) VALUES
(1, 'TKT2025111500000001', 'https://storage.ticketnepal.com/qr/TKT2025111500000001.png', false, NULL, '2025-11-15 10:31:00'),
(2, 'TKT2025111500000002', 'https://storage.ticketnepal.com/qr/TKT2025111500000002.png', false, NULL, '2025-11-15 11:46:00'),
(3, 'TKT2025111500000003', 'https://storage.ticketnepal.com/qr/TKT2025111500000003.png', false, NULL, '2025-11-15 14:21:00'),
(5, 'TKT2025111400000005', 'https://storage.ticketnepal.com/qr/TKT2025111400000005.png', true, '2025-11-19 07:30:00', '2025-11-14 09:16:00'),
(6, 'TKT2025111400000006', 'https://storage.ticketnepal.com/qr/TKT2025111400000006.png', false, NULL, '2025-11-14 16:31:00'),
(7, 'TKT2025111300000007', 'https://storage.ticketnepal.com/qr/TKT2025111300000007.png', true, '2025-11-18 20:00:00', '2025-11-13 10:01:00'),
(8, 'TKT2025111200000008', 'https://storage.ticketnepal.com/qr/TKT2025111200000008.png', true, '2025-11-17 06:00:00', '2025-11-12 13:46:00'),
(9, 'TKT2025111600000009', 'https://storage.ticketnepal.com/qr/TKT2025111600000009.png', false, NULL, '2025-11-16 08:21:00');

-- ============================================================================
-- SEED DATA: REFUNDS (2 Refunds)
-- ============================================================================

INSERT INTO refunds (booking_id, payment_id, refund_amount, refund_reason, refund_status, cancellation_charges, refund_method, refund_transaction_id, processed_by, requested_at, processed_at) VALUES
(4, 4, 2340, 'Changed travel plans', 'approved', 260, 'esewa', 'RFND-ESEWA-001', 1, '2025-11-16 09:00:00', '2025-11-16 10:30:00'),
(10, 10, 2430, 'Medical emergency', 'processed', 270, 'khalti', 'RFND-KHALTI-002', 1, '2025-11-16 11:00:00', '2025-11-16 12:00:00');

-- ============================================================================
-- SEED DATA: REVIEWS (8 Reviews)
-- ============================================================================

INSERT INTO reviews (booking_id, user_id, vendor_id, bus_id, rating, review_text, is_verified_purchase, is_approved, approved_by) VALUES
(5, 9, 3, 8, 5, 'Excellent service! Bus was clean and on time. Highly recommended.', true, true, 1),
(7, 6, 2, 5, 4, 'Good experience overall. Driver was professional. Comfortable journey.', true, true, 1),
(8, 7, 1, 3, 4, 'Nice service. Could improve AC cooling. Otherwise satisfied.', true, true, 1),
(1, 5, 1, 1, 5, 'Amazing journey! Very comfortable seats and punctual departure. Will book again.', true, true, 1),
(2, 6, 1, 2, 4, 'Good value for money. Bus condition was good. Staff was helpful.', true, true, 1),
(3, 7, 2, 4, 5, 'Perfect! WiFi worked great. Very smooth ride. Impressed with the service.', true, true, 1),
(6, 5, 2, 5, 3, 'Average experience. Departure delayed by 30 minutes. Bus was okay.', true, true, 1),
(9, 8, 3, 7, 5, 'Best bus service I have used in Nepal! Clean, comfortable, and timely.', true, true, 1);

-- ============================================================================
-- SEED DATA: NOTIFICATIONS (10 Notifications)
-- ============================================================================

INSERT INTO notifications (user_id, title, message, notification_type, is_read, related_booking_id) VALUES
(5, 'Booking Confirmed', 'Your booking TN20251115000001 for Kathmandu to Pokhara has been confirmed.', 'booking', true, 1),
(5, 'Payment Successful', 'Payment of Rs. 2400 received successfully via eSewa.', 'payment', true, 1),
(6, 'Booking Confirmed', 'Your booking TN20251115000002 for Kathmandu to Chitwan has been confirmed.', 'booking', true, 2),
(7, 'Booking Confirmed', 'Your booking TN20251115000003 for Kathmandu to Pokhara has been confirmed.', 'booking', false, 3),
(8, 'Booking Pending', 'Please complete payment for booking TN20251115000004 within 15 minutes.', 'booking', false, 4),
(9, 'Journey Completed', 'Thank you for traveling with us! Please rate your experience.', 'booking', true, 5),
(5, 'Special Offer', 'Get 20% off on bookings for Kathmandu-Pokhara route this weekend!', 'promotion', false, NULL),
(6, 'Journey Reminder', 'Your journey is tomorrow at 08:30 AM. Have a safe trip!', 'booking', false, 2),
(8, 'Refund Approved', 'Your refund of Rs. 2340 has been approved and will be processed within 3-5 days.', 'cancellation', true, 4),
(9, 'Refund Processed', 'Your refund of Rs. 2430 has been processed to your Khalti wallet.', 'cancellation', false, 10);

-- ============================================================================
-- SEED DATA: SYSTEM SETTINGS (10 Settings)
-- ============================================================================

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by) VALUES
('booking_cancellation_hours', '24', 'number', 'Hours before journey for free cancellation', 1),
('cancellation_charge_percentage', '10', 'number', 'Cancellation charge percentage of total amount', 1),
('max_seats_per_booking', '10', 'number', 'Maximum seats allowed per booking', 1),
('payment_timeout_minutes', '15', 'number', 'Payment completion timeout in minutes', 1),
('min_advance_booking_hours', '2', 'number', 'Minimum hours before journey to allow booking', 1),
('service_charge_percentage', '2', 'number', 'Service charge percentage on bookings', 1),
('refund_processing_days', '5', 'number', 'Number of days to process refunds', 1),
('vendor_commission_percentage', '15', 'number', 'Commission percentage charged from vendors', 1),
('email_notification_enabled', 'true', 'boolean', 'Enable email notifications', 1),
('sms_notification_enabled', 'true', 'boolean', 'Enable SMS notifications', 1);

-- ============================================================================
-- SEED DATA: AUDIT LOGS (10 Logs)
-- ============================================================================

INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) VALUES
(1, 'CREATE', 'vendors', 1, NULL, '{"company_name": "ABC Travels Pvt. Ltd.", "is_verified": true}', '192.168.1.10', 'Mozilla/5.0'),
(1, 'UPDATE', 'vendors', 1, '{"is_verified": false}', '{"is_verified": true}', '192.168.1.10', 'Mozilla/5.0'),
(2, 'CREATE', 'buses', 1, NULL, '{"bus_number": "BA 2 KHA 1234", "bus_type": "Deluxe"}', '192.168.1.15', 'Mozilla/5.0'),
(5, 'CREATE', 'bookings', 1, NULL, '{"booking_reference": "TN20251115000001", "status": "pending"}', '103.69.124.50', 'Mozilla/5.0 (iPhone)'),
(5, 'UPDATE', 'bookings', 1, '{"booking_status": "pending"}', '{"booking_status": "confirmed"}', '103.69.124.50', 'Mozilla/5.0 (iPhone)'),
(6, 'CREATE', 'bookings', 2, NULL, '{"booking_reference": "TN20251115000002", "status": "pending"}', '103.69.124.51', 'Mozilla/5.0 (Android)'),
(1, 'UPDATE', 'refunds', 1, '{"refund_status": "pending"}', '{"refund_status": "approved"}', '192.168.1.10', 'Mozilla/5.0'),
(1, 'APPROVE', 'reviews', 1, '{"is_approved": false}', '{"is_approved": true}', '192.168.1.10', 'Mozilla/5.0'),
(7, 'CREATE', 'bookings', 3, NULL, '{"booking_reference": "TN20251115000003", "number_of_seats": 3}', '103.69.124.52', 'Mozilla/5.0'),
(1, 'UPDATE', 'system_settings', 1, '{"setting_value": "12"}', '{"setting_value": "24"}', '192.168.1.10', 'Mozilla/5.0');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Display summary
SELECT 'SEED DATA SUMMARY:' as info;

SELECT 'Table' as table_name, 'Count' as record_count
UNION ALL
SELECT 'Users', COUNT(*)::text FROM users
UNION ALL
SELECT 'Vendors', COUNT(*)::text FROM vendors
UNION ALL
SELECT 'Vendor Documents', COUNT(*)::text FROM vendor_documents
UNION ALL
SELECT 'Routes', COUNT(*)::text FROM routes
UNION ALL
SELECT 'Buses', COUNT(*)::text FROM buses
UNION ALL
SELECT 'Bus Schedules', COUNT(*)::text FROM bus_schedules
UNION ALL
SELECT 'Bookings', COUNT(*)::text FROM bookings
UNION ALL
SELECT 'Payments', COUNT(*)::text FROM payments
UNION ALL
SELECT 'Tickets', COUNT(*)::text FROM tickets
UNION ALL
SELECT 'Refunds', COUNT(*)::text FROM refunds
UNION ALL
SELECT 'Reviews', COUNT(*)::text FROM reviews
UNION ALL
SELECT 'Notifications', COUNT(*)::text FROM notifications
UNION ALL
SELECT 'System Settings', COUNT(*)::text FROM system_settings
UNION ALL
SELECT 'Audit Logs', COUNT(*)::text FROM audit_logs;

-- Show users by role
SELECT 'USERS BY ROLE:' as info;
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;

-- Show active schedules
SELECT 'ACTIVE SCHEDULES (Sample):' as info;
SELECT * FROM active_schedules LIMIT 5;

-- Show vendor analytics
SELECT 'VENDOR ANALYTICS:' as info;
SELECT * FROM vendor_analytics;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Seed data inserted successfully!' as status;
SELECT '9 users created (1 admin, 3 vendors, 5 customers)' as note1;
SELECT 'All test accounts use password: password123' as note2;
