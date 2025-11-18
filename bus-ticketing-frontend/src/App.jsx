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

// user
import Profile from './pages/user/Profile.jsx';
import MyBookings from './pages/user/MyBookings.jsx';
import BookingSuccess from './pages/user/BookingSuccess.jsx';

// customer
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';

// vendor
import VendorDashboard from './pages/vendor/VendorDashboard.jsx';
import VendorBuses from './pages/vendor/VendorBuses.jsx';

// admin
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

            {/* User protected routes - accessible by all authenticated users */}
            <Route
              path="/profile"
              element={<ProtectedRoute allowedRoles={["customer", "vendor", "system_admin"]}><Profile /></ProtectedRoute>}
            />
            <Route
              path="/bookings"
              element={<ProtectedRoute allowedRoles={["customer"]}><MyBookings /></ProtectedRoute>}
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

