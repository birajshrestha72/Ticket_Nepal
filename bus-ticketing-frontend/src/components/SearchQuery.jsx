import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../css/searchQuery.css';

/**
 * SearchQuery Component - Reusable bus search form
 * Used in Landing page and Customer Dashboard
 * Features:
 * - Origin/Destination dropdowns with real cities from API
 * - Date picker with validation
 * - Navigates to Search results page
 */
const SearchQuery = ({ initialData = null, variant = 'default' }) => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search form state - user input values
  const [searchForm, setSearchForm] = useState({
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    date: initialData?.date || new Date()
  });

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  /**
   * Fetch available cities from backend
   * Used to populate origin and destination dropdowns
   */
  const fetchCities = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/routes/cities`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setCities(data.data.cities);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   * Navigate to search results page with query parameters
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Validate that origin and destination are different
    if (searchForm.origin === searchForm.destination) {
      alert('Origin and destination cannot be the same');
      return;
    }
    
    // Build URL query parameters
    const params = new URLSearchParams();
    if (searchForm.origin) params.append('from', searchForm.origin);
    if (searchForm.destination) params.append('to', searchForm.destination);
    if (searchForm.date) {
      const dateObj = new Date(searchForm.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      params.append('date', formattedDate);
    }
    
    // Navigate to search page
    navigate(`/search?${params.toString()}`);
  };

  /**
   * Handle input field changes
   */
  const handleInputChange = (e) => {
    setSearchForm({
      ...searchForm,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Handle date change from DatePicker
   */
  const handleDateChange = (date) => {
    setSearchForm({
      ...searchForm,
      date: date
    });
  };

  return (
    <div className={`search-query-component ${variant}`}>
      <form className="quick-search-form card" onSubmit={handleSearchSubmit}>
        <div className="search-fields">
          {/* Origin dropdown */}
          <div className="search-field">
            <label htmlFor="origin">Kahaa bata (From)</label>
            <select
              id="origin"
              name="origin"
              value={searchForm.origin}
              onChange={handleInputChange}
              required
              className="search-select"
              disabled={loading}
            >
              <option value="">Select origin city</option>
              {cities.map((city) => (
                <option key={`origin-${city}`} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          
          {/* Destination dropdown */}
          <div className="search-field">
            <label htmlFor="destination">Kahaa jaane (To)</label>
            <select
              id="destination"
              name="destination"
              value={searchForm.destination}
              onChange={handleInputChange}
              required
              className="search-select"
              disabled={loading}
            >
              <option value="">Select destination city</option>
              {cities.map((city) => (
                <option key={`dest-${city}`} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date picker */}
          <div className="search-field">
            <label htmlFor="date">Yatra Miti (Journey Date)</label>
            <DatePicker
              selected={searchForm.date}
              onChange={handleDateChange}
              minDate={new Date()}
              dateFormat="yyyy-MM-dd"
              className="date-picker-input"
              placeholderText="Select travel date"
              required
              disabled={loading}
            />
          </div>
        </div>
        
        {/* Submit button */}
        <button 
          type="submit" 
          className="btn btn-primary btn-search"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Bus Khojnuhos (Search Buses)'}
        </button>
      </form>
    </div>
  );
};

export default SearchQuery;
