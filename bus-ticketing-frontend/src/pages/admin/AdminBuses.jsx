import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/busManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const AdminBuses = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    bus_number: '',
    bus_type: 'Standard',
    total_seats: 40,
    available_seats: 40,
    is_active: true,
    facilities: []
  });

  const busTypes = ['Standard', 'Deluxe', 'Super Deluxe', 'AC', 'Non-AC', 'Sleeper'];
  const facilitiesList = ['AC', 'WiFi', 'Charging Port', 'Entertainment', 'Snacks', 'Water', 'Blanket', 'Pillow'];

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      let endpoint = `${API_URL}/buses/all`;
      
      // If vendor, fetch only their buses
      if (user.role === 'vendor') {
        endpoint = `${API_URL}/buses/vendor`;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }

      const data = await response.json();
      setBuses(data.data?.buses || []);
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFacilityToggle = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const url = editingBus 
        ? `${API_URL}/buses/${editingBus.bus_id}`
        : `${API_URL}/buses/create`;
      
      const method = editingBus ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save bus');
      }

      await fetchBuses();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving bus:', err);
      setError(err.message);
    }
  };

  const handleEdit = (bus) => {
    setEditingBus(bus);
    setFormData({
      bus_number: bus.bus_number || '',
      bus_type: bus.bus_type || 'Standard',
      total_seats: bus.total_seats || 40,
      available_seats: bus.available_seats || 40,
      is_active: bus.is_active !== undefined ? bus.is_active : true,
      facilities: bus.facilities || []
    });
    setShowForm(true);
  };

  const handleDelete = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/buses/${busId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete bus');
      }

      await fetchBuses();
    } catch (err) {
      console.error('Error deleting bus:', err);
      setError(err.message);
    }
  };

  const toggleBusStatus = async (bus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/buses/${bus.bus_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...bus,
          is_active: !bus.is_active
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update bus status');
      }

      await fetchBuses();
    } catch (err) {
      console.error('Error updating bus status:', err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      bus_number: '',
      bus_type: 'Standard',
      total_seats: 40,
      available_seats: 40,
      is_active: true,
      facilities: []
    });
    setEditingBus(null);
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.bus_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.bus_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && bus.is_active) ||
                         (filterStatus === 'inactive' && !bus.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="bus-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bus-management">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">🚌 Bus Management</h1>
          <p className="page-subtitle">Manage your fleet of buses</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <span>➕</span> Add New Bus
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
            placeholder="Search by bus number or type..."
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
            All ({buses.length})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active ({buses.filter(b => b.is_active).length})
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive ({buses.filter(b => !b.is_active).length})
          </button>
        </div>
      </div>

      {/* Bus Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBus ? '✏️ Edit Bus' : '➕ Add New Bus'}</h2>
              <button className="close-modal" onClick={() => setShowForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="bus-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Bus Number *</label>
                  <input
                    type="text"
                    name="bus_number"
                    value={formData.bus_number}
                    onChange={handleInputChange}
                    placeholder="e.g., BA 2 KHA 1234"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bus Type *</label>
                  <select
                    name="bus_type"
                    value={formData.bus_type}
                    onChange={handleInputChange}
                    required
                  >
                    {busTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Total Seats *</label>
                  <input
                    type="number"
                    name="total_seats"
                    value={formData.total_seats}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Available Seats *</label>
                  <input
                    type="number"
                    name="available_seats"
                    value={formData.available_seats}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.total_seats}
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
                  <span>Active (available for bookings)</span>
                </label>
              </div>

              <div className="form-group">
                <label>Facilities</label>
                <div className="facilities-grid">
                  {facilitiesList.map(facility => (
                    <label key={facility} className="facility-chip">
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
                </div>
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
                  {editingBus ? 'Update Bus' : 'Add Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buses List */}
      <div className="buses-container">
        {filteredBuses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚌</div>
            <h3>No buses found</h3>
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first bus'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button 
                className="btn-primary"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                ➕ Add First Bus
              </button>
            )}
          </div>
        ) : (
          <div className="buses-grid">
            {filteredBuses.map(bus => (
              <div key={bus.bus_id} className={`bus-card ${!bus.is_active ? 'inactive' : ''}`}>
                <div className="bus-card-header">
                  <div className="bus-number">
                    <span className="bus-icon">🚌</span>
                    <span className="number">{bus.bus_number}</span>
                  </div>
                  <div className="status-badge">
                    {bus.is_active ? (
                      <span className="status active">● Active</span>
                    ) : (
                      <span className="status inactive">● Inactive</span>
                    )}
                  </div>
                </div>

                <div className="bus-card-body">
                  <div className="bus-info">
                    <div className="info-item">
                      <span className="label">Type:</span>
                      <span className="value">{bus.bus_type}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Seats:</span>
                      <span className="value">{bus.available_seats}/{bus.total_seats} available</span>
                    </div>
                  </div>

                  {bus.facilities && bus.facilities.length > 0 && (
                    <div className="facilities">
                      {bus.facilities.map((facility, idx) => (
                        <span key={idx} className="facility-tag">{facility}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bus-card-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(bus)}
                    title="Edit bus"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-toggle"
                    onClick={() => toggleBusStatus(bus)}
                    title={bus.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {bus.is_active ? '🔴' : '🟢'}
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(bus.bus_id)}
                    title="Delete bus"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {filteredBuses.length > 0 && (
        <div className="summary-footer">
          <p>
            Showing <strong>{filteredBuses.length}</strong> of <strong>{buses.length}</strong> buses
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminBuses;
