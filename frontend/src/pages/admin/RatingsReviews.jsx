import React, { useState, useEffect } from 'react';
import '../../css/ratingsReviews.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const RatingsReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: '',
    rating: 'all',
    busNumber: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'recent'
  });

  // Statistics
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0
  });

  // Pagination
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false
  });

  // Remove sample data - now using real API
  // Reviews now loaded from API

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [reviews]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get current user to find vendor_id
      const userResponse = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();
      const vendorId = userData.data?.vendor_id || userData.data?.user_id;

      if (!vendorId) {
        throw new Error('Vendor ID not found');
      }

      // Fetch reviews for this vendor
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      });

      const response = await fetch(`${API_URL}/reviews/vendor/${vendorId}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        const fetchedReviews = data.data.reviews || [];
        
        // Transform data to match component format
        const transformedReviews = fetchedReviews.map(review => ({
          review_id: `REV-${review.id}`,
          booking_id: `BK-${review.booking_id}`,
          user_id: review.user_id,
          anonymous_name: review.reviewer_name || `User #${review.user_id}`,
          bus_number: review.bus_number,
          route: 'N/A', // Can be enhanced if route data is available
          rating: review.overall_rating,
          review_text: review.comment || 'No comment provided',
          travel_date: review.journey_date,
          review_date: review.created_at,
          helpful_count: 0, // Not in current schema
          verified: true,
          cleanliness_rating: review.cleanliness_rating,
          punctuality_rating: review.punctuality_rating,
          driver_behavior_rating: review.driver_behavior_rating,
          comfort_rating: review.comfort_rating,
          safety_rating: review.safety_rating
        }));

        setReviews(transformedReviews);
        
        // Update pagination
        if (data.data.pagination) {
          setPagination({
            limit: data.data.pagination.limit,
            offset: data.data.pagination.offset,
            total: data.data.pagination.total,
            hasMore: data.data.pagination.hasMore
          });
        }

        // Update stats if available
        if (data.data.statistics) {
          const avgRating = data.data.statistics.avg_overall || 0;
          setStats(prev => ({
            ...prev,
            averageRating: parseFloat(avgRating).toFixed(1),
            totalReviews: data.data.statistics.review_count || 0
          }));
        }
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (reviews.length === 0) {
      setStats({
        averageRating: 0,
        totalReviews: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);

    setStats({
      averageRating,
      totalReviews: reviews.length,
      fiveStars: reviews.filter(r => r.rating === 5).length,
      fourStars: reviews.filter(r => r.rating === 4).length,
      threeStars: reviews.filter(r => r.rating === 3).length,
      twoStars: reviews.filter(r => r.rating === 2).length,
      oneStar: reviews.filter(r => r.rating === 1).length
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      rating: 'all',
      busNumber: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'recent'
    });
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(review =>
        review.review_id.toLowerCase().includes(searchLower) ||
        review.review_text.toLowerCase().includes(searchLower) ||
        review.route.toLowerCase().includes(searchLower)
      );
    }

    // Rating filter
    if (filters.rating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(filters.rating));
    }

    // Bus number filter
    if (filters.busNumber) {
      filtered = filtered.filter(review =>
        review.bus_number.toLowerCase().includes(filters.busNumber.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(review => {
        const reviewDate = new Date(review.review_date).toISOString().split('T')[0];
        return reviewDate >= filters.dateFrom;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(review => {
        const reviewDate = new Date(review.review_date).toISOString().split('T')[0];
        return reviewDate <= filters.dateTo;
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.review_date) - new Date(a.review_date));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.review_date) - new Date(b.review_date));
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        filtered.sort((a, b) => b.helpful_count - a.helpful_count);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredReviews = applyFilters();

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : 'empty'}`}>
          {i <= rating ? '★' : '☆'}
        </span>
      );
    }
    return <div className="star-rating">{stars}</div>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingPercentage = (starCount) => {
    if (stats.totalReviews === 0) return 0;
    return ((starCount / stats.totalReviews) * 100).toFixed(0);
  };

  if (loading) {
    return (
      <div className="ratings-reviews">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ratings-reviews">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">⭐ Ratings & Reviews</h1>
          <p className="page-subtitle">Customer feedback and ratings (Anonymous)</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="overview-section">
        <div className="rating-summary">
          <div className="average-rating">
            <div className="rating-number">{stats.averageRating}</div>
            <div className="rating-stars-large">
              {renderStars(Math.round(parseFloat(stats.averageRating)))}
            </div>
            <div className="total-reviews">{stats.totalReviews} Reviews</div>
          </div>

          <div className="rating-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">5 ★</span>
              <div className="breakdown-bar">
                <div className="bar-fill" style={{ width: `${getRatingPercentage(stats.fiveStars)}%` }}></div>
              </div>
              <span className="breakdown-count">{stats.fiveStars}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">4 ★</span>
              <div className="breakdown-bar">
                <div className="bar-fill" style={{ width: `${getRatingPercentage(stats.fourStars)}%` }}></div>
              </div>
              <span className="breakdown-count">{stats.fourStars}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">3 ★</span>
              <div className="breakdown-bar">
                <div className="bar-fill" style={{ width: `${getRatingPercentage(stats.threeStars)}%` }}></div>
              </div>
              <span className="breakdown-count">{stats.threeStars}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">2 ★</span>
              <div className="breakdown-bar">
                <div className="bar-fill" style={{ width: `${getRatingPercentage(stats.twoStars)}%` }}></div>
              </div>
              <span className="breakdown-count">{stats.twoStars}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">1 ★</span>
              <div className="breakdown-bar">
                <div className="bar-fill" style={{ width: `${getRatingPercentage(stats.oneStar)}%` }}></div>
              </div>
              <span className="breakdown-count">{stats.oneStar}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        <div className="filters-header">
          <h3>🔍 Filters</h3>
          <button className="btn-reset" onClick={resetFilters}>Reset All</button>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search reviews, route..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Bus Number</label>
            <input
              type="text"
              placeholder="e.g., BA 2 KHA 1234"
              value={filters.busNumber}
              onChange={(e) => handleFilterChange('busNumber', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="reviews-container">
        <div className="reviews-header">
          <h3>📋 Reviews List</h3>
          <p className="results-count">
            Showing <strong>{filteredReviews.length}</strong> of <strong>{reviews.length}</strong> reviews
          </p>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💭</div>
            <h3>No reviews found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Review ID</th>
                  <th>User</th>
                  <th>Bus & Route</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Travel Date</th>
                  <th>Review Date</th>
                  <th>Helpful</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map(review => (
                  <tr key={review.review_id}>
                    <td className="review-id">{review.review_id}</td>
                    <td className="user-info">
                      <div className="anonymous-badge">🔒</div>
                      <div className="user-name">{review.anonymous_name}</div>
                    </td>
                    <td>
                      <div className="bus-info">
                        <div className="bus-number">{review.bus_number}</div>
                        <div className="route">{review.route}</div>
                      </div>
                    </td>
                    <td className="rating-cell">
                      <div className="rating-value">{review.rating}.0</div>
                      {renderStars(review.rating)}
                    </td>
                    <td className="review-text">
                      <div className="text-content">{review.review_text}</div>
                    </td>
                    <td className="date-info">{review.travel_date}</td>
                    <td className="date-info">{formatDate(review.review_date)}</td>
                    <td className="helpful-count">
                      <span className="helpful-badge">👍 {review.helpful_count}</span>
                    </td>
                    <td className="verified-cell">
                      {review.verified ? (
                        <span className="verified-badge">✓ Verified</span>
                      ) : (
                        <span className="unverified-badge">Unverified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingsReviews;
