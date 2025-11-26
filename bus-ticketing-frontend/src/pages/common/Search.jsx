import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../css/busSearch.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Search Component - Displays unique bus types across all vendors
 * Receives search params from Landing page (origin, destination, date)
 * Allows users to modify search criteria and re-search
 * Fetches dynamic data from backend database
 * Groups buses by type to avoid duplicates
 * Each bus type card shows all vendors offering that type
 */
const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busTypes, setBusTypes] = useState([]); // Unique bus types with vendor info
  const [allVendors, setAllVendors] = useState([]); // List of vendors for filter
  
  // Main search criteria from Landing page
  const [searchCriteria, setSearchCriteria] = useState({
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    date: searchParams.get('date') ? new Date(searchParams.get('date')) : new Date()
  });
  
  // Additional filters
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    selectedVendor: ''
  });

  // Cities list for dropdowns (matches Landing page)
  const cities = [
    'Bardiya', 'Bharatpur', 'Bhairahawa', 'Biratnagar', 'Birgunj', 'Butwal',
    'Chitwan', 'Damak', 'Dhangadhi', 'Dhanusha', 'Dharan', 'Dolpa',
    'Ghorahi', 'Hetauda', 'Itahari', 'Janakpur', 'Kaski', 'Kathmandu',
    'Lumbini', 'Manang', 'Mugu', 'Mustang', 'Nepalgunj', 'Pokhara',
    'Rasuwa', 'Rupandehi', 'Solukhumbu', 'Tulsipur'
  ].sort();

  // Fetch data when component mounts or search criteria changes
  useEffect(() => {
    if (searchCriteria.from && searchCriteria.to) {
      fetchBusData();
    }
  }, [searchCriteria]);

  const fetchBusData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters for schedules API
      const queryParams = new URLSearchParams();
      if (searchCriteria.from) queryParams.append('origin', searchCriteria.from);
      if (searchCriteria.to) queryParams.append('destination', searchCriteria.to);
      if (searchCriteria.date) {
        const formattedDate = searchCriteria.date.toISOString().split('T')[0];
        queryParams.append('journey_date', formattedDate);
      }
      
      // Fetch schedules from backend API
      const response = await fetch(`${API_URL}/schedules/available?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bus schedules');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        const schedules = data.data.schedules || [];
        
        // Process schedules to group by bus type
        const processBusData = (schedules) => {
          // Group by unique bus type
          const typeMap = new Map();
          
          schedules.forEach(schedule => {
            const busType = schedule.bus.bus_type;
            
            if (!typeMap.has(busType)) {
              typeMap.set(busType, {
                busType: busType,
                vendors: [],
                schedules: [],
                minFare: schedule.price,
                maxFare: schedule.price,
                totalSeats: 0,
                availableSeats: 0
              });
            }
            
            const typeData = typeMap.get(busType);
            
            // Add vendor if not already added
            if (!typeData.vendors.find(v => v.id === schedule.vendor.vendor_id)) {
              typeData.vendors.push({
                id: schedule.vendor.vendor_id,
                name: schedule.vendor.name,
                rating: schedule.vendor.rating
              });
            }
            
            // Filter by vendor if selected
            if (filters.selectedVendor && schedule.vendor.name !== filters.selectedVendor) {
              return;
            }
            
            // Filter by price range
            if (filters.minPrice && schedule.price < parseFloat(filters.minPrice)) {
              return;
            }
            if (filters.maxPrice && schedule.price > parseFloat(filters.maxPrice)) {
              return;
            }
            
            // Add schedule to the type
            typeData.schedules.push(schedule);
            
            // Update fare range
            typeData.minFare = Math.min(typeData.minFare, schedule.price);
            typeData.maxFare = Math.max(typeData.maxFare, schedule.price);
            
            // Update seat counts
            typeData.totalSeats += schedule.bus.total_seats;
            typeData.availableSeats += schedule.bus.available_seats;
          });

          // Convert map to array and filter out empty types, then sort
          return Array.from(typeMap.values())
            .filter(type => type.schedules.length > 0)
            .sort((a, b) => a.busType.localeCompare(b.busType));
        };

        // Extract unique vendors from schedules
        const extractVendors = (schedules) => {
          const vendorMap = new Map();
          schedules.forEach(schedule => {
            const vendorId = schedule.vendor.vendor_id;
            if (!vendorMap.has(vendorId)) {
              vendorMap.set(vendorId, {
                id: vendorId,
                name: schedule.vendor.name,
                rating: schedule.vendor.rating
              });
            }
          });
          return Array.from(vendorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        };

        // Process and set data
        const processedTypes = processBusData(schedules);
        const vendors = extractVendors(schedules);
        
        setBusTypes(processedTypes);
        setAllVendors(vendors);
      } else {
        throw new Error(data.message || 'Failed to fetch bus schedules');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bus data:', err);
      setError(err.message || 'Failed to fetch bus schedules. Please try again.');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearchCriteriaChange = (e) => {
    setSearchCriteria({
      ...searchCriteria,
      [e.target.name]: e.target.value
    });
  };

  const handleDateChange = (date) => {
    setSearchCriteria({
      ...searchCriteria,
      date: date
    });
  };

  const swapLocations = () => {
    setSearchCriteria({
      ...searchCriteria,
      from: searchCriteria.to,
      to: searchCriteria.from
    });
  };

  const handleMainSearch = (e) => {
    e.preventDefault();
    fetchBusData();
  };

  const handleFilterSearch = (e) => {
    e.preventDefault();
    fetchBusData();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBusData();
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      selectedVendor: ''
    });
    fetchBusData();
  };

  const clearAllFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      selectedVendor: ''
    });
    setSearchCriteria({
      from: '',
      to: '',
      date: new Date()
    });
  };

  if (loading) {
    return (
      <div className="page search">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Searching buses...</p>
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
          <button onClick={fetchBusData} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page search">
      <div className="search-container">
        <h1 className="search-page-title">Find Your Bus</h1>
        
        {/* Main Search Form - From Landing Page */}
        <form className="main-search-form" onSubmit={handleMainSearch}>
          <div className="main-search-fields">
            <div className="search-field">
              <label htmlFor="from">Kahaa bata (From)</label>
              <select
                id="from"
                name="from"
                value={searchCriteria.from}
                onChange={handleSearchCriteriaChange}
                required
                className="search-select"
              >
                <option value="">Select origin city</option>
                {cities.map((city) => (
                  <option key={`from-${city}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="button" 
              className="swap-btn" 
              onClick={swapLocations}
              title="Swap locations"
            >
              ⇄
            </button>
            
            <div className="search-field">
              <label htmlFor="to">Kahaa jaane (To)</label>
              <select
                id="to"
                name="to"
                value={searchCriteria.to}
                onChange={handleSearchCriteriaChange}
                required
                className="search-select"
              >
                <option value="">Select destination city</option>
                {cities.map((city) => (
                  <option key={`to-${city}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="search-field">
              <label htmlFor="date">Yatra Miti (Journey Date)</label>
              <DatePicker
                selected={searchCriteria.date}
                onChange={handleDateChange}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="date-picker-input"
                placeholderText="Select travel date"
                required
              />
            </div>

            <button type="submit" className="btn-main-search">
              🔍 Search Buses
            </button>
          </div>

          {/* Display current search criteria */}
          {searchCriteria.from && searchCriteria.to && (
            <div className="search-summary">
              <p>
                Showing buses from <strong>{searchCriteria.from}</strong> to{' '}
                <strong>{searchCriteria.to}</strong> on{' '}
                <strong>{searchCriteria.date.toLocaleDateString('en-GB')}</strong>
              </p>
            </div>
          )}
        </form>

        {/* Additional Filters */}
        <form className="additional-filters" onSubmit={handleFilterSearch}>
          <h3 className="filters-title">Refine Your Search</h3>
          <div className="filter-row">
            <div className="filter-field">
              <label htmlFor="selectedVendor">Vendor</label>
              <select
                id="selectedVendor"
                name="selectedVendor"
                value={filters.selectedVendor}
                onChange={handleFilterChange}
              >
                <option value="">All Vendors</option>
                {allVendors.map(vendor => (
                  <option key={vendor.id} value={vendor.name}>
                    {vendor.name} (★ {vendor.rating})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-field">
              <label htmlFor="minPrice">Min Price (Rs.)</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                placeholder="Min"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="filter-field">
              <label htmlFor="maxPrice">Max Price (Rs.)</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>
            
            <button type="submit" className="btn-filter">
              Apply Filters
            </button>
            
            <button type="button" onClick={clearAllFilters} className="btn-clear">
              Clear Filters
            </button>
          </div>
        </form>

        {/* Results Summary */}
        <div className="results-summary">
          <h2>Available Bus Types</h2>
          <p>Found {busTypes.length} unique bus type{busTypes.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Bus Types Grid - No duplicates */}
        {busTypes.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🚌</div>
            <h3>No buses found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="bus-types-grid">
            {busTypes.map((typeData, index) => (
              <div key={index} className="bus-type-card">
                <div className="bus-type-header">
                  <h3 className="bus-type-name">{typeData.busType}</h3>
                  <div className="bus-count-badge">{typeData.schedules.length} available</div>
                </div>

                {/* Vendors offering this type */}
                <div className="vendors-list">
                  <span className="vendors-label">Available from:</span>
                  <div className="vendor-tags">
                    {typeData.vendors.map(vendor => (
                      <span key={vendor.id} className="vendor-tag">
                        {vendor.name}
                        <span className="vendor-rating">★ {vendor.rating.toFixed(1)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="price-range">
                  <span className="price-label">Price Range:</span>
                  <span className="price-value">
                    Rs. {typeData.minFare.toLocaleString()}
                    {typeData.minFare !== typeData.maxFare && ` - Rs. ${typeData.maxFare.toLocaleString()}`}
                  </span>
                </div>

                {/* Seat Availability */}
                <div className="seat-info">
                  <span className="seats-available">
                    {typeData.availableSeats} seats available
                  </span>
                  <span className="seats-total">
                    of {typeData.totalSeats} total
                  </span>
                </div>

                {/* Common Amenities */}
                {typeData.schedules[0]?.bus?.amenities && typeData.schedules[0].bus.amenities.length > 0 && (
                  <div className="amenities-preview">
                    {typeData.schedules[0].bus.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="amenity-tag">{amenity}</span>
                    ))}
                    {typeData.schedules[0].bus.amenities.length > 3 && (
                      <span className="amenity-more">+{typeData.schedules[0].bus.amenities.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Quick Schedule List */}
                <div className="quick-bus-list">
                  {typeData.schedules.slice(0, 2).map(schedule => (
                    <div key={schedule.schedule_id} className="quick-bus-item">
                      <div className="quick-bus-info">
                        <span className="bus-vendor">{schedule.vendor.name}</span>
                        <span className="bus-time">{schedule.departure_time} - {schedule.arrival_time}</span>
                      </div>
                      <div className="quick-bus-price">Rs. {schedule.price.toLocaleString()}</div>
                    </div>
                  ))}
                  {typeData.schedules.length > 2 && (
                    <div className="more-buses-hint">
                      +{typeData.schedules.length - 2} more schedules
                    </div>
                  )}
                </div>

                {/* Select Bus Button */}
                <Link 
                  to="/booking"
                  state={{ 
                    schedules: typeData.schedules,
                    searchCriteria: {
                      from: searchCriteria.from,
                      to: searchCriteria.to,
                      date: searchCriteria.date.toISOString().split('T')[0]
                    }
                  }}
                  className="btn-view-details"
                >
                  Select from {typeData.schedules.length} {typeData.schedules.length === 1 ? 'Bus' : 'Buses'} →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
