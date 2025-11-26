import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/routeManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AdminRoutes = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    distance_km: '',
    estimated_duration_minutes: '',
    base_price: '',
    is_active: true
  });

  useEffect(() => {
    fetchRoutes();
    fetchCities();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/routes/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }

      const data = await response.json();
      setRoutes(data.data?.routes || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/routes/cities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCities(data.data?.cities || []);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const url = editingRoute 
        ? `${API_URL}/routes/${editingRoute.route_id}`
        : `${API_URL}/routes/create`;
      
      const method = editingRoute ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          distance_km: parseFloat(formData.distance_km),
          estimated_duration_minutes: parseInt(formData.estimated_duration_minutes),
          base_price: parseFloat(formData.base_price)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save route');
      }

      await fetchRoutes();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving route:', err);
      setError(err.message);
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      origin: route.origin || '',
      destination: route.destination || '',
      distance_km: route.distance_km || '',
      estimated_duration_minutes: route.estimated_duration_minutes || '',
      base_price: route.base_price || '',
      is_active: route.is_active !== undefined ? route.is_active : true
    });
    setShowForm(true);
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete route');
      }

      await fetchRoutes();
    } catch (err) {
      console.error('Error deleting route:', err);
      setError(err.message);
    }
  };

  const toggleRouteStatus = async (route) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/routes/${route.route_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !route.is_active
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update route status');
      }

      await fetchRoutes();
    } catch (err) {
      console.error('Error updating route status:', err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      origin: '',
      destination: '',
      distance_km: '',
      estimated_duration_minutes: '',
      base_price: '',
      is_active: true
    });
    setEditingRoute(null);
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && route.is_active) ||
                         (filterStatus === 'inactive' && !route.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="route-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-management">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">🗺️ Route Management</h1>
          <p className="page-subtitle">Manage bus routes between cities</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <span>➕</span> Add New Route
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
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by origin or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({routes.length})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active ({routes.filter(r => r.is_active).length})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive ({routes.filter(r => !r.is_active).length})
          </button>
        </div>
      </div>

      {/* Route Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRoute ? '✏️ Edit Route' : '➕ Add New Route'}</h2>
              <button className="close-modal" onClick={() => setShowForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="route-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Origin City *</label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    placeholder="e.g., Kathmandu"
                    list="cities-list"
                    required
                  />
                  <datalist id="cities-list">
                    {cities.map((city, idx) => (
                      <option key={idx} value={city} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Destination City *</label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="e.g., Pokhara"
                    list="cities-list"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Distance (km) *</label>
                  <input
                    type="number"
                    name="distance_km"
                    value={formData.distance_km}
                    onChange={handleInputChange}
                    min="1"
                    step="0.1"
                    placeholder="e.g., 200"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    name="estimated_duration_minutes"
                    value={formData.estimated_duration_minutes}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="e.g., 360"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Base Price (Rs.) *</label>
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                    placeholder="e.g., 800"
                    required
                  />
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
                  <span>Active (available for scheduling)</span>
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
                  {editingRoute ? 'Update Route' : 'Add Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routes List */}
      <div className="routes-container">
        {filteredRoutes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <h3>No routes found</h3>
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first route'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button 
                className="btn-primary"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                ➕ Add First Route
              </button>
            )}
          </div>
        ) : (
          <div className="routes-table-wrapper">
            <table className="routes-table">
              <thead>
                <tr>
                  <th>Route ID</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Distance</th>
                  <th>Duration</th>
                  <th>Base Price</th>
                  <th>Schedules</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map(route => (
                  <tr key={route.route_id} className={!route.is_active ? 'inactive-row' : ''}>
                    <td>#{route.route_id}</td>
                    <td className="city-cell">
                      <span className="city-icon">📍</span>
                      {route.origin}
                    </td>
                    <td className="city-cell">
                      <span className="city-icon">🎯</span>
                      {route.destination}
                    </td>
                    <td>{route.distance_km} km</td>
                    <td>{Math.floor(route.estimated_duration_minutes / 60)}h {route.estimated_duration_minutes % 60}m</td>
                    <td className="price-cell">Rs. {route.base_price.toLocaleString()}</td>
                    <td>
                      <span className="schedule-badge">
                        {route.active_schedules || 0} active
                      </span>
                    </td>
                    <td>
                      {route.is_active ? (
                        <span className="status-badge active">● Active</span>
                      ) : (
                        <span className="status-badge inactive">● Inactive</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(route)}
                        title="Edit route"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-toggle"
                        onClick={() => toggleRouteStatus(route)}
                        title={route.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {route.is_active ? '🔴' : '🟢'}
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(route.route_id)}
                        title="Delete route"
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
      {filteredRoutes.length > 0 && (
        <div className="summary-footer">
          <p>
            Showing <strong>{filteredRoutes.length}</strong> of <strong>{routes.length}</strong> routes
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminRoutes;
