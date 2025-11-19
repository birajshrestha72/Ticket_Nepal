import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';

// common pages
import Landing from './pages/common/Landing.jsx';
import Search from './pages/common/Search.jsx';
import BusDetails from './pages/common/BusDetails.jsx';
import VendorList from './pages/common/VendorList.jsx';
import Destinations from './pages/common/Destinations.jsx';
import NotFound from './pages/misc/NotFound.jsx';
import Forbidden from './pages/misc/Forbidden.jsx';

// auth
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import VendorSignup from './pages/auth/VendorSignup.jsx';

// customer (merged user folder into customer)
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import MyBookings from './pages/customer/MyBookings.jsx';
import BookingSuccess from './pages/customer/BookingSuccess.jsx';
import Booking from './pages/customer/Booking.jsx';
import BookingBill from './pages/customer/BookingBill.jsx';
import Payment from './pages/customer/Payment.jsx';
import ReviewNotification from './pages/customer/ReviewNotification.jsx';

// admin (merged vendor folder - handles both vendor and admin operations)
import VendorDashboard from './pages/admin/VendorDashboard.jsx';
import VendorBuses from './pages/admin/VendorBuses.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminBuses from './pages/admin/AdminBuses.jsx';

// superadmin
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard.jsx';

import './index.css';

const App = () => {
  return (
    <AuthProvider>
      <div className="app-root">
        <Header />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/search" element={<Search />} />
            <Route path="/bus-details" element={<BusDetails />} />
            <Route path="/buses/:id" element={<BusDetails />} />
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/destinations" element={<Destinations />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/vendor-signup" element={<VendorSignup />} />

            {/* Customer dashboard - role='customer' from database */}
            <Route
              path="/customer"
              element={<ProtectedRoute allowedRoles={["customer"]}><CustomerDashboard /></ProtectedRoute>}
            />

            {/* Customer booking flow - accessible by authenticated customers */}
            <Route
              path="/booking"
              element={<ProtectedRoute allowedRoles={["customer"]}><Booking /></ProtectedRoute>}
            />
            <Route
              path="/booking-bill"
              element={<ProtectedRoute allowedRoles={["customer"]}><BookingBill /></ProtectedRoute>}
            />
            <Route
              path="/payment"
              element={<ProtectedRoute allowedRoles={["customer"]}><Payment /></ProtectedRoute>}
            />
            <Route
              path="/booking-success"
              element={<ProtectedRoute allowedRoles={["customer"]}><BookingSuccess /></ProtectedRoute>}
            />

            {/* Customer bookings and reviews */}
            <Route
              path="/bookings"
              element={<ProtectedRoute allowedRoles={["customer"]}><MyBookings /></ProtectedRoute>}
            />
            <Route
              path="/review-notification"
              element={<ProtectedRoute allowedRoles={["customer"]}><ReviewNotification /></ProtectedRoute>}
            />

            {/* Vendor routes - role='vendor' from database */}
            <Route
              path="/vendor/*"
              element={<ProtectedRoute allowedRoles={["vendor"]}><VendorDashboard /></ProtectedRoute>}
            />
            <Route
              path="/vendor/buses"
              element={<ProtectedRoute allowedRoles={["vendor"]}><VendorBuses /></ProtectedRoute>}
            />

            {/* Admin routes - role='system_admin' from database */}
            <Route
              path="/admin/*"
              element={<ProtectedRoute allowedRoles={["system_admin"]}><AdminDashboard /></ProtectedRoute>}
            />
            <Route
              path="/admin/buses"
              element={<ProtectedRoute allowedRoles={["system_admin"]}><AdminBuses /></ProtectedRoute>}
            />

            {/* Superadmin - role='system_admin' from database */}
            <Route
              path="/superadmin/*"
              element={<ProtectedRoute allowedRoles={["system_admin"]}><SuperAdminDashboard /></ProtectedRoute>}
            />

            <Route path="/403" element={<Forbidden />} />
            <Route path="/404" element={<NotFound />} />

            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
};

export default App;

