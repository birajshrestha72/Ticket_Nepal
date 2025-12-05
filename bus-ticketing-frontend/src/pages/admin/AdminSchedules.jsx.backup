import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/adminSchedules.css';
import '../../css/scheduleManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AdminSchedules = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    bus_id: '',
    route_id: '',
    is_active: 'all'
  });
  
  // Form state
  const [formData, setFormData] = useState({
    bus_id: '',
    route_id: '',
    departure_time: '',
    arrival_time: '',
    price: '',
    operating_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    is_active: true
  });

  const daysOfWeek = [
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' },
    { short: 'Sun', full: 'Sunday' }
  ];

  useEffect(() => {
    const initData = async () => {
      await Promise.all([fetchBuses(), fetchRoutes()]);
      await fetchSchedules();
    };
    initData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchSchedules();
    }
  }, [filters.bus_id, filters.route_id, filters.is_active]);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const params = new URLSearchParams();
      if (filters.bus_id) params.append('bus_id', filters.bus_id);
      if (filters.route_id) params.append('route_id', filters.route_id);
      if (filters.is_active !== 'all') params.append('is_active', filters.is_active === 'true');
      
      const url = `${API_URL}/schedules/vendor/all${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
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

      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }

      const data = await response.json();
      setSchedules(data.data?.schedules || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/buses/all-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch buses');
      
      const data = await response.json();
      
      // Extract buses from grouped busesByType
      const busesByType = data.data?.busesByType || {};
      const allBuses = [];
      Object.values(busesByType).forEach(busArray => {
        busArray.forEach(bus => {
          allBuses.push({
            bus_id: bus.id,
            bus_number: bus.bus_number,
            bus_type: bus.bus_type,
            total_seats: bus.total_seats
          });
        });
      });
      
      setBuses(allBuses);
    } catch (err) {
      console.error('Error fetching buses:', err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/routes/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch routes');
      
      const data = await response.json();
      setRoutes(data.data?.routes || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const days = prev.operating_days.includes(day)
        ? prev.operating_days.filter(d => d !== day)
        : [...prev.operating_days, day];
      return { ...prev, operating_days: days };
    });
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    setFormData({
      bus_id: '',
      route_id: '',
      departure_time: '',
      arrival_time: '',
      price: '',
      operating_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      bus_id: schedule.bus_id.toString(),
      route_id: schedule.route_id.toString(),
      departure_time: schedule.departure_time.substring(0, 5), // HH:MM format
      arrival_time: schedule.arrival_time.substring(0, 5),
      price: schedule.price.toString(),
      operating_days: schedule.operating_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      is_active: schedule.is_active
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      bus_id: '',
      route_id: '',
      departure_time: '',
      arrival_time: '',
      price: '',
      operating_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      is_active: true
    });
  };

  const validateForm = () => {
    if (!formData.bus_id) {
      alert('Please select a bus');
      return false;
    }
    if (!formData.route_id) {
      alert('Please select a route');
      return false;
    }
    if (!formData.departure_time) {
      alert('Please enter departure time');
      return false;
    }
    if (!formData.arrival_time) {
      alert('Please enter arrival time');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Please enter a valid price');
      return false;
    }
    if (formData.operating_days.length === 0) {
      alert('Please select at least one operating day');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      const url = editingSchedule
        ? `${API_URL}/schedules/${editingSchedule.schedule_id}`
        : `${API_URL}/schedules/create`;
      
      const method = editingSchedule ? 'PUT' : 'POST';
      
      const payload = {
        busId: parseInt(formData.bus_id),
        routeId: parseInt(formData.route_id),
        departureTime: formData.departure_time,
        arrivalTime: formData.arrival_time,
        price: parseFloat(formData.price),
        operatingDays: formData.operating_days,
        isActive: formData.is_active
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save schedule');
      }

      setSuccessMessage(editingSchedule ? 'Schedule updated successfully!' : 'Schedule created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      closeModal();
      fetchSchedules();
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert(err.message);
    }
  };

  const handleEdit = (schedule) => {
    openEditModal(schedule);
  };

  const resetForm = () => {
    setFormData({
      bus_id: '',
      route_id: '',
      departure_time: '',
      arrival_time: '',
      price: '',
      operating_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      is_active: true
    });
    setEditingSchedule(null);
    setShowForm(false);
  };

  const toggleScheduleStatus = async (schedule) => {
    await toggleStatus(schedule);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      setSuccessMessage('Schedule deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert(err.message);
    }
  };

  const toggleStatus = async (schedule) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/schedules/${schedule.schedule_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          busId: schedule.bus_id,
          routeId: schedule.route_id,
          departureTime: schedule.departure_time,
          arrivalTime: schedule.arrival_time,
          price: schedule.price,
          operatingDays: schedule.operating_days,
          isActive: !schedule.is_active
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setSuccessMessage(`Schedule ${!schedule.is_active ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      fetchSchedules();
    } catch (err) {
      console.error('Error toggling status:', err);
      alert(err.message);
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        schedule.bus_number?.toLowerCase().includes(searchLower) ||
        schedule.origin?.toLowerCase().includes(searchLower) ||
        schedule.destination?.toLowerCase().includes(searchLower) ||
        schedule.route?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM
  };

  const calculateDuration = (departure, arrival) => {
    if (!departure || !arrival) return '';
    const [depHour, depMin] = departure.split(':').map(Number);
    const [arrHour, arrMin] = arrival.split(':').map(Number);
    
    let hours = arrHour - depHour;
    let minutes = arrMin - depMin;
    
    if (minutes < 0) {
      hours--;
      minutes += 60;
    }
    if (hours < 0) hours += 24;
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="page adminSchedules">
      <div className="container">
        {/* Header Section */}
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">📅 Schedule Management</h1>
            <p className="page-subtitle">Manage bus schedules, timings, and pricing</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={openAddModal}>
              <span>➕</span> Add New Schedule
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-banner">
            <span className="success-icon">✓</span>
            <span>{successMessage}</span>
            <button className="close-btn" onClick={() => setSuccessMessage('')}>✕</button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="close-btn" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="filters-section">
          <div className="filter-group search-group">
            <label>🔍 Search</label>
            <input
              type="text"
              placeholder="Search by bus, route, origin, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Bus</label>
            <select
              value={filters.bus_id}
              onChange={(e) => setFilters(prev => ({ ...prev, bus_id: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Buses</option>
              {buses.map((bus, index) => (
                <option key={`${bus.bus_id}-${index}`} value={bus.bus_id}>
                  {bus.bus_number} - {bus.bus_type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Route</label>
            <select
              value={filters.route_id}
              onChange={(e) => setFilters(prev => ({ ...prev, route_id: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Routes</option>
              {routes.map(route => (
                <option key={route.route_id} value={route.route_id}>
                  {route.origin} → {route.destination}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.is_active}
              onChange={(e) => setFilters(prev => ({ ...prev, is_active: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <button 
            className="btn-reset-filters"
            onClick={() => {
              setFilters({ bus_id: '', route_id: '', is_active: 'all' });
              setSearchTerm('');
            }}
          >
            🔄 Reset
          </button>
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingSchedule ? '✏️ Edit Schedule' : '➕ Add New Schedule'}</h2>
                <button className="close-modal" onClick={closeModal}>✕</button>
              </div>
            
            <form onSubmit={handleSubmit} className="schedule-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Bus *</label>
                  <select
                    name="bus_id"
                    value={formData.bus_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Bus</option>
                    {buses.map(bus => (
                      <option key={bus.bus_id} value={bus.bus_id}>
                        {bus.bus_number} - {bus.bus_type} ({bus.total_seats} seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Route *</label>
                  <select
                    name="route_id"
                    value={formData.route_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route.route_id} value={route.route_id}>
                        {route.origin} → {route.destination} ({route.distance_km} km)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Departure Time *</label>
                  <input
                    type="time"
                    name="departure_time"
                    value={formData.departure_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Arrival Time *</label>
                  <input
                    type="time"
                    name="arrival_time"
                    value={formData.arrival_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Price (Rs.) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                    placeholder="e.g., 800"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Operating Days *</label>
                <div className="days-grid">
                  {daysOfWeek.map(day => (
                    <label key={day} className="day-chip">
                      <input
                        type="checkbox"
                        checked={formData.operating_days.includes(day)}
                        onChange={() => handleDayToggle(day)}
                      />
                      <span>{day.substring(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>Active (available for booking)</span>
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="schedules-container">
        {loading && schedules.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading schedules...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No schedules found</h3>
            <p>
              {searchTerm || filters.bus_id || filters.route_id || filters.is_active !== 'all'
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first schedule'}
            </p>
            {!searchTerm && !filters.bus_id && !filters.route_id && filters.is_active === 'all' && (
              <button className="btn-primary" onClick={openAddModal}>
                ➕ Add First Schedule
              </button>
            )}
          </div>
        ) : (
          <div className="schedules-table-wrapper">
            <table className="schedules-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Bus</th>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Operating Days</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map(schedule => (
                  <tr key={schedule.schedule_id} className={!schedule.is_active ? 'inactive-row' : ''}>
                    <td>#{schedule.schedule_id}</td>
                    <td>
                      <div className="bus-info">
                        <span className="bus-icon">🚌</span>
                        <div>
                          <div className="bus-number">{schedule.bus_number}</div>
                          <div className="bus-type">{schedule.bus_type}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="route-info">
                        <strong>{schedule.origin} → {schedule.destination}</strong>
                        <div className="route-distance">{schedule.distance_km} km</div>
                      </div>
                    </td>
                    <td className="time-cell">
                      <span className="time-badge">🕐 {formatTime(schedule.departure_time)}</span>
                    </td>
                    <td className="time-cell">
                      <span className="time-badge">🕐 {formatTime(schedule.arrival_time)}</span>
                    </td>
                    <td className="duration-cell">
                      {calculateDuration(schedule.departure_time, schedule.arrival_time)}
                    </td>
                    <td className="price-cell">रू {schedule.price?.toLocaleString()}</td>
                    <td>
                      <div className="days-display">
                        {schedule.operating_days?.length === 7 ? (
                          <span className="days-badge all-days">Every Day</span>
                        ) : (
                          <span className="days-badge">
                            {schedule.operating_days?.map(d => d.substring(0, 3)).join(', ') || 'N/A'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="bookings-badge">{schedule.total_bookings || 0}</span>
                    </td>
                    <td>
                      {schedule.is_active ? (
                        <span className="status-badge active">● Active</span>
                      ) : (
                        <span className="status-badge inactive">● Inactive</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(schedule)}
                        title="Edit schedule"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-toggle"
                        onClick={() => toggleStatus(schedule)}
                        title={schedule.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {schedule.is_active ? '🔴' : '🟢'}
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(schedule.schedule_id)}
                        title="Delete schedule"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {schedules.length > 0 && (
        <div className="summary-footer">
          <p>
            Showing <strong>{filteredSchedules.length}</strong> of <strong>{schedules.length}</strong> schedule{schedules.length !== 1 ? 's' : ''}
            {' | '}
            Active: <strong>{schedules.filter(s => s.is_active).length}</strong>
            {' | '}
            Inactive: <strong>{schedules.filter(s => !s.is_active).length}</strong>
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminSchedules;
