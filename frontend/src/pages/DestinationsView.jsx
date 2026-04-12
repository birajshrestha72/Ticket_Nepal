import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../css/destinations.css'
import chitwanImage from '../assets/chitwan.png'
import lumbiniImage from '../assets/lumbini.png'
import muktinathImage from '../assets/muktinath.png'
import pokharaImage from '../assets/pokhara.png'
import raraImage from '../assets/rara.png'
import langtangImage from '../assets/lantang.png'

const Destinations = () => {
  const allDestinations = [
    {
      id: 1,
      name: 'Muktinath Temple',
      district: 'Mustang',
      province: 'Gandaki',
      category: 'Religious Site',
      travel_time: '6 hours',
      altitude: 3710,
      ideal_stay: '2-3 days',
      estimated_budget: 'NPR 8,000-15,000',
      best_for: 'Pilgrimage, mountain scenery',
      description: 'Sacred site for Hindu and Buddhist pilgrims.',
      highlights: ['108 water spouts', 'Jwala Mai Temple', 'Himalayan views'],
      best_season: 'March-May, September-November',
      image: muktinathImage,
    },
    {
      id: 2,
      name: 'Chitwan National Park',
      district: 'Chitwan',
      province: 'Bagmati',
      category: 'National Park',
      travel_time: '5 hours',
      altitude: 150,
      ideal_stay: '2-4 days',
      estimated_budget: 'NPR 6,000-12,000',
      best_for: 'Wildlife safari, family trips',
      description: 'UNESCO world heritage wildlife destination.',
      highlights: ['Rhinos', 'Tigers', 'Canoe rides'],
      best_season: 'October-March',
      image: chitwanImage,
    },
    {
      id: 3,
      name: 'Pokhara Valley',
      district: 'Kaski',
      province: 'Gandaki',
      category: 'City',
      travel_time: '6-7 hours',
      altitude: 827,
      ideal_stay: '3-5 days',
      estimated_budget: 'NPR 7,000-18,000',
      best_for: 'Adventure, lakeside leisure',
      description: 'Lake city and gateway to the Annapurna region.',
      highlights: ['Phewa Lake', 'Sarangkot', 'Adventure sports'],
      best_season: 'September-November, March-May',
      image: pokharaImage,
    },
    {
      id: 4,
      name: 'Lumbini',
      district: 'Rupandehi',
      province: 'Lumbini',
      category: 'Religious Site',
      travel_time: '8 hours',
      altitude: 150,
      ideal_stay: '1-2 days',
      estimated_budget: 'NPR 4,000-9,000',
      best_for: 'Spiritual tour, heritage visit',
      description: 'Birthplace of Lord Buddha.',
      highlights: ['Maya Devi Temple', 'Ashoka Pillar', 'International monasteries'],
      best_season: 'October-March',
      image: lumbiniImage,
    },
    {
      id: 5,
      name: 'Rara Lake',
      district: 'Mugu',
      province: 'Karnali',
      category: 'Natural Lake',
      travel_time: '2 days',
      altitude: 2990,
      ideal_stay: '3-4 days',
      estimated_budget: 'NPR 15,000-28,000',
      best_for: 'Nature escape, remote travel',
      description: 'Largest lake in Nepal with pristine alpine scenery.',
      highlights: ['Clear water', 'Forest trails', 'Peaceful setting'],
      best_season: 'April-November',
      image: raraImage,
    },
    {
      id: 6,
      name: 'Langtang Valley',
      district: 'Rasuwa',
      province: 'Bagmati',
      category: 'Trekking Region',
      travel_time: '7-8 hours',
      altitude: 3430,
      ideal_stay: '5-7 days',
      estimated_budget: 'NPR 12,000-25,000',
      best_for: 'Short trek, mountain culture',
      description: 'Close trekking destination near Kathmandu.',
      highlights: ['Mountain views', 'Monasteries', 'Local culture'],
      best_season: 'March-May, September-November',
      image: langtangImage,
    },
  ]

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedProvince, setSelectedProvince] = useState('All')
  const [sortBy, setSortBy] = useState('name')

  const categoryOptions = ['All', ...new Set(allDestinations.map((dest) => dest.category))]
  const provinceOptions = ['All', ...new Set(allDestinations.map((dest) => dest.province))]

  const filteredDestinations = allDestinations
    .filter((dest) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = dest.name.toLowerCase().includes(q) || dest.district.toLowerCase().includes(q) || dest.description.toLowerCase().includes(q)
      const matchesCategory = selectedCategory === 'All' || dest.category === selectedCategory
      const matchesProvince = selectedProvince === 'All' || dest.province === selectedProvince
      return matchesSearch && matchesCategory && matchesProvince
    })
    .sort((a, b) => {
      if (sortBy === 'altitude-high') {
        return b.altitude - a.altitude
      }
      if (sortBy === 'altitude-low') {
        return a.altitude - b.altitude
      }
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="destinations-page">
      <div className="container">
        <div className="destinations-hero">
          <h1 className="hero-title">Explore Nepal</h1>
          <p className="hero-subtitle">Discover spectacular travel destinations across Nepal</p>
          <div className="hero-stats">
            <span>{allDestinations.length} curated destinations</span>
            <span>Theme: cultural + nature + adventure</span>
          </div>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="quick-filters">
            <div className="filter-group">
              <span className="filter-label">Category</span>
              <div className="chip-list">
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Province</span>
              <div className="chip-list">
                {provinceOptions.map((province) => (
                  <button
                    key={province}
                    type="button"
                    className={`filter-chip ${selectedProvince === province ? 'active' : ''}`}
                    onClick={() => setSelectedProvince(province)}
                  >
                    {province}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label htmlFor="sort-destination" className="filter-label">Sort By</label>
              <select
                id="sort-destination"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name (A-Z)</option>
                <option value="altitude-high">Altitude (High to Low)</option>
                <option value="altitude-low">Altitude (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="results-count">
          <p>Showing <strong>{filteredDestinations.length}</strong> destination{filteredDestinations.length === 1 ? '' : 's'}</p>
        </div>

        {filteredDestinations.length === 0 ? (
          <div className="no-results"><h3>No destinations found</h3><p>Try adjusting your search</p></div>
        ) : (
          <div className="destinations-grid">
            {filteredDestinations.map((destination) => (
              <div key={destination.id} className="destination-card">
                <div className="destination-image">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    onError={(e) => {
                      e.currentTarget.src = pokharaImage
                      e.currentTarget.onerror = null
                    }}
                  />
                  <div className="category-badge">{destination.category}</div>
                  <div className="destination-overlay-meta">
                    <span>{destination.district}</span>
                    <span>{destination.travel_time}</span>
                  </div>
                </div>

                <div className="destination-content">
                  <h2 className="destination-name">{destination.name}</h2>
                  <div className="destination-location"><span>{destination.district}, {destination.province}</span></div>
                  <p className="destination-description">{destination.description}</p>

                  <div className="info-grid">
                    <div className="info-item"><small>Altitude</small><strong>{destination.altitude.toLocaleString()}m</strong></div>
                    <div className="info-item"><small>Travel Time</small><strong>{destination.travel_time}</strong></div>
                  </div>

                  <div className="best-season"><small>Best Season</small><p>{destination.best_season}</p></div>

                  <div className="trip-snapshot">
                    <h4>Trip Snapshot</h4>
                    <div className="snapshot-grid">
                      <div><small>Ideal Stay</small><p>{destination.ideal_stay}</p></div>
                      <div><small>Budget</small><p>{destination.estimated_budget}</p></div>
                    </div>
                    <p className="best-for"><strong>Best For:</strong> {destination.best_for}</p>
                  </div>

                  <div className="destination-details">
                    <h4>Destination Details</h4>
                    <div className="details-grid">
                      <div><small>District</small><p>{destination.district}</p></div>
                      <div><small>Province</small><p>{destination.province}</p></div>
                      <div><small>Altitude</small><p>{destination.altitude.toLocaleString()}m</p></div>
                      <div><small>Travel Time</small><p>{destination.travel_time}</p></div>
                    </div>
                  </div>

                  <div className="highlights">
                    <h4>Highlights</h4>
                    <ul>{destination.highlights.slice(0, 4).map((highlight) => <li key={`${destination.id}-${highlight}`}>{highlight}</li>)}</ul>
                  </div>

                  <Link to={`/search?destination=${encodeURIComponent(destination.name)}`} className="btn-explore">Find Buses</Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cta-section">
          <h2>Ready to Start Your Journey?</h2>
          <p>Book your bus tickets and explore Nepal</p>
          <Link to="/search" className="btn-cta">Search Bus Routes</Link>
        </div>
      </div>
    </div>
  )
}

export default Destinations
