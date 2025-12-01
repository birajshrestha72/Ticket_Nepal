import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/vendorBookings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const VendorBookings = () => {
  const navigate = useNavigate();

  // State
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    bus_id: '',
    date_from: '',
    date_to: '',
    search: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);

  // Create booking form state
  const [bookingStep, setBookingStep] = useState(1);
  const [createForm, setCreateForm] = useState({
    origin: '',
    destination: '',
    journey_date: '',
    schedule_id: '',
    passenger_name: '',
    passenger_phone: '',
    passenger_email: '',
    seat_numbers: [],
    pickup_point: '',
    total_amount: 0,
    payment_method: 'cash',
    payment_status: 'completed'
  });

  // Seat selection
  const [availableSeats, setAvailableSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    today: { count: 0, revenue: 0 },
    pending: 0,
    total: { count: 0, revenue: 0 }
  });

  // Fetch bookings from API
  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Build query params
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.bus_id) params.append('bus_id', filters.bus_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      params.append('limit', pagination.limit);
      params.append('offset', pagination.offset);

      const response = await fetch(`${API_URL}/bookings/vendor/all?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (data.status === 'success') {
        setBookings(data.data.bookings);
        setPagination(prev => ({ ...prev, total: data.data.total }));
        calculateStats(data.data.bookings);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch buses for filter dropdown
  const fetchBuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const endpoint = user.role === 'vendor' ? '/buses/vendor' : '/buses/all';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.status === 'success') {
        setBuses(data.data);
      }
    } catch (err) {
      console.error('Error fetching buses:', err);
    }
  };

  // Calculate stats from bookings
  const calculateStats = (bookingsList) => {
    const today = new Date().toISOString().split('T')[0];
    
    const todayBookings = bookingsList.filter(b => b.created_at?.split('T')[0] === today);
    const pendingCount = bookingsList.filter(b => b.status === 'pending').length;
    
    const todayRevenue = todayBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const totalRevenue = bookingsList.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

    setStats({
      today: {
        count: todayBookings.length,
        revenue: todayRevenue
      },
      pending: pendingCount,
      total: {
        count: bookingsList.length,
        revenue: totalRevenue
      }
    });
  };

  // Load data on mount and filter changes
  useEffect(() => {
    fetchBookings();
    fetchBuses();
  }, [filters, pagination.offset]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: '',
      bus_id: '',
      date_from: '',
      date_to: ''
    });
    setSearchTerm('');
  };

  // Handle booking details modal
  const viewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (bookings.length === 0) {
      alert('No bookings to export');
      return;
    }

    const headers = [
      'Booking Reference',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Bus Number',
      'Bus Type',
      'Route',
      'Journey Date',
      'Departure Time',
      'Seat Numbers',
      'Total Amount',
      'Payment Method',
      'Payment Status',
      'Status',
      'Booked At'
    ];

    const rows = filteredBookings.map(b => [
      b.booking_reference,
      b.customer?.name || 'N/A',
      b.customer?.email || 'N/A',
      b.customer?.phone || 'N/A',
      b.bus?.bus_number || 'N/A',
      b.bus?.bus_type || 'N/A',
      `${b.route?.origin || ''} → ${b.route?.destination || ''}`,
      b.journey_date,
      b.departure_time,
      b.seat_numbers?.join(', ') || 'N/A',
      b.total_amount,
      b.payment_method || 'N/A',
      b.payment_status || 'N/A',
      b.status,
      new Date(b.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter bookings by search term
  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      booking.booking_reference?.toLowerCase().includes(search) ||
      booking.customer?.name?.toLowerCase().includes(search) ||
      booking.customer?.email?.toLowerCase().includes(search) ||
      booking.customer?.phone?.includes(search) ||
      booking.bus?.bus_number?.toLowerCase().includes(search)
    );
  });

  // Pagination handlers
  const goToNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const goToPrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="vendor-bookings">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">🎫 Bookings Management</h1>
          <p className="page-subtitle">View and manage customer bookings</p>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={exportToCSV}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card today">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Today's Bookings</h3>
            <p className="stat-value">{stats.today.count}</p>
            <p className="stat-revenue">Rs. {stats.today.revenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">Rs. {stats.total.revenue.toLocaleString()}</p>
            <p className="stat-subtext">{stats.total.count} bookings</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p className="stat-value">{stats.pending}</p>
            <p className="stat-subtext">Awaiting confirmation</p>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Bookings</h3>
            <p className="stat-value">{pagination.total}</p>
            <p className="stat-subtext">All time</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by booking ref, customer, bus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Bus</label>
          <select
            className="filter-select"
            value={filters.bus_id}
            onChange={(e) => handleFilterChange('bus_id', e.target.value)}
          >
            <option value="">All Buses</option>
            {buses.map(bus => (
              <option key={bus.bus_id} value={bus.bus_id}>
                {bus.bus_number} - {bus.bus_type}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date From</label>
          <input
            type="date"
            className="filter-input"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Date To</label>
          <input
            type="date"
            className="filter-input"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>

        <button className="btn-reset-filters" onClick={resetFilters}>
          Reset
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bookings-container">
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎫</div>
            <h3>No Bookings Found</h3>
            <p>No bookings match your current filters</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking Ref</th>
                    <th>Customer</th>
                    <th>Bus</th>
                    <th>Route</th>
                    <th>Journey Date</th>
                    <th>Seats</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.booking_id}>
                      <td>
                        <span className="booking-ref">{booking.booking_reference}</span>
                      </td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{booking.customer?.name || 'N/A'}</div>
                          <div className="customer-contact">{booking.customer?.phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="bus-info">
                          <span className="bus-icon">🚌</span>
                          <div>
                            <div className="bus-number">{booking.bus?.bus_number || 'N/A'}</div>
                            <div className="bus-type">{booking.bus?.bus_type || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="route-info">
                          {booking.route?.origin || 'N/A'} → {booking.route?.destination || 'N/A'}
                        </div>
                        <div className="time-info">
                          🕐 {booking.departure_time} - {booking.arrival_time}
                        </div>
                      </td>
                      <td>
                        <span className="date-badge">{booking.journey_date}</span>
                      </td>
                      <td>
                        <span className="seats-badge">
                          {Array.isArray(booking.seat_numbers) 
                            ? booking.seat_numbers.join(', ') 
                            : booking.seat_numbers || 'N/A'}
                        </span>
                      </td>
                      <td className="amount-cell">
                        Rs. {parseFloat(booking.total_amount || 0).toLocaleString()}
                      </td>
                      <td>
                        <div className="payment-info">
                          <div className="payment-method">{booking.payment_method || 'N/A'}</div>
                          <span className={`payment-badge ${booking.payment_status}`}>
                            {booking.payment_status || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn-icon btn-view"
                            onClick={() => viewDetails(booking)}
                            title="View Details"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                className="btn-page"
                onClick={goToPrevPage}
                disabled={pagination.offset === 0}
              >
                ← Previous
              </button>
              <span className="page-info">
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <button
                className="btn-page"
                onClick={goToNextPage}
                disabled={pagination.offset + pagination.limit >= pagination.total}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="close-modal" onClick={() => setShowDetails(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>📋 Booking Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Booking Reference:</span>
                  <span className="detail-value">{selectedBooking.booking_reference}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${selectedBooking.status}`}>{selectedBooking.status}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Booked At:</span>
                  <span className="detail-value">{new Date(selectedBooking.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>👤 Customer Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedBooking.customer?.name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedBooking.customer?.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedBooking.customer?.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>🚌 Trip Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Bus:</span>
                  <span className="detail-value">
                    {selectedBooking.bus?.bus_number} ({selectedBooking.bus?.bus_type})
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Route:</span>
                  <span className="detail-value">
                    {selectedBooking.route?.origin} → {selectedBooking.route?.destination}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Journey Date:</span>
                  <span className="detail-value">{selectedBooking.journey_date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Departure Time:</span>
                  <span className="detail-value">{selectedBooking.departure_time}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Arrival Time:</span>
                  <span className="detail-value">{selectedBooking.arrival_time}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Seat Numbers:</span>
                  <span className="detail-value">
                    {Array.isArray(selectedBooking.seat_numbers)
                      ? selectedBooking.seat_numbers.join(', ')
                      : selectedBooking.seat_numbers || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>💰 Payment Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value amount-highlight">
                    Rs. {parseFloat(selectedBooking.total_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">{selectedBooking.payment_method || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Status:</span>
                  <span className={`payment-badge ${selectedBooking.payment_status}`}>
                    {selectedBooking.payment_status || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorBookings;
