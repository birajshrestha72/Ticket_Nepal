import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/scheduleManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AdminSchedules = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
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
    operating_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    is_active: true
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchSchedules();
    fetchBuses();
    fetchRoutes();
  }, [filters]);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.bus_id) params.append('bus_id', filters.bus_id);
      if (filters.route_id) params.append('route_id', filters.route_id);
      if (filters.is_active !== 'all') params.append('is_active', filters.is_active);
      
      const response = await fetch(`${API_URL}/schedules/vendor/all?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      let endpoint = `${API_URL}/buses/all`;
      if (user.role === 'vendor') {
        endpoint = `${API_URL}/buses/vendor`;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBuses(data.data?.buses || []);
      }
    } catch (err) {
      console.error('Error fetching buses:', err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/routes/all?is_active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoutes(data.data?.routes || []);
      }
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
    setFormData(prev => ({
      ...prev,
      operating_days: prev.operating_days.includes(day)
        ? prev.operating_days.filter(d => d !== day)
        : [...prev.operating_days, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const url = editingSchedule 
        ? `${API_URL}/schedules/${editingSchedule.schedule_id}`
        : `${API_URL}/schedules/create`;
      
      const method = editingSchedule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          bus_id: parseInt(formData.bus_id),
          route_id: parseInt(formData.route_id),
          price: parseFloat(formData.price)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save schedule');
      }

      await fetchSchedules();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError(err.message);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      bus_id: schedule.bus_id?.toString() || '',
      route_id: schedule.route_id?.toString() || '',
      departure_time: schedule.departure_time || '',
      arrival_time: schedule.arrival_time || '',
      price: schedule.price?.toString() || '',
      operating_days: schedule.operating_days || daysOfWeek,
      is_active: schedule.is_active !== undefined ? schedule.is_active : true
    });
    setShowForm(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule? This will affect future bookings.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete schedule');
      }

      await fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError(err.message);
    }
  };

  const toggleScheduleStatus = async (schedule) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/schedules/${schedule.schedule_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !schedule.is_active
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule status');
      }

      await fetchSchedules();
    } catch (err) {
      console.error('Error updating schedule status:', err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      bus_id: '',
      route_id: '',
      departure_time: '',
      arrival_time: '',
      price: '',
      operating_days: daysOfWeek,
      is_active: true
    });
    setEditingSchedule(null);
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="schedule-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-management">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">📅 Schedule Management</h1>
          <p className="page-subtitle">Manage bus schedules, timings, and pricing</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <span>➕</span> Add New Schedule
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Bus</label>
          <select
            value={filters.bus_id}
            onChange={(e) => setFilters(prev => ({ ...prev, bus_id: e.target.value }))}
            className="filter-select"
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
          onClick={() => setFilters({ bus_id: '', route_id: '', is_active: 'all' })}
        >
          🔄 Reset
        </button>
      </div>

      {/* Schedule Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSchedule ? '✏️ Edit Schedule' : '➕ Add New Schedule'}</h2>
              <button className="close-modal" onClick={() => setShowForm(false)}>✕</button>
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
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSchedule ? 'Update Schedule' : 'Add Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="schedules-container">
        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No schedules found</h3>
            <p>
              {filters.bus_id || filters.route_id || filters.is_active !== 'all'
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first schedule'}
            </p>
            {!filters.bus_id && !filters.route_id && filters.is_active === 'all' && (
              <button 
                className="btn-primary"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
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
                  <th>Price</th>
                  <th>Operating Days</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(schedule => (
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
                        {schedule.route}
                        <div className="route-distance">{schedule.distance_km} km</div>
                      </div>
                    </td>
                    <td className="time-cell">
                      <span className="time-badge">🕐 {schedule.departure_time}</span>
                    </td>
                    <td className="time-cell">
                      <span className="time-badge">🕐 {schedule.arrival_time}</span>
                    </td>
                    <td className="price-cell">Rs. {schedule.price.toLocaleString()}</td>
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
                        onClick={() => toggleScheduleStatus(schedule)}
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
            Showing <strong>{schedules.length}</strong> schedule{schedules.length !== 1 ? 's' : ''}
            {' | '}
            Active: <strong>{schedules.filter(s => s.is_active).length}</strong>
            {' | '}
            Inactive: <strong>{schedules.filter(s => !s.is_active).length}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSchedules;
