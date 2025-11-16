import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../css/destinations.css';

/**
 * Destinations Component
 * Displays popular tourist destinations in Nepal with detailed information
 */
const Destinations = () => {
  // All destinations data
  const allDestinations = [
    {
      id: 1,
      name: 'Muktinath Temple',
      district: 'Mustang',
      province: 'Gandaki Pradesh',
      category: 'Religious Site',
      distance_from_pokhara: 120,
      travel_time: '6 hours',
      altitude: 3710,
      description: 'Sacred pilgrimage site for both Hindus and Buddhists. The temple is located at the foot of Thorong La mountain pass and is one of the 108 Divya Desam shrines. The site features 108 water spouts and eternal flame.',
      highlights: [
        '108 water spouts (Muktidhara)',
        'Jwala Mai Temple with eternal flame',
        'Panoramic Himalayan views',
        'Sacred for Hindu and Buddhist pilgrims'
      ],
      best_season: 'March to May, September to November',
      image: '/images/destinations/muktinath.jpg'
    },
    {
      id: 2,
      name: 'Chitwan National Park',
      district: 'Chitwan',
      province: 'Bagmati Pradesh',
      category: 'National Park',
      distance_from_kathmandu: 146,
      travel_time: '5 hours',
      altitude: 150,
      description: 'First national park in Nepal, established in 1973. UNESCO World Heritage Site known for its rich biodiversity including Bengal tigers, one-horned rhinos, gharial crocodiles, and over 500 species of birds.',
      highlights: [
        'One-horned rhinoceros sightings',
        'Bengal tiger habitat',
        'Elephant safari',
        'Jungle walks and canoe rides',
        'Tharu cultural experiences'
      ],
      best_season: 'October to March',
      image: '/images/destinations/chitwan.jpg'
    },
    {
      id: 3,
      name: 'Bardiya National Park',
      district: 'Bardiya',
      province: 'Lumbini Pradesh',
      category: 'National Park',
      distance_from_kathmandu: 585,
      travel_time: '12 hours',
      altitude: 152,
      description: "Largest and most undisturbed national park in Nepal's Terai region. Home to endangered species including Royal Bengal tigers, wild elephants, one-horned rhinos, and Gangetic dolphins in the Karnali River.",
      highlights: [
        'Royal Bengal tiger tracking',
        'Wild elephant herds',
        'Gangetic dolphins in Karnali River',
        'Rich bird diversity (250+ species)',
        'Tharu village visits'
      ],
      best_season: 'October to April',
      image: '/images/destinations/bardiya.jpg'
    },
    {
      id: 4,
      name: 'Shey Phoksundo Lake',
      district: 'Dolpa',
      province: 'Karnali Pradesh',
      category: 'Natural Lake',
      distance_from_kathmandu: 559,
      travel_time: '2 days (flight + trek)',
      altitude: 3611,
      description: 'Deepest lake in Nepal with stunning turquoise blue water. Located in Shey Phoksundo National Park, the lake is considered sacred by Bon religion followers. Featured in the film "Caravan" (Himalaya).',
      highlights: [
        'Crystal clear turquoise waters',
        'Deepest lake in Nepal (145m)',
        'Remote Dolpo region trekking',
        'Buddhist and Bon monasteries',
        'Snow leopard habitat'
      ],
      best_season: 'May to October',
      image: '/images/destinations/phoksundo.jpg'
    },
    {
      id: 5,
      name: 'Manang',
      district: 'Manang',
      province: 'Gandaki Pradesh',
      category: 'Mountain Village',
      distance_from_kathmandu: 280,
      travel_time: '8-10 hours',
      altitude: 3540,
      description: 'Picturesque mountain village on the Annapurna Circuit trek route. Known for its Tibetan Buddhist culture, ancient monasteries, and stunning views of Annapurna range, Gangapurna, and Tilicho Peak.',
      highlights: [
        'Gateway to Annapurna Circuit',
        'Ancient Tibetan Buddhist culture',
        'Gangapurna Glacier Lake',
        'Tilicho Lake base (highest lake)',
        'Acclimatization point for trekkers'
      ],
      best_season: 'March to May, September to November',
      image: '/images/destinations/manang.jpg'
    },
    {
      id: 6,
      name: 'Sagarmatha National Park',
      district: 'Solukhumbu',
      province: 'Koshi Pradesh',
      category: 'National Park',
      distance_from_kathmandu: 140,
      travel_time: '5 hours + 2 days trek',
      altitude: 2845,
      description: 'UNESCO World Heritage Site surrounding Mount Everest, the highest peak in the world (8,848.86m). Home to Sherpa communities, rare wildlife like snow leopard and red panda, and spectacular mountain vistas.',
      highlights: [
        'Mount Everest (8,848.86m)',
        'Sherpa culture and traditions',
        'Tengboche Monastery',
        'Everest Base Camp trek',
        'Snow leopards and Himalayan tahr'
      ],
      best_season: 'March to May, September to November',
      image: '/images/destinations/sagarmatha.jpg'
    },
    {
      id: 7,
      name: 'Pokhara Valley',
      district: 'Kaski',
      province: 'Gandaki Pradesh',
      category: 'City',
      distance_from_kathmandu: 200,
      travel_time: '6-7 hours',
      altitude: 827,
      description: "Nepal's tourism capital, known for its natural beauty with Phewa Lake and panoramic Annapurna range views. Gateway to Annapurna region treks and adventure activities hub.",
      highlights: [
        'Phewa Lake boating',
        'World Peace Pagoda',
        'Sarangkot sunrise views',
        'Adventure sports (paragliding, zip-lining)',
        'Davis Falls and Gupteshwor Cave'
      ],
      best_season: 'September to November, March to May',
      image: '/images/destinations/pokhara.jpg'
    },
    {
      id: 8,
      name: 'Rara Lake',
      district: 'Mugu',
      province: 'Karnali Pradesh',
      category: 'Natural Lake',
      distance_from_kathmandu: 370,
      travel_time: '2 days (flight + trek)',
      altitude: 2990,
      description: "Nepal's largest lake, located in remote Rara National Park. Crystal clear waters surrounded by pine and juniper forests with snow-capped Himalayan backdrop. Pristine and unspoiled destination.",
      highlights: [
        "Nepal's biggest lake (10.8 sq km)",
        'Rara National Park wildlife',
        'Pristine alpine environment',
        'Red panda habitat',
        'Remote and peaceful setting'
      ],
      best_season: 'April to November',
      image: '/images/destinations/rara.jpg'
    },
    {
      id: 9,
      name: 'Lumbini',
      district: 'Rupandehi',
      province: 'Lumbini Pradesh',
      category: 'Religious Site',
      distance_from_kathmandu: 280,
      travel_time: '8 hours',
      altitude: 150,
      description: "Birthplace of Lord Buddha (Siddhartha Gautama) in 623 BC. UNESCO World Heritage Site with Maya Devi Temple, Ashoka Pillar, and numerous monasteries built by Buddhist countries from around the world.",
      highlights: [
        'Maya Devi Temple (birthplace marker)',
        'Ashoka Pillar (249 BC)',
        'Sacred Bodhi Tree',
        'International monasteries',
        'Lumbini Museum and World Peace Flame'
      ],
      best_season: 'October to March',
      image: '/images/destinations/lumbini.jpg'
    },
    {
      id: 10,
      name: 'Langtang Valley',
      district: 'Rasuwa',
      province: 'Bagmati Pradesh',
      category: 'Trekking Region',
      distance_from_kathmandu: 51,
      travel_time: '7-8 hours',
      altitude: 3430,
      description: 'Closest trekking region to Kathmandu with diverse landscapes from subtropical forests to alpine meadows. Known for Tamang culture, Langtang Lirung peak views, and Kyanjin Gompa monastery.',
      highlights: [
        'Langtang Lirung peak (7,227m)',
        'Kyanjin Gompa monastery',
        'Tamang heritage trail',
        'Gosaikunda sacred lakes',
        'Red panda sightings'
      ],
      best_season: 'March to May, September to November',
      image: '/images/destinations/langtang.jpg'
    },
    {
      id: 11,
      name: 'Janakpur',
      district: 'Dhanusha',
      province: 'Madhesh Pradesh',
      category: 'Religious Site',
      distance_from_kathmandu: 135,
      travel_time: '5-6 hours',
      altitude: 78,
      description: 'Ancient city and birthplace of Goddess Sita from Hindu epic Ramayana. Home to magnificent Janaki Mandir temple built in Mughal and Koiri architectural style. Important pilgrimage site during Ram Navami and Vivah Panchami festivals.',
      highlights: [
        'Janaki Mandir (Naulakha Mandir)',
        'Ram Mandir and sacred ponds',
        'Vivah Mandap (marriage venue)',
        'Mithila art and culture',
        'Ram Sita Bibaha Panchami festival'
      ],
      best_season: 'October to March',
      image: '/images/destinations/janakpur.jpg'
    },
    {
      id: 12,
      name: 'Tilicho Lake',
      district: 'Manang',
      province: 'Gandaki Pradesh',
      category: 'Natural Lake',
      distance_from_manang: 25,
      travel_time: '2 days trek',
      altitude: 4919,
      description: 'One of the highest lakes in the world situated in the Annapurna range. Glacial lake with stunning turquoise waters surrounded by snow-covered peaks. Challenging high-altitude trek destination.',
      highlights: [
        'One of highest lakes (4,919m)',
        'Annapurna and Nilgiri views',
        'Challenging high-altitude trek',
        'Crystal blue glacial waters',
        'Alternative Annapurna Circuit route'
      ],
      best_season: 'April to October',
      image: '/images/destinations/tilicho.jpg'
    }
  ];

  // State for filtering
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique categories
  const categories = ['All', ...new Set(allDestinations.map(d => d.category))];

  // Filter destinations
  const filteredDestinations = allDestinations.filter(dest => {
    const matchesCategory = selectedCategory === 'All' || dest.category === selectedCategory;
    const matchesSearch = dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dest.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dest.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="destinations-page">
      <div className="container">
        {/* Hero Section */}
        <div className="destinations-hero">
          <h1 className="hero-title">🏔️ Explore Nepal</h1>
          <p className="hero-subtitle">
            Discover the beauty and diversity of Nepal's most spectacular destinations
          </p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="results-count">
          <p>
            Showing <strong>{filteredDestinations.length}</strong> destination
            {filteredDestinations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Destinations Grid */}
        {filteredDestinations.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🗺️</div>
            <h3>No destinations found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="destinations-grid">
            {filteredDestinations.map(destination => (
              <div key={destination.id} className="destination-card">
                {/* Image */}
                <div className="destination-image">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    onError={(e) => {
                      e.target.src = '/images/destinations/default.jpg';
                      e.target.onerror = null;
                    }}
                  />
                  <div className="category-badge">{destination.category}</div>
                </div>

                {/* Content */}
                <div className="destination-content">
                  <h2 className="destination-name">{destination.name}</h2>
                  
                  <div className="destination-location">
                    <span className="location-icon">📍</span>
                    <span>{destination.district}, {destination.province}</span>
                  </div>

                  <p className="destination-description">{destination.description}</p>

                  {/* Info Grid */}
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-icon">⛰️</span>
                      <div>
                        <small>Altitude</small>
                        <strong>{destination.altitude.toLocaleString()}m</strong>
                      </div>
                    </div>
                    
                    {destination.distance_from_kathmandu && (
                      <div className="info-item">
                        <span className="info-icon">🚗</span>
                        <div>
                          <small>From Kathmandu</small>
                          <strong>{destination.distance_from_kathmandu}km</strong>
                        </div>
                      </div>
                    )}
                    
                    {destination.distance_from_pokhara && (
                      <div className="info-item">
                        <span className="info-icon">🚗</span>
                        <div>
                          <small>From Pokhara</small>
                          <strong>{destination.distance_from_pokhara}km</strong>
                        </div>
                      </div>
                    )}
                    
                    <div className="info-item">
                      <span className="info-icon">⏱️</span>
                      <div>
                        <small>Travel Time</small>
                        <strong>{destination.travel_time}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Best Season */}
                  <div className="best-season">
                    <span className="season-icon">🌤️</span>
                    <div>
                      <small>Best Season</small>
                      <p>{destination.best_season}</p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="highlights">
                    <h4>Highlights</h4>
                    <ul>
                      {destination.highlights.slice(0, 4).map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                    {destination.highlights.length > 4 && (
                      <p className="more-highlights">
                        +{destination.highlights.length - 4} more highlights
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link to={`/search?destination=${destination.name}`} className="btn-explore">
                    Find Buses to {destination.district} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="cta-section">
          <h2>Ready to Start Your Journey?</h2>
          <p>Book your bus tickets now and explore the wonders of Nepal</p>
          <Link to="/search" className="btn-cta">
            Search Bus Routes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Destinations;
