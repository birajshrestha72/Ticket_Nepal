import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/adminSchedules.css';
import '../../css/scheduleManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AdminSchedules = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state for editing days
  const [formData, setFormData] = useState({
    operating_days: [],
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
    fetchSchedules();
  }, []);

  useEffect(() => {
    console.log('Schedules state updated:', schedules);
    console.log('Schedules count:', schedules.length);
  }, [schedules]);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/schedules/vendor/all`, {
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
      console.log('Schedules data:', data);
      console.log('Schedules array:', data.data?.schedules);
      console.log('Schedules length:', data.data?.schedules?.length);
      
      const schedulesData = data.data?.schedules || [];
      console.log('Setting schedules:', schedulesData);
      setSchedules(schedulesData);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const days = prev.operating_days.includes(day)
        ? prev.operating_days.filter(d => d !== day)
        : [...prev.operating_days, day];
      return { ...prev, operating_days: days };
    });
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      operating_days: schedule.operating_days || [],
      is_active: schedule.is_active
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      operating_days: [],
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.operating_days.length === 0) {
      alert('Please select at least one operating day');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/schedules/${editingSchedule.schedule_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operating_days: formData.operating_days,
          is_active: formData.is_active
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update schedule');
      }

      setSuccessMessage('Schedule updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      closeModal();
      fetchSchedules();
    } catch (err) {
      console.error('Error updating schedule:', err);
      alert(err.message);
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
          operating_days: schedule.operating_days,
          is_active: !schedule.is_active
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
            <p className="page-subtitle">Manage which days your buses operate</p>
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

        {/* Search Section */}
        <div className="filters-section">
          <div className="filter-group search-group">
            <label>🔍 Search</label>
            <input
              type="text"
              placeholder="Search by bus number, route, origin, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✏️ Edit Operating Days</h2>
                <button className="close-modal" onClick={closeModal}>✕</button>
              </div>
            
              <form onSubmit={handleSubmit} className="schedule-form">
                <div className="schedule-info">
                  <h3>Bus: {editingSchedule?.bus_number} ({editingSchedule?.bus_type})</h3>
                  <p>Route: {editingSchedule?.origin} → {editingSchedule?.destination}</p>
                  <p>Time: {formatTime(editingSchedule?.departure_time)} - {formatTime(editingSchedule?.arrival_time)}</p>
                  <p>Price: रू {editingSchedule?.price?.toLocaleString()}</p>
                </div>

                <div className="form-group">
                  <label>Select Operating Days *</label>
                  <p className="help-text">Choose which days of the week this bus operates</p>
                  <div className="days-grid">
                    {daysOfWeek.map(day => (
                      <label key={day.short} className={`day-chip ${formData.operating_days.includes(day.short) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={formData.operating_days.includes(day.short)}
                          onChange={() => handleDayToggle(day.short)}
                        />
                        <span className="day-short">{day.short}</span>
                        <span className="day-full">{day.full}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
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
                    {loading ? 'Saving...' : 'Update Schedule'}
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
                {searchTerm
                  ? 'Try adjusting your search' 
                  : 'No bus schedules available for your account'}
              </p>
            </div>
          ) : (
            <div className="schedules-table-wrapper">
              <table className="schedules-table">
                <thead>
                  <tr>
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
                          ) : schedule.operating_days?.length === 0 ? (
                            <span className="days-badge no-days">Not Operating</span>
                          ) : (
                            <span className="days-badge">
                              {schedule.operating_days?.join(', ') || 'N/A'}
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
                          onClick={() => openEditModal(schedule)}
                          title="Edit operating days"
                        >
                          ✏️ Edit Days
                        </button>
                        <button
                          className="btn-icon btn-toggle"
                          onClick={() => toggleScheduleStatus(schedule)}
                          title={schedule.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {schedule.is_active ? '⏸️' : '▶️'}
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
