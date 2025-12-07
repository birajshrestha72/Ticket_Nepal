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
    vendor_id: null,
    bus_number: '',
    bus_type: 'AC',
    total_seats: 40,
    available_seats: 40,
    amenities: [],
    registration_year: new Date().getFullYear(),
    insurance_expiry: '',
    is_active: true
  });

  const busTypes = ['AC', 'Non-AC', 'Deluxe', 'Semi-Deluxe', 'Sleeper', 'Seater'];
  const facilitiesList = ['AC', 'WiFi', 'Charging Port', 'TV', 'Restroom', 'Entertainment', 'Snacks', 'Water', 'Blanket', 'Pillow', 'Music System'];

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Use /buses/all-types endpoint which returns all buses grouped by type
      const response = await fetch(`${API_URL}/buses/all-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }

      const data = await response.json();
      
      // Extract all buses from grouped response
      const busesByType = data.data?.busesByType || {};
      const allBuses = [];
      
      Object.keys(busesByType).forEach(type => {
        busesByType[type].forEach(bus => {
          allBuses.push({
            bus_id: bus.id,
            bus_number: bus.busNumber,
            bus_type: bus.busType || type,
            total_seats: bus.seats,
            available_seats: bus.availableSeats,
            amenities: bus.amenities || [],
            vendor_id: bus.vendorId,
            vendor_name: bus.vendor,
            vendor_email: bus.vendorEmail || '',
            is_active: true // Assuming all fetched buses are active
          });
        });
      });
      
      console.log('All buses fetched:', allBuses.length);
      console.log('User details:', user);
      
      // Get vendor_id from vendors table
      let vendorId = null;
      if (user.role === 'vendor') {
        try {
          const vendorResponse = await fetch(`${API_URL}/vendors/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (vendorResponse.ok) {
            const vendorData = await vendorResponse.json();
            vendorId = vendorData.data?.vendor?.vendor_id;
            console.log('Vendor ID from API:', vendorId);
          }
        } catch (err) {
          console.error('Error fetching vendor profile:', err);
        }
      }
      
      // Filter buses for vendors
      let filteredBuses = allBuses;
      if (user.role === 'vendor') {
        const uniqueVendorIds = [...new Set(allBuses.map(bus => bus.vendor_id))];
        console.log('Unique vendor_ids in buses:', uniqueVendorIds);
        
        // Smart filtering with fallbacks
        if (vendorId) {
          // Primary: Match vendor_id
          filteredBuses = allBuses.filter(bus => bus.vendor_id === vendorId);
          console.log(`Filtered by vendor_id ${vendorId}: ${filteredBuses.length} buses`);
        } else if (user.email) {
          // Fallback 1: Match email
          filteredBuses = allBuses.filter(bus => 
            bus.vendor_email && bus.vendor_email.toLowerCase() === user.email.toLowerCase()
          );
          console.log(`Filtered by email ${user.email}: ${filteredBuses.length} buses`);
        } else if (user.id) {
          // Fallback 2: Match user.id with vendor_id
          filteredBuses = allBuses.filter(bus => bus.vendor_id === user.id);
          console.log(`Filtered by user.id ${user.id}: ${filteredBuses.length} buses`);
        }
        
        if (filteredBuses.length === 0) {
          console.warn('No buses found for vendor. Vendor may not have any buses yet.');
        }
      }
      
      // Store vendor_id in form data for new bus creation
      if (vendorId) {
        setFormData(prev => ({ ...prev, vendor_id: vendorId }));
      } else if (user.id && user.role === 'vendor') {
        setFormData(prev => ({ ...prev, vendor_id: user.id }));
      }
      
      setBuses(filteredBuses);
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
      // Validate required fields
      if (!formData.vendor_id) {
        throw new Error('Vendor ID is required');
      }
      if (!formData.bus_number || !formData.bus_type) {
        throw new Error('Bus number and type are required');
      }
      
      const token = localStorage.getItem('token');
      const url = editingBus 
        ? `${API_URL}/buses/${editingBus.bus_id}`
        : `${API_URL}/buses/create`;
      
      const method = editingBus ? 'PUT' : 'POST';
      
      // Prepare data for submission
      const submitData = {
        vendor_id: formData.vendor_id,
        bus_number: formData.bus_number.trim(),
        bus_type: formData.bus_type,
        total_seats: parseInt(formData.total_seats) || 40,
        available_seats: parseInt(formData.available_seats) || parseInt(formData.total_seats) || 40,
        amenities: formData.amenities || [],
        registration_year: parseInt(formData.registration_year) || new Date().getFullYear(),
        insurance_expiry: formData.insurance_expiry || null,
        is_active: formData.is_active !== false
      };
      
      console.log('Submitting bus data:', submitData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save bus');
      }

      const result = await response.json();
      console.log('Bus saved successfully:', result);
      
      await fetchBuses();
      resetForm();
      setShowForm(false);
      alert(editingBus ? 'Bus updated successfully!' : 'Bus created successfully!');
    } catch (err) {
      console.error('Error saving bus:', err);
      setError(err.message);
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (bus) => {
    console.log('Editing bus:', bus);
    setEditingBus(bus);
    setFormData({
      vendor_id: bus.vendor_id,
      bus_number: bus.bus_number || '',
      bus_type: bus.bus_type || 'AC',
      total_seats: bus.total_seats || 40,
      available_seats: bus.available_seats || 40,
      amenities: bus.amenities || [],
      registration_year: bus.registration_year || new Date().getFullYear(),
      insurance_expiry: bus.insurance_expiry || '',
      is_active: bus.is_active !== undefined ? bus.is_active : true
    });
    setShowForm(true);
  };

  const handleDelete = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/buses/${busId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete bus');
      }

      alert('Bus deleted successfully!');
      await fetchBuses();
    } catch (err) {
      console.error('Error deleting bus:', err);
      setError(err.message);
      alert('Error: ' + err.message);
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
    const currentVendorId = formData.vendor_id; // Preserve vendor_id
    setFormData({
      vendor_id: currentVendorId,
      bus_number: '',
      bus_type: 'AC',
      total_seats: 40,
      available_seats: 40,
      amenities: [],
      registration_year: new Date().getFullYear(),
      insurance_expiry: '',
      is_active: true
    });
    setEditingBus(null);
    setError(null);
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.bus_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.bus_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && bus.is_active) ||
                         (filterStatus === 'inactive' && !bus.is_active);
    return matchesSearch && matchesStatus;
  });
  
  console.log('Buses state:', buses);
  console.log('Filtered buses:', filteredBuses);
  console.log('Search term:', searchTerm);
  console.log('Filter status:', filterStatus);

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

                <div className="form-group">
                  <label>Registration Year</label>
                  <input
                    type="number"
                    name="registration_year"
                    value={formData.registration_year}
                    onChange={handleInputChange}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    placeholder={new Date().getFullYear().toString()}
                  />
                </div>

                <div className="form-group">
                  <label>Insurance Expiry</label>
                  <input
                    type="date"
                    name="insurance_expiry"
                    value={formData.insurance_expiry}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Amenities</label>
                <div className="amenities-grid">
                  {facilitiesList.map(facility => (
                    <label key={facility} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(facility)}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            amenities: prev.amenities.includes(facility)
                              ? prev.amenities.filter(f => f !== facility)
                              : [...prev.amenities, facility]
                          }));
                        }}
                      />
                      <span>{facility}</span>
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
                  <span>Active (available for bookings)</span>
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
                    {bus.vendor_name && (
                      <div className="info-item">
                        <span className="label">Vendor:</span>
                        <span className="value">{bus.vendor_name}</span>
                      </div>
                    )}
                  </div>

                  {bus.amenities && bus.amenities.length > 0 && (
                    <div className="facilities">
                      {bus.amenities.map((amenity, idx) => (
                        <span key={idx} className="facility-tag">{amenity}</span>
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
