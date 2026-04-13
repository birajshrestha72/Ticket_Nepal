import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import FooterNew from './components/FooterNew'
import HeaderNew from './components/HeaderNew'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboardView from './pages/admin/AdminDashboardView'
import VendorAnalyticsView from './pages/admin/VendorAnalyticsView'
import AdminProfileView from './pages/admin/AdminProfileView'
import ForgotPasswordView from './pages/auth/ForgotPasswordView'
import LoginView from './pages/auth/LoginView'
import SignupAdminView from './pages/auth/SignupAdminView'
import SignupView from './pages/auth/SignupView'
import VerifyEmailView from './pages/auth/VerifyEmailView'
import BookingPaymentView from './pages/booking/BookingPaymentView'
import BookingCallbackView from './pages/booking/BookingCallbackView'
import BookingRouteResultsView from './pages/booking/BookingRouteResultsView'
import BookingSeatSelectionView from './pages/booking/BookingSeatSelectionView'
import KhaltiSuccessView from './pages/booking/KhaltiSuccessView'
import PaymentFailureView from './pages/booking/PaymentFailureView'
import PaymentPage from './pages/payment-demo/PaymentPage'
import KhaltiSuccess from './pages/payment-demo/KhaltiSuccess'
import EsewaSuccess from './pages/payment-demo/EsewaSuccess'
import Failure from './pages/payment-demo/Failure'
import KhaltiQuickDemo from './pages/payment-demo/KhaltiQuickDemo'
import BusDetailsView from './pages/BusDetailsView'
import CommonPlaceholderView from './pages/user/CommonPlaceholderView'
import CustomerDashboardView from './pages/user/CustomerDashboardView'
import CustomerAnalyticsView from './pages/user/CustomerAnalyticsView'
import DestinationsView from './pages/DestinationsView'
import LandingView from './pages/LandingView'
import ProfileView from './pages/user/ProfileView'
import UserReviewView from './pages/user/userreview'
import VendorListView from './pages/VendorListView'
import SuperAdminDashboardView from './pages/supadmin/SuperAdminDashboardView'
import SystemAnalyticsView from './pages/supadmin/SystemAnalyticsView'

function App() {
  return (
    <div className="app-layout">
      <HeaderNew />
      <main className="main-content">
        <Routes>
          {/* Route mapping ho - yo le har URL lai right page samma pathauchha. */}
          <Route path="/" element={<LandingView />} />
          <Route path="/search" element={<BookingRouteResultsView />} />
          <Route path="/booking/search" element={<Navigate to="/search" replace />} />
          <Route path="/booking/results" element={<Navigate to="/search" replace />} />
          <Route
            path="/booking/seats"
            element={(
              <ProtectedRoute allowedRoles={['customer', 'vendor']}>
                <BookingSeatSelectionView />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/booking/payment"
            element={(
              <ProtectedRoute allowedRoles={['customer', 'vendor']}>
                <BookingPaymentView />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/booking/callback"
            element={(
              <ProtectedRoute allowedRoles={['customer', 'vendor']}>
                <BookingCallbackView />
              </ProtectedRoute>
            )}
          />
          <Route path="/khalti-success" element={<KhaltiSuccessView />} />
          <Route path="/failure" element={<PaymentFailureView />} />
          <Route path="/vendors" element={<VendorListView />} />
          <Route path="/bus-details" element={<BusDetailsView />} />
          <Route path="/destinations" element={<DestinationsView />} />
          <Route
            path="/bookings"
            element={(
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboardView initialTab="bookings" />
              </ProtectedRoute>
            )}
          />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/about" element={<CommonPlaceholderView title="About Us" />} />
          <Route path="/how-it-works" element={<CommonPlaceholderView title="How It Works" />} />
          <Route path="/terms" element={<CommonPlaceholderView title="Terms and Conditions" />} />
          <Route path="/privacy" element={<CommonPlaceholderView title="Privacy Policy" />} />
          <Route path="/refund-policy" element={<CommonPlaceholderView title="Refund Policy" />} />
          <Route path="/faq" element={<CommonPlaceholderView title="FAQ" />} />
          <Route path="/cookies" element={<CommonPlaceholderView title="Cookies" />} />
          <Route path="/sitemap" element={<CommonPlaceholderView title="Sitemap" />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/signup" element={<SignupView />} />
          <Route path="/signup-admin" element={<SignupAdminView />} />
          <Route path="/signup-vendor" element={<SignupAdminView />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          <Route path="/verify-email" element={<VerifyEmailView />} />
          <Route path="/demo/payment" element={<PaymentPage />} />
          <Route path="/demo/khalti-quick" element={<KhaltiQuickDemo />} />
          <Route path="/demo/payment/khalti-success" element={<KhaltiSuccess />} />
          <Route path="/demo/payment/esewa-success" element={<EsewaSuccess />} />
          <Route path="/demo/payment/failure" element={<Failure />} />

          <Route
            path="/user"
            element={(
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboardView />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/user/analytics"
            element={(
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerAnalyticsView />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/user/reviews"
            element={(
              <ProtectedRoute allowedRoles={['customer']}>
                <UserReviewView />
              </ProtectedRoute>
            )}
          />
          <Route path="/customer" element={<Navigate to="/user" replace />} />
          <Route
            path="/admin"
            element={(
              <ProtectedRoute allowedRoles={['vendor']}>
                <AdminDashboardView />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/analytics"
            element={(
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorAnalyticsView />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/profile"
            element={(
              <ProtectedRoute allowedRoles={['vendor']}>
                <AdminProfileView />
              </ProtectedRoute>
            )}
          />
          <Route path="/vendor" element={<Navigate to="/admin" replace />} />
          <Route path="/vendor/analytics" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="/vendor/profile" element={<Navigate to="/admin/profile" replace />} />
          <Route
            path="/supadmin"
            element={(
              <ProtectedRoute allowedRoles={['system_admin']}>
                <SuperAdminDashboardView />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/supadmin/analytics"
            element={(
              <ProtectedRoute allowedRoles={['system_admin']}>
                <SystemAnalyticsView />
              </ProtectedRoute>
            )}
          />
          <Route path="/superadmin" element={<Navigate to="/supadmin" replace />} />
          <Route path="/superadmin/analytics" element={<Navigate to="/supadmin/analytics" replace />} />
          <Route path="/customer/analytics" element={<Navigate to="/user/analytics" replace />} />

          <Route path="*" element={<CommonPlaceholderView title="Page Not Found" />} />
        </Routes>
      </main>
      <FooterNew />
    </div>
  )
}

export default App
