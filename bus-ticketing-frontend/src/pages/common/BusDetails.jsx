import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../css/busSearch.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * BusDetails Component - Shows ALL buses grouped by type
 * Fetches complete bus inventory from database
 * Organized by bus_type with all vendor buses displayed
 */
const BusDetails = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busesByType, setBusesByType] = useState({});
  const [expandedTypes, setExpandedTypes] = useState(new Set());

  useEffect(() => {
    fetchAllBuses();
  }, []);

  const fetchAllBuses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/buses/all-types`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bus details');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setBusesByType(data.data.busesByType || {});
        // Expand all types by default
        setExpandedTypes(new Set(Object.keys(data.data.busesByType || {})));
      } else {
        throw new Error(data.message || 'Failed to fetch buses');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError(err.message || 'Failed to fetch bus details');
      setLoading(false);
    }
  };

  const toggleType = (busType) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(busType)) {
      newExpanded.delete(busType);
    } else {
      newExpanded.add(busType);
    }
    setExpandedTypes(newExpanded);
  };

  const expandAll = () => {
    setExpandedTypes(new Set(Object.keys(busesByType)));
  };

  const collapseAll = () => {
    setExpandedTypes(new Set());
  };

  if (loading) {
    return (
      <div className="page search">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading bus details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page search">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Buses</h3>
          <p>{error}</p>
          <button onClick={fetchAllBuses} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const busTypes = Object.keys(busesByType).sort();
  const totalBuses = Object.values(busesByType).reduce((sum, buses) => sum + buses.length, 0);

  return (
    <div className="page search">
      <div className="search-container">
        {/* Page Header */}
        <div className="bus-details-header">
          <h1 className="search-page-title">All Bus Details</h1>
          <p className="subtitle">
            {busTypes.length} bus types • {totalBuses} total buses available
          </p>
        </div>

        {/* Expand/Collapse Controls */}
        <div className="type-controls">
          <button onClick={expandAll} className="btn-secondary">
            Expand All
          </button>
          <button onClick={collapseAll} className="btn-secondary">
            Collapse All
          </button>
        </div>

        {/* Bus Types List */}
        {busTypes.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🚌</div>
            <h3>No buses found</h3>
            <p>No buses available in the system</p>
          </div>
        ) : (
          <div className="bus-types-sections">
            {busTypes.map((busType) => {
              const buses = busesByType[busType];
              const isExpanded = expandedTypes.has(busType);
              
              return (
                <div key={busType} className="bus-type-section">
                  {/* Type Header */}
                  <div 
                    className="type-header"
                    onClick={() => toggleType(busType)}
                  >
                    <div className="type-info">
                      <h2 className="type-name">{busType}</h2>
                      <span className="type-count">{buses.length} buses</span>
                    </div>
                    <button className="toggle-btn">
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>

                  {/* Buses List for this type */}
                  {isExpanded && (
                    <div className="bus-details-list">
                      {buses.map((bus) => (
                        <div key={`${bus.id}-${bus.departureTime}`} className="bus-detail-card">
                          <div className="bus-card-image">
                            <img
                              src={bus.image}
                              alt={`${bus.busType} bus`}
                              onError={(e) => {
                                e.target.src = '/images/buses/default-bus.jpg';
                                e.target.onerror = null;
                              }}
                            />
                            <div className="bus-type-overlay">{bus.busType}</div>
                          </div>

                          <div className="bus-card-content">
                            {/* Vendor Info */}
                            <div className="bus-vendor-info">
                              <h3 className="vendor-name">{bus.vendor}</h3>
                              <div className="bus-rating">
                                <span className="rating-star">★</span>
                                <span className="rating-value">{bus.rating}</span>
                              </div>
                            </div>

                            <div className="bus-number">{bus.busNumber}</div>

                            {/* Route & Time */}
                            <div className="bus-route-time">
                              <div className="route-info">
                                <span className="city">{bus.from}</span>
                                <span className="arrow">→</span>
                                <span className="city">{bus.to}</span>
                              </div>
                              <div className="time-info">
                                <span className="time">{bus.departureTime}</span>
                                <span className="separator">-</span>
                                <span className="time">{bus.arrivalTime}</span>
                              </div>
                            </div>

                            {/* Amenities */}
                            <div className="bus-amenities">
                              {bus.amenities.map((amenity, idx) => (
                                <span key={idx} className="amenity-badge">{amenity}</span>
                              ))}
                            </div>

                            {/* Seats & Price */}
                            <div className="bus-bottom-info">
                              <div className="seats-info">
                                <span className="seats-label">Available:</span>
                                <span className="seats-count">
                                  {bus.availableSeats}/{bus.seats} seats
                                </span>
                              </div>
                              <div className="price-info">
                                <span className="price">Rs. {bus.fare}</span>
                                <span className="price-label">per seat</span>
                              </div>
                            </div>

                            {/* Book Button */}
                            <Link 
                              to={`/booking?busId=${bus.id}`}
                              className="btn-book"
                            >
                              Book Now →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusDetails;