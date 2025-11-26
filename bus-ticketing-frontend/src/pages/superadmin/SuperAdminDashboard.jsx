import React, { useState, useEffect } from 'react';
import '../../css/superAdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const SuperAdminDashboard = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('vendors');
  
  // Statistics state
  const [stats, setStats] = useState({
    totalVendors: 0,
    totalBuses: 0,
    totalRoutes: 0,
    totalBookings: 0
  });

  // Data states
  const [vendors, setVendors] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchData();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/stats/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = '';
      
      switch (activeTab) {
        case 'vendors':
          url = `${API_URL}/vendors/`;
          break;
        case 'buses':
          url = `${API_URL}/buses/all-types`;
          break;
        case 'routes':
          url = `${API_URL}/routes/all`;
          break;
        case 'bookings':
          url = `${API_URL}/bookings/vendor/all`;
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        switch (activeTab) {
          case 'vendors':
            setVendors(data.data.vendors || []);
            break;
          case 'buses':
            // Extract buses from grouped data
            const busesArray = [];
            if (data.data.buses_by_type) {
              Object.values(data.data.buses_by_type).forEach(typeArray => {
                busesArray.push(...typeArray);
              });
            }
            // Remove duplicates based on busId
            const uniqueBuses = Array.from(
              new Map(busesArray.map(bus => [bus.id, bus])).values()
            );
            setBuses(uniqueBuses);
            break;
          case 'routes':
            setRoutes(data.data.routes || []);
            break;
          case 'bookings':
            setBookings(data.data.bookings || []);
            break;
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data. Please try again.');
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (activeTab === 'vendors') {
      alert('Note: Vendors must first create a user account with vendor role, then create their vendor profile. Direct vendor creation from admin panel requires additional backend API development.');
      return;
    }
    setModalMode('add');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      let url = '';
      let method = 'DELETE';
      
      switch (activeTab) {
        case 'vendors':
          url = `${API_URL}/vendors/${id}`;
          break;
        case 'buses':
          // Note: Buses don't have a delete endpoint yet - show alert
          alert('Bus deletion is not yet implemented in the backend API');
          return;
        case 'routes':
          url = `${API_URL}/routes/${id}`;
          break;
        case 'bookings':
          url = `${API_URL}/bookings/${id}/cancel`;
          method = 'POST';
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok || data.status === 'success') {
        alert(activeTab === 'bookings' ? 'Booking cancelled successfully' : 'Item deleted successfully');
        fetchData();
        fetchStats();
      } else {
        throw new Error(data.message || data.detail || 'Operation failed');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(`Failed: ${error.message}`);
    }
  };

  const handleVerifyVendor = async (vendorId, isVerified) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isVerified ? 'unverify' : 'verify';
      
      const response = await fetch(`${API_URL}/vendors/${vendorId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert(`Vendor ${isVerified ? 'unverified' : 'verified'} successfully`);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Failed to update vendor');
    }
  };

  // Filter data based on search and status
  const getFilteredData = () => {
    let data = [];
    switch (activeTab) {
      case 'vendors':
        data = vendors;
        break;
      case 'buses':
        data = buses;
        break;
      case 'routes':
        data = routes;
        break;
      case 'bookings':
        data = bookings;
        break;
    }

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return JSON.stringify(item).toLowerCase().includes(searchLower);
      });
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      if (activeTab === 'vendors') {
        data = data.filter(v => filterStatus === 'verified' ? v.isVerified : !v.isVerified);
      } else if (activeTab === 'bookings') {
        data = data.filter(b => b.bookingStatus === filterStatus);
      }
    }

    return data;
  };

  return (
    <div className="superadmin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🛡️ SuperAdmin Dashboard</h1>
          <p className="dashboard-subtitle">Platform-level management and control</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card-admin">
          <span className="stat-icon">🏢</span>
          <span className="stat-value">{stats.totalVendors}</span>
          <span className="stat-label">Total Vendors</span>
        </div>
        <div className="stat-card-admin">
          <span className="stat-icon">🚌</span>
          <span className="stat-value">{stats.totalBuses}</span>
          <span className="stat-label">Total Buses</span>
        </div>
        <div className="stat-card-admin">
          <span className="stat-icon">🗺️</span>
          <span className="stat-value">{stats.totalRoutes}</span>
          <span className="stat-label">Total Routes</span>
        </div>
        <div className="stat-card-admin">
          <span className="stat-icon">📋</span>
          <span className="stat-value">{stats.totalBookings}</span>
          <span className="stat-label">Total Bookings</span>
        </div>
      </div>

      {/* Management Tabs */}
      <div className="management-tabs">
        <button
          className={`tab-btn ${activeTab === 'vendors' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendors')}
        >
          🏢 Vendors
        </button>
        <button
          className={`tab-btn ${activeTab === 'buses' ? 'active' : ''}`}
          onClick={() => setActiveTab('buses')}
        >
          🚌 Buses
        </button>
        <button
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          🗺️ Routes
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Bookings
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Management Header */}
        <div className="management-header">
          <h2 className="management-title">
            {activeTab === 'vendors' && 'Vendor Management'}
            {activeTab === 'buses' && 'Bus Management'}
            {activeTab === 'routes' && 'Route Management'}
            {activeTab === 'bookings' && 'Booking Management'}
          </h2>

          <div className="search-filter-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {(activeTab === 'vendors' || activeTab === 'bookings') && (
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                {activeTab === 'vendors' && (
                  <>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </>
                )}
                {activeTab === 'bookings' && (
                  <>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
              </select>
            )}

            {(activeTab !== 'bookings' && activeTab !== 'buses') && (
              <button className="btn-add" onClick={handleAdd}>
                <span>+</span>
                Add {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
              </button>
            )}
            {activeTab === 'buses' && (
              <button className="btn-add" disabled style={{opacity: 0.5, cursor: 'not-allowed'}} title="Bus creation requires backend API">
                <span>+</span>
                Add Bus (Not Available)
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : getFilteredData().length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-message">No data found</div>
          </div>
        ) : (
          <>
            {activeTab === 'vendors' && <VendorsTable data={getFilteredData()} onEdit={handleEdit} onDelete={handleDelete} onVerify={handleVerifyVendor} />}
            {activeTab === 'buses' && <BusesTable data={getFilteredData()} onEdit={handleEdit} onDelete={handleDelete} />}
            {activeTab === 'routes' && <RoutesTable data={getFilteredData()} onEdit={handleEdit} onDelete={handleDelete} />}
            {activeTab === 'bookings' && <BookingsTable data={getFilteredData()} onDelete={handleDelete} />}
          </>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <FormModal
          mode={modalMode}
          type={activeTab}
          item={selectedItem}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchData();
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

// Vendors Table Component
const VendorsTable = ({ data, onEdit, onDelete, onVerify }) => (
  <div className="data-table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Company Name</th>
          <th>Contact</th>
          <th>Email</th>
          <th>Status</th>
          <th>Verified</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((vendor) => (
          <tr key={vendor.vendorId}>
            <td>{vendor.vendorId}</td>
            <td>{vendor.companyName}</td>
            <td>{vendor.contactNumber}</td>
            <td>{vendor.email}</td>
            <td>
              <span className={`badge ${vendor.isActive ? 'badge-active' : 'badge-inactive'}`}>
                {vendor.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <span className={`badge ${vendor.isVerified ? 'badge-verified' : 'badge-unverified'}`}>
                {vendor.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </td>
            <td>
              <div className="action-buttons">
                <button
                  className="btn-icon btn-verify"
                  onClick={() => onVerify(vendor.vendorId, vendor.isVerified)}
                  title={vendor.isVerified ? 'Unverify' : 'Verify'}
                >
                  {vendor.isVerified ? '✗' : '✓'}
                </button>
                <button className="btn-icon btn-edit" onClick={() => onEdit(vendor)}>Edit</button>
                <button className="btn-icon btn-delete" onClick={() => onDelete(vendor.vendorId)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Buses Table Component
const BusesTable = ({ data, onEdit, onDelete }) => (
  <div className="data-table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Bus Number</th>
          <th>Type</th>
          <th>Vendor</th>
          <th>Total Seats</th>
          <th>Route</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((bus) => (
          <tr key={bus.id}>
            <td>{bus.id}</td>
            <td><strong>{bus.busNumber}</strong></td>
            <td>{bus.busType}</td>
            <td>{bus.vendor}</td>
            <td>{bus.seats}</td>
            <td>{bus.from} → {bus.to}</td>
            <td>
              <div className="action-buttons">
                <button className="btn-icon btn-edit" onClick={() => onEdit(bus)}>Edit</button>
                <button className="btn-icon btn-delete" onClick={() => onDelete(bus.id)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Routes Table Component
const RoutesTable = ({ data, onEdit, onDelete }) => (
  <div className="data-table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Origin</th>
          <th>Destination</th>
          <th>Distance (km)</th>
          <th>Duration (min)</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((route) => (
          <tr key={route.routeId}>
            <td>{route.routeId}</td>
            <td>{route.origin}</td>
            <td>{route.destination}</td>
            <td>{route.distanceKm}</td>
            <td>{route.estimatedDurationMinutes}</td>
            <td>
              <span className={`badge ${route.isActive ? 'badge-active' : 'badge-inactive'}`}>
                {route.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <div className="action-buttons">
                <button className="btn-icon btn-edit" onClick={() => onEdit(route)}>Edit</button>
                <button className="btn-icon btn-delete" onClick={() => onDelete(route.routeId)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Bookings Table Component
const BookingsTable = ({ data, onDelete }) => (
  <div className="data-table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Booking ID</th>
          <th>Customer</th>
          <th>Bus</th>
          <th>Route</th>
          <th>Date</th>
          <th>Seats</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((booking) => (
          <tr key={booking.booking_id}>
            <td><strong>{booking.booking_reference}</strong></td>
            <td>{booking.customer?.name || 'N/A'}</td>
            <td>{booking.bus?.bus_number || 'N/A'}</td>
            <td>{booking.route?.origin || 'N/A'} → {booking.route?.destination || 'N/A'}</td>
            <td>{booking.journey_date ? new Date(booking.journey_date).toLocaleDateString() : 'N/A'}</td>
            <td>{booking.seat_numbers?.length || 0}</td>
            <td>Rs. {booking.total_amount || 0}</td>
            <td>
              <span className={`badge badge-${booking.status}`}>
                {booking.status}
              </span>
            </td>
            <td>
              <div className="action-buttons">
                <button className="btn-icon btn-delete" onClick={() => onDelete(booking.booking_id)}>Cancel</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Form Modal Component
const FormModal = ({ mode, type, item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(item || {});
  const [submitting, setSubmitting] = useState(false);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    if (type === 'buses') {
      fetchVendors();
    }
  }, [type]);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/vendors/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setVendors(data.data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      let url = '';
      let method = mode === 'add' ? 'POST' : 'PUT';

      switch (type) {
        case 'vendors':
          url = mode === 'add' ? `${API_URL}/vendors/` : `${API_URL}/vendors/${item.vendorId}`;
          break;
        case 'buses':
          url = mode === 'add' ? `${API_URL}/buses/` : `${API_URL}/buses/${item.busId}`;
          break;
        case 'routes':
          url = mode === 'add' ? `${API_URL}/routes/create` : `${API_URL}/routes/${item.routeId}`;
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(`${type.slice(0, -1)} ${mode === 'add' ? 'added' : 'updated'} successfully`);
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to save'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save. Please try again.');
    }
    setSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'add' ? 'Add' : 'Edit'} {type.slice(0, -1).charAt(0).toUpperCase() + type.slice(1, -1)}
          </h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {type === 'vendors' && (
              <>
                <div className="form-group">
                  <label className="form-label required">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-input"
                    value={formData.companyName || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    className="form-input"
                    value={formData.contactNumber || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={formData.email || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    name="address"
                    className="form-textarea"
                    value={formData.address || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group form-checkbox">
                  <input
                    type="checkbox"
                    name="isVerified"
                    checked={formData.isVerified || false}
                    onChange={handleChange}
                  />
                  <label>Verified Vendor</label>
                </div>
              </>
            )}

            {type === 'buses' && (
              <>
                <div className="form-group">
                  <label className="form-label required">Bus Number</label>
                  <input
                    type="text"
                    name="busNumber"
                    className="form-input"
                    value={formData.busNumber || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Bus Type</label>
                  <select
                    name="busType"
                    className="form-select"
                    value={formData.busType || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="AC Deluxe">AC Deluxe</option>
                    <option value="Non-AC">Non-AC</option>
                    <option value="Sleeper">Sleeper</option>
                    <option value="Semi-Sleeper">Semi-Sleeper</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Vendor</label>
                  <select
                    name="vendorId"
                    className="form-select"
                    value={formData.vendorId || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => (
                      <option key={v.vendorId} value={v.vendorId}>{v.companyName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Total Seats</label>
                  <input
                    type="number"
                    name="totalSeats"
                    className="form-input"
                    value={formData.totalSeats || ''}
                    onChange={handleChange}
                    min="10"
                    max="60"
                    required
                  />
                </div>
              </>
            )}

            {type === 'routes' && (
              <>
                <div className="form-group">
                  <label className="form-label required">Origin</label>
                  <input
                    type="text"
                    name="origin"
                    className="form-input"
                    value={formData.origin || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Destination</label>
                  <input
                    type="text"
                    name="destination"
                    className="form-input"
                    value={formData.destination || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Distance (km)</label>
                  <input
                    type="number"
                    name="distanceKm"
                    className="form-input"
                    value={formData.distanceKm || ''}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Duration (minutes)</label>
                  <input
                    type="number"
                    name="estimatedDurationMinutes"
                    className="form-input"
                    value={formData.estimatedDurationMinutes || ''}
                    onChange={handleChange}
                    min="30"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving...' : (mode === 'add' ? 'Add' : 'Update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
