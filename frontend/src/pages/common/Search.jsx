import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../css/busSearch.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Search Component - Displays individual buses with full details
 * Shows: departure time, bus registration number, price, available seats, amenities
 * User can select a specific bus to proceed to seat selection
 * @param {boolean} embedded - If true, component is embedded in another page (like CustomerDashboard)
 */
const Search = ({ embedded = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buses, setBuses] = useState([]); // Individual bus schedules
  const [allVendors, setAllVendors] = useState([]);
  const [cities, setCities] = useState([]); // Dynamic cities from API
  const [busTypes, setBusTypes] = useState([]); // Dynamic bus types from schedules
  
  // Main search criteria
  const [searchCriteria, setSearchCriteria] = useState({
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    date: (() => {
      const dateParam = searchParams.get('date');
      if (dateParam) {
        const parsedDate = new Date(dateParam);
        return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      }
      return new Date();
    })()
  });
  
  // Additional filters
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    selectedVendor: '',
    busType: ''
  });

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await fetch(`${API_URL}/routes/cities`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setCities(data.data.cities || []);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      // Fallback to default cities if API fails
      setCities([
        'Bardiya', 'Bharatpur', 'Bhairahawa', 'Biratnagar', 'Birgunj', 'Butwal',
        'Chitwan', 'Damak', 'Dhangadhi', 'Dhanusha', 'Dharan', 'Dolpa',
        'Ghorahi', 'Hetauda', 'Itahari', 'Janakpur', 'Kaski', 'Kathmandu',
        'Lumbini', 'Manang', 'Mugu', 'Mustang', 'Nepalgunj', 'Pokhara',
        'Rasuwa', 'Rupandehi', 'Solukhumbu', 'Tulsipur'
      ].sort());
    }
  };

  useEffect(() => {
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const dateParam = searchParams.get('date');
    
    let date = new Date();
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      date = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    
    setSearchCriteria({ from, to, date });
    
    if (from && to) {
      fetchBusData();
    }
  }, [searchParams]);

  const fetchBusData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const from = searchParams.get('from') || searchCriteria.from;
      const to = searchParams.get('to') || searchCriteria.to;
      const dateParam = searchParams.get('date');
      
      const queryParams = new URLSearchParams();
      if (from) queryParams.append('origin', from);
      if (to) queryParams.append('destination', to);
      
      if (dateParam) {
        queryParams.append('journey_date', dateParam);
      } else if (searchCriteria.date) {
        const formattedDate = searchCriteria.date.toISOString().split('T')[0];
        queryParams.append('journey_date', formattedDate);
      }
      
      const response = await fetch(`${API_URL}/schedules/available?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bus schedules');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        let schedules = data.data.schedules || [];
        
        // Apply filters
        if (filters.selectedVendor) {
          schedules = schedules.filter(s => s.vendor.name === filters.selectedVendor);
        }
        if (filters.busType) {
          schedules = schedules.filter(s => s.bus.bus_type === filters.busType);
        }
        if (filters.minPrice) {
          schedules = schedules.filter(s => s.price >= parseFloat(filters.minPrice));
        }
        if (filters.maxPrice) {
          schedules = schedules.filter(s => s.price <= parseFloat(filters.maxPrice));
        }
        
        // Sort by departure time
        schedules.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
        
        setBuses(schedules);
        
        // Extract unique vendors
        const vendorMap = new Map();
        (data.data.schedules || []).forEach(schedule => {
          const vendorId = schedule.vendor.vendor_id;
          if (!vendorMap.has(vendorId)) {
            vendorMap.set(vendorId, {
              id: vendorId,
              name: schedule.vendor.name,
              rating: schedule.vendor.rating
            });
          }
        });
        setAllVendors(Array.from(vendorMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
        
        // Extract unique bus types dynamically
        const busTypeSet = new Set();
        (data.data.schedules || []).forEach(schedule => {
          if (schedule.bus.bus_type) {
            busTypeSet.add(schedule.bus.bus_type);
          }
        });
        setBusTypes(Array.from(busTypeSet).sort());
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
    
    const params = new URLSearchParams();
    if (searchCriteria.from) params.append('from', searchCriteria.from);
    if (searchCriteria.to) params.append('to', searchCriteria.to);
    if (searchCriteria.date) {
      const formattedDate = searchCriteria.date.toISOString().split('T')[0];
      params.append('date', formattedDate);
    }
    setSearchParams(params);
    
    fetchBusData();
  };

  const handleFilterSearch = (e) => {
    e.preventDefault();
    fetchBusData();
  };

  const clearAllFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      selectedVendor: '',
      busType: ''
    });
  };

  const handleSelectBus = (schedule) => {
    navigate('/booking', {
      state: {
        selectedSchedule: schedule,
        searchCriteria: {
          from: searchCriteria.from,
          to: searchCriteria.to,
          date: searchCriteria.date.toISOString().split('T')[0]
        }
      }
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
        
        {/* Main Search Form */}
        <form className="main-search-form" onSubmit={handleMainSearch}>
          <div className="main-search-fields">
            <div className="search-field">
              <label htmlFor="from">From</label>
              <select
                id="from"
                name="from"
                value={searchCriteria.from}
                onChange={handleSearchCriteriaChange}
                required
                className="search-select"
              >
                <option value="">Select origin</option>
                {cities.map((city) => (
                  <option key={`from-${city}`} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <button type="button" className="swap-btn" onClick={swapLocations} title="Swap locations">⇄</button>
            
            <div className="search-field">
              <label htmlFor="to">To</label>
              <select
                id="to"
                name="to"
                value={searchCriteria.to}
                onChange={handleSearchCriteriaChange}
                required
                className="search-select"
              >
                <option value="">Select destination</option>
                {cities.map((city) => (
                  <option key={`to-${city}`} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div className="search-field">
              <label htmlFor="date">Journey Date</label>
              <DatePicker
                selected={searchCriteria.date}
                onChange={handleDateChange}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="date-picker-input"
                placeholderText="Select date"
                required
              />
            </div>

            <button type="submit" className="btn-main-search">🔍 Search</button>
          </div>

          {searchCriteria.from && searchCriteria.to && (
            <div className="search-summary">
              <p>
                <strong>{searchCriteria.from}</strong> → <strong>{searchCriteria.to}</strong> on{' '}
                <strong>{searchCriteria.date.toLocaleDateString('en-GB')}</strong>
              </p>
            </div>
          )}
        </form>

        {/* Filters */}
        <form className="additional-filters" onSubmit={handleFilterSearch}>
          <h3 className="filters-title">Filters</h3>
          <div className="filter-row">
            <div className="filter-field">
              <label htmlFor="busType">Bus Type</label>
              <select id="busType" name="busType" value={filters.busType} onChange={handleFilterChange}>
                <option value="">All Types</option>
                {busTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="selectedVendor">Vendor</label>
              <select id="selectedVendor" name="selectedVendor" value={filters.selectedVendor} onChange={handleFilterChange}>
                <option value="">All Vendors</option>
                {allVendors.map(vendor => (
                  <option key={vendor.id} value={vendor.name}>
                    {vendor.name} (★ {vendor.rating.toFixed(1)})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-field">
              <label htmlFor="minPrice">Min Price (Rs.)</label>
              <input type="number" id="minPrice" name="minPrice" placeholder="Min" value={filters.minPrice} onChange={handleFilterChange} />
            </div>
            
            <div className="filter-field">
              <label htmlFor="maxPrice">Max Price (Rs.)</label>
              <input type="number" id="maxPrice" name="maxPrice" placeholder="Max" value={filters.maxPrice} onChange={handleFilterChange} />
            </div>
            
            <button type="submit" className="btn-filter">Apply</button>
            <button type="button" onClick={clearAllFilters} className="btn-clear">Clear</button>
          </div>
        </form>

        {/* Results */}
        <div className="results-summary">
          <h2>Available Buses</h2>
          <p>Found {buses.length} bus{buses.length !== 1 ? 'es' : ''}</p>
        </div>

        {buses.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🚌</div>
            <h3>No buses found</h3>
            <p>Try different dates or filters</p>
          </div>
        ) : (
          <div className="bus-list">
            {buses.map((schedule) => (
              <div key={schedule.schedule_id} className="bus-card">
                <div className="bus-card-header">
                  <div className="bus-main-info">
                    <h3 className="bus-reg-number">{schedule.bus.bus_number}</h3>
                    <span className="bus-type-badge">{schedule.bus.bus_type}</span>
                  </div>
                  <div className="vendor-info">
                    <span className="vendor-name">{schedule.vendor.name}</span>
                    <span className="vendor-rating">★ {schedule.vendor.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="bus-card-body">
                  <div className="bus-route-time">
                    <div className="time-info">
                      <span className="time-label">Departure</span>
                      <span className="time-value">{schedule.departure_time}</span>
                      <span className="location">{schedule.route.origin}</span>
                    </div>
                    <div className="route-arrow">→</div>
                    <div className="time-info">
                      <span className="time-label">Arrival</span>
                      <span className="time-value">{schedule.arrival_time}</span>
                      <span className="location">{schedule.route.destination}</span>
                    </div>
                  </div>

                  <div className="bus-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">💺 Total Seats</span>
                      <span className="detail-value">{schedule.bus.total_seats}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">✅ Available</span>
                      <span className="detail-value available-seats">{schedule.bus.available_seats}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">💰 Fare</span>
                      <span className="detail-value price">Rs. {schedule.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {schedule.bus.amenities && schedule.bus.amenities.length > 0 && (
                    <div className="bus-amenities">
                      <span className="amenities-label">Features:</span>
                      <div className="amenities-list">
                        {schedule.bus.amenities.map((amenity, idx) => (
                          <span key={idx} className="amenity-item">
                            {amenity === 'AC' && '❄️'}
                            {amenity === 'WiFi' && '📶'}
                            {amenity === 'Charging' && '🔌'}
                            {amenity === 'TV' && '📺'}
                            {amenity === 'Blanket' && '🛏️'}
                            {amenity === 'Water' && '💧'}
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bus-card-footer">
                  <button 
                    className="btn-select-bus"
                    onClick={() => handleSelectBus(schedule)}
                    disabled={schedule.bus.available_seats === 0}
                  >
                    {schedule.bus.available_seats === 0 ? 'Sold Out' : 'Select Seats →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
