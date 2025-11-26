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

  // Sample reviews data (replace with API call)
  const sampleReviews = [
    {
      review_id: 'REV-001',
      booking_id: 'BK-001',
      user_id: 'USER-123',
      anonymous_name: 'User #1234',
      bus_number: 'BA 2 KHA 1234',
      route: 'Kathmandu → Pokhara',
      rating: 5,
      review_text: 'Excellent service! The bus was clean, comfortable, and arrived on time. The driver was professional and the staff was courteous. Highly recommend!',
      travel_date: '2025-11-20',
      review_date: '2025-11-21T10:30:00',
      helpful_count: 12,
      verified: true
    },
    {
      review_id: 'REV-002',
      booking_id: 'BK-002',
      user_id: 'USER-456',
      anonymous_name: 'User #4567',
      bus_number: 'BA 2 KHA 5678',
      route: 'Pokhara → Chitwan',
      rating: 4,
      review_text: 'Good experience overall. The bus was comfortable but the AC was not working properly. Everything else was fine.',
      travel_date: '2025-11-19',
      review_date: '2025-11-20T14:15:00',
      helpful_count: 8,
      verified: true
    },
    {
      review_id: 'REV-003',
      booking_id: 'BK-003',
      user_id: 'USER-789',
      anonymous_name: 'User #7890',
      bus_number: 'BA 2 KHA 1234',
      route: 'Kathmandu → Butwal',
      rating: 5,
      review_text: 'Perfect journey! Spacious seats, clean restroom, and entertainment system worked great. Will book again.',
      travel_date: '2025-11-18',
      review_date: '2025-11-19T09:20:00',
      helpful_count: 15,
      verified: true
    },
    {
      review_id: 'REV-004',
      booking_id: 'BK-004',
      user_id: 'USER-234',
      anonymous_name: 'User #2345',
      bus_number: 'BA 2 KHA 5678',
      route: 'Dharan → Kathmandu',
      rating: 3,
      review_text: 'Average experience. The bus was okay but we had to wait 30 minutes for departure. Driver was polite though.',
      travel_date: '2025-11-17',
      review_date: '2025-11-18T16:45:00',
      helpful_count: 5,
      verified: true
    },
    {
      review_id: 'REV-005',
      booking_id: 'BK-005',
      user_id: 'USER-567',
      anonymous_name: 'User #5678',
      bus_number: 'BA 2 KHA 1234',
      route: 'Pokhara → Kathmandu',
      rating: 4,
      review_text: 'Comfortable seats and smooth ride. Only complaint is that the charging ports were not working.',
      travel_date: '2025-11-16',
      review_date: '2025-11-17T11:30:00',
      helpful_count: 7,
      verified: true
    },
    {
      review_id: 'REV-006',
      booking_id: 'BK-006',
      user_id: 'USER-890',
      anonymous_name: 'User #8901',
      bus_number: 'BA 2 KHA 5678',
      route: 'Kathmandu → Nepalgunj',
      rating: 2,
      review_text: 'Not satisfied. Bus was delayed by 1 hour and the seats were not as comfortable as advertised.',
      travel_date: '2025-11-15',
      review_date: '2025-11-16T08:15:00',
      helpful_count: 3,
      verified: false
    },
    {
      review_id: 'REV-007',
      booking_id: 'BK-007',
      user_id: 'USER-345',
      anonymous_name: 'User #3456',
      bus_number: 'BA 2 KHA 1234',
      route: 'Chitwan → Kathmandu',
      rating: 5,
      review_text: 'Amazing service! Professional driver, clean bus, and on-time departure. Best bus service I have used.',
      travel_date: '2025-11-14',
      review_date: '2025-11-15T13:00:00',
      helpful_count: 20,
      verified: true
    },
    {
      review_id: 'REV-008',
      booking_id: 'BK-008',
      user_id: 'USER-678',
      anonymous_name: 'User #6789',
      bus_number: 'BA 2 KHA 5678',
      route: 'Kathmandu → Biratnagar',
      rating: 4,
      review_text: 'Good service. Bus was clean and staff was helpful. Would have given 5 stars if the WiFi was working.',
      travel_date: '2025-11-13',
      review_date: '2025-11-14T10:45:00',
      helpful_count: 6,
      verified: true
    }
  ];

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [reviews]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // In production, replace with actual API call
      // const token = localStorage.getItem('token');
      // const response = await fetch(`${API_URL}/reviews/vendor`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setReviews(data.data?.reviews || []);
      
      // Simulated API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setReviews(sampleReviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
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
