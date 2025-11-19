import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../css/vendorList.css';

const API_URL = 'http://localhost:8000/api/v1';

/**
 * VendorList Component
 * Displays paginated list of vendors with their buses
 */
const VendorList = () => {
  // State management
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVendors, setExpandedVendors] = useState(new Set()); // Track expanded vendors
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_prev: false
  });

  // Filters
  const [filters, setFilters] = useState({
    city: '',
    province: '',
    verified_only: false
  });

  /**
   * Fetch vendors from API
   */
  const fetchVendors = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: 10,
        ...(filters.city && { city: filters.city }),
        ...(filters.province && { province: filters.province }),
        ...(filters.verified_only && { verified_only: 'true' })
      });

      const response = await fetch(`${API_URL}/vendors/public/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to load vendors');
      }

      setVendors(data.data.vendors);
      setPagination(data.data.pagination);
      
      // Scroll to top on page change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendors on component mount and when filters change
  useEffect(() => {
    fetchVendors(1);
  }, [filters]);

  /**
   * Handle page navigation
   */
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.total_pages) {
      fetchVendors(page);
    }
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      city: '',
      province: '',
      verified_only: false
    });
  };

  /**
   * Toggle vendor expansion
   */
  const toggleVendor = (vendorId) => {
    const newExpanded = new Set(expandedVendors);
    if (newExpanded.has(vendorId)) {
      newExpanded.delete(vendorId);
    } else {
      newExpanded.add(vendorId);
    }
    setExpandedVendors(newExpanded);
  };

  /**
   * Expand all vendors
   */
  const expandAll = () => {
    setExpandedVendors(new Set(vendors.map(v => v.vendor_id)));
  };

  /**
   * Collapse all vendors
   */
  const collapseAll = () => {
    setExpandedVendors(new Set());
  };

  /**
   * Render loading state
   */
  if (loading && vendors.length === 0) {
    return (
      <div className="vendor-list-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading vendors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-list-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">🚌 Bus Vendors</h1>
          <p className="page-subtitle">
            Browse through our trusted bus operators and their fleet
          </p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                placeholder="Search by city"
                value={filters.city}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="province">Province</label>
              <select
                id="province"
                name="province"
                value={filters.province}
                onChange={handleFilterChange}
              >
                <option value="">All Provinces</option>
                <option value="Koshi Pradesh">Koshi Pradesh</option>
                <option value="Madhesh Pradesh">Madhesh Pradesh</option>
                <option value="Bagmati Pradesh">Bagmati Pradesh</option>
                <option value="Gandaki Pradesh">Gandaki Pradesh</option>
                <option value="Lumbini Pradesh">Lumbini Pradesh</option>
                <option value="Karnali Pradesh">Karnali Pradesh</option>
                <option value="Sudurpashchim Pradesh">Sudurpashchim Pradesh</option>
              </select>
            </div>

            <div className="filter-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="verified_only"
                  checked={filters.verified_only}
                  onChange={handleFilterChange}
                />
                <span>Verified Vendors Only</span>
              </label>
            </div>

            {(filters.city || filters.province || filters.verified_only) && (
              <button className="btn-clear-filters" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Expand/Collapse Controls */}
        {vendors.length > 0 && (
          <div className="vendor-controls">
            <button onClick={expandAll} className="btn-control">
              Expand All
            </button>
            <button onClick={collapseAll} className="btn-control">
              Collapse All
            </button>
          </div>
        )}

        {/* Results Summary */}
        <div className="results-summary">
          <p>
            Showing <strong>{vendors.length}</strong> vendor
            {vendors.length !== 1 ? 's' : ''} 
            {pagination.total_items > 0 && 
              ` (${pagination.total_items} total)`
            }
          </p>
        </div>

        {/* Vendors List */}
        {vendors.length === 0 && !loading ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No vendors found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="vendors-list">
            {vendors.map((vendor) => (
              <div key={vendor.vendor_id} className="vendor-card">
                {/* Vendor Header */}
                <div className="vendor-header" onClick={() => toggleVendor(vendor.vendor_id)} style={{ cursor: 'pointer' }}>
                  <div className="vendor-info">
                    <h2 className="vendor-name">
                      {vendor.company_name}
                      {vendor.is_verified && (
                        <span className="verified-badge" title="Verified Vendor">
                          ✓
                        </span>
                      )}
                    </h2>
                    <p className="vendor-location">
                      📍 {vendor.city}, {vendor.province}
                    </p>
                    <div className="vendor-meta">
                      <span className="rating">
                        ⭐ {vendor.average_rating.toFixed(1)} 
                        ({vendor.total_reviews} reviews)
                      </span>
                      <span className="bus-count">
                        🚌 {vendor.total_buses} bus{vendor.total_buses !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="vendor-contact">
                    <p><strong>Contact:</strong> {vendor.contact_person}</p>
                    <p>📞 {vendor.contact_phone}</p>
                    <p>✉️ {vendor.contact_email}</p>
                  </div>
                  <button className="toggle-vendor-btn" onClick={(e) => { e.stopPropagation(); toggleVendor(vendor.vendor_id); }}>
                    {expandedVendors.has(vendor.vendor_id) ? '▼' : '▶'}
                  </button>
                </div>

                {/* Buses List - Only show when expanded */}
                {expandedVendors.has(vendor.vendor_id) && vendor.buses && vendor.buses.length > 0 && (
                  <div className="buses-section">
                    <h3 className="buses-title">Available Buses ({vendor.buses.length})</h3>
                    <div className="buses-horizontal-scroll">
                      {vendor.buses.map((bus) => (
                        <div key={bus.bus_id} className="bus-card">
                          {/* Bus Image */}
                          <div className="bus-image">
                            <img
                              src={bus.image_url}
                              alt={`${bus.bus_type} Bus`}
                              onError={(e) => {
                                e.target.src = '/images/buses/default-bus.jpg';
                                e.target.onerror = null;
                              }}
                            />
                            <div className="bus-type-badge">{bus.bus_type}</div>
                          </div>

                          {/* Bus Details */}
                          <div className="bus-details">
                            <h4 className="bus-number">{bus.bus_number}</h4>
                            <div className="bus-info">
                              <span className="seats">
                                💺 {bus.total_seats} seats
                              </span>
                              <span className="year">
                                📅 {bus.registration_year || 'N/A'}
                              </span>
                            </div>

                            {/* Amenities */}
                            {bus.amenities && bus.amenities.length > 0 && (
                              <div className="amenities">
                                {bus.amenities.slice(0, 3).map((amenity, idx) => (
                                  <span key={idx} className="amenity-tag">
                                    {amenity}
                                  </span>
                                ))}
                                {bus.amenities.length > 3 && (
                                  <span className="amenity-tag more">
                                    +{bus.amenities.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Routes Count */}
                            {bus.total_routes > 0 && (
                              <p className="routes-count">
                                🗺️ Available on {bus.total_routes} route{bus.total_routes !== 1 ? 's' : ''}
                              </p>
                            )}

                            {/* Status */}
                            <div className={`status ${bus.is_active ? 'active' : 'inactive'}`}>
                              {bus.is_active ? '✓ Active' : '✗ Inactive'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Buses */}
                {expandedVendors.has(vendor.vendor_id) && (!vendor.buses || vendor.buses.length === 0) && (
                  <div className="no-buses">
                    <p>No buses available at the moment</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => goToPage(pagination.current_page - 1)}
              disabled={!pagination.has_prev || loading}
            >
              ← Previous
            </button>

            <div className="pagination-info">
              <span className="page-numbers">
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and 1 page before and after current
                    return (
                      page === 1 ||
                      page === pagination.total_pages ||
                      Math.abs(page - pagination.current_page) <= 1
                    );
                  })
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {/* Show ellipsis if there's a gap */}
                      {idx > 0 && page - arr[idx - 1] > 1 && (
                        <span className="ellipsis">...</span>
                      )}
                      <button
                        className={`page-btn ${
                          page === pagination.current_page ? 'active' : ''
                        }`}
                        onClick={() => goToPage(page)}
                        disabled={loading}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </span>
              <span className="page-info">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
            </div>

            <button
              className="pagination-btn"
              onClick={() => goToPage(pagination.current_page + 1)}
              disabled={!pagination.has_next || loading}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorList;
