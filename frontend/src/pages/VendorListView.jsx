import { useCallback, useEffect, useState } from 'react'
import '../css/vendorList.css'
import acImage from '../assets/ac.png'
import acImage1 from '../assets/ac1.png'
import acImage2 from '../assets/ac2.png'
import deluxeImage from '../assets/delux.png'
import deluxeImage1 from '../assets/delux1.png'
import deluxeImage2 from '../assets/delux2.png'
import sleeperImage from '../assets/sleeper.png'
import sleeperImage1 from '../assets/sleeper1.png'
import sleeperImage2 from '../assets/sleeper2.png'
import standardImage from '../assets/standard.png'
import standardImage1 from '../assets/standard1.png'
import standardImage2 from '../assets/standard2.png'

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const BUS_IMAGE_GROUPS = {
  ac: [acImage, acImage1, acImage2],
  deluxe: [deluxeImage, deluxeImage1, deluxeImage2],
  sleeper: [sleeperImage, sleeperImage1, sleeperImage2],
  standard: [standardImage, standardImage1, standardImage2],
}

const resolveBusImage = (busType, busName, sequence = 0) => {
  const typeText = `${busType || ''} ${busName || ''}`.toLowerCase()

  if (typeText.includes('ac')) {
    return BUS_IMAGE_GROUPS.ac[sequence % BUS_IMAGE_GROUPS.ac.length]
  }
  if (typeText.includes('delux')) {
    return BUS_IMAGE_GROUPS.deluxe[sequence % BUS_IMAGE_GROUPS.deluxe.length]
  }
  if (typeText.includes('sleeper')) {
    return BUS_IMAGE_GROUPS.sleeper[sequence % BUS_IMAGE_GROUPS.sleeper.length]
  }

  return BUS_IMAGE_GROUPS.standard[sequence % BUS_IMAGE_GROUPS.standard.length]
}

const pluralSuffix = (count, singular = '', plural = 's') => (
  Number(count) === 1 ? singular : plural
)

const fetchPublicVendors = async ({ page = 1, limit = 10, filters = {} }) => {
  const response = await fetch(`${API_BASE}/api/admin/buses`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load vendors')
  }

  const allBuses = data.buses || []
  const grouped = allBuses.reduce((acc, bus) => {
    const key = bus.bus_type || 'Standard'
    if (!acc[key]) {
      acc[key] = {
        vendor_id: Object.keys(acc).length + 1,
        company_name: `${key} Operator`,
        is_verified: true,
        city: bus.from_city || 'N/A',
        province: 'N/A',
        average_rating: 4.5,
        total_reviews: 0,
        total_buses: 0,
        contact_person: 'Support Team',
        contact_phone: 'N/A',
        contact_email: 'support@ticketnepal.local',
        buses: [],
      }
    }

    acc[key].total_buses += 1
    const imageUrl = resolveBusImage(bus.bus_type, bus.bus_name, acc[key].buses.length)
    acc[key].buses.push({
      bus_id: bus.bus_id,
      image_url: imageUrl,
      bus_type: bus.bus_type || 'Standard',
      bus_number: bus.bus_name,
      total_seats: bus.seat_capacity,
      registration_year: null,
      amenities: [],
      total_routes: 1,
      is_active: bus.is_active,
    })
    return acc
  }, {})

  let vendors = Object.values(grouped)

  if (filters.city) {
    const cityText = filters.city.toLowerCase()
    vendors = vendors.filter((item) => item.city.toLowerCase().includes(cityText))
  }
  if (filters.province) {
    const provinceText = filters.province.toLowerCase()
    vendors = vendors.filter((item) => item.province.toLowerCase().includes(provinceText))
  }
  if (filters.verified_only) {
    vendors = vendors.filter((item) => item.is_verified)
  }

  const total_items = vendors.length
  const total_pages = Math.max(1, Math.ceil(total_items / limit))
  const current_page = Math.min(Math.max(page, 1), total_pages)
  const start = (current_page - 1) * limit
  const end = start + limit
  const paginated = vendors.slice(start, end)

  return {
    vendors: paginated,
    pagination: {
      current_page,
      total_pages,
      total_items,
      items_per_page: limit,
      has_next: current_page < total_pages,
      has_prev: current_page > 1,
    },
  }
}

const VendorList = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedVendors, setExpandedVendors] = useState(new Set())
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_prev: false,
  })

  const [filters, setFilters] = useState({ city: '', province: '', verified_only: false })

  const fetchVendors = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')

    try {
      const data = await fetchPublicVendors({
        page,
        limit: 10,
        filters,
      })

      setVendors(data.vendors)
      setPagination(data.pagination)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchVendors(1)
  }, [fetchVendors])

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.total_pages) {
      fetchVendors(page)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const clearFilters = () => {
    setFilters({ city: '', province: '', verified_only: false })
  }

  const toggleVendor = (vendorId) => {
    const next = new Set(expandedVendors)
    if (next.has(vendorId)) next.delete(vendorId)
    else next.add(vendorId)
    setExpandedVendors(next)
  }

  const expandAll = () => setExpandedVendors(new Set(vendors.map((v) => v.vendor_id)))
  const collapseAll = () => setExpandedVendors(new Set())

  if (loading && vendors.length === 0) {
    return <div className="vendor-list-page container"><div className="loading-state"><div className="spinner" /><p>Loading vendors...</p></div></div>
  }

  return (
    <div className="vendor-list-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Bus Vendors</h1>
          <p className="page-subtitle">Browse trusted bus operators and their fleet</p>
        </div>

        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="city">City</label>
              <input id="city" name="city" placeholder="Search by city" value={filters.city} onChange={handleFilterChange} />
            </div>

            <div className="filter-group">
              <label htmlFor="province">Province</label>
              <select id="province" name="province" value={filters.province} onChange={handleFilterChange}>
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
                <input type="checkbox" name="verified_only" checked={filters.verified_only} onChange={handleFilterChange} />
                <span>Verified Vendors Only</span>
              </label>
            </div>

            {(filters.city || filters.province || filters.verified_only) && (
              <button className="btn-clear-filters" onClick={clearFilters}>Clear Filters</button>
            )}
          </div>
        </div>

        {error && <div className="error-message"><span>{error}</span></div>}

        {vendors.length > 0 && (
          <div className="vendor-controls">
            <button onClick={expandAll} className="btn-control">Expand All</button>
            <button onClick={collapseAll} className="btn-control">Collapse All</button>
          </div>
        )}

        <div className="results-summary">
          <p>Showing <strong>{vendors.length}</strong> vendor{pluralSuffix(vendors.length)}{pagination.total_items > 0 ? ` (${pagination.total_items} total)` : ''}</p>
        </div>

        {vendors.length === 0 && !loading ? (
          <div className="no-results"><h3>No vendors found</h3><p>Try adjusting your filters or check back later</p></div>
        ) : (
          <div className="vendors-list">
            {vendors.map((vendor) => (
              <div key={vendor.vendor_id} className="vendor-card">
                <button
                  type="button"
                  className="vendor-header"
                  onClick={() => toggleVendor(vendor.vendor_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="vendor-info">
                    <h2 className="vendor-name">{vendor.company_name}{vendor.is_verified && <span className="verified-badge">Verified</span>}</h2>
                    <p className="vendor-location">{vendor.city}, {vendor.province}</p>
                    <div className="vendor-meta">
                      <span className="rating">{vendor.average_rating.toFixed(1)} ({vendor.total_reviews} reviews)</span>
                      <span className="bus-count">{vendor.total_buses} bus{pluralSuffix(vendor.total_buses, '', 'es')}</span>
                    </div>
                  </div>
                  <div className="vendor-contact">
                    <p><strong>Contact:</strong> {vendor.contact_person}</p>
                    <p>{vendor.contact_phone}</p>
                    <p>{vendor.contact_email}</p>
                  </div>
                  <span className="toggle-vendor-btn" aria-hidden="true">
                    {expandedVendors.has(vendor.vendor_id) ? 'Hide' : 'Show'}
                  </span>
                </button>

                {expandedVendors.has(vendor.vendor_id) && vendor.buses && vendor.buses.length > 0 && (
                  <div className="buses-section">
                    <h3 className="buses-title">Available Buses ({vendor.buses.length})</h3>
                    <div className="buses-horizontal-scroll">
                      {vendor.buses.map((bus) => (
                        <div key={bus.bus_id} className="bus-card">
                          <div className="bus-image">
                            <img
                              src={bus.image_url}
                              alt={`${bus.bus_type} Bus`}
                              onError={(e) => {
                                e.currentTarget.src = standardImage
                                e.currentTarget.onerror = null
                              }}
                            />
                            <div className="bus-type-badge">{bus.bus_type}</div>
                          </div>

                          <div className="bus-details">
                            <h4 className="bus-number">{bus.bus_number}</h4>
                            <div className="bus-info"><span>{bus.total_seats} seats</span><span>{bus.registration_year || 'N/A'}</span></div>

                            {bus.amenities && bus.amenities.length > 0 && (
                              <div className="amenities">
                                {bus.amenities.slice(0, 3).map((amenity) => <span key={`${bus.bus_id}-${amenity}`} className="amenity-tag">{amenity}</span>)}
                                {bus.amenities.length > 3 && <span className="amenity-tag more">+{bus.amenities.length - 3} more</span>}
                              </div>
                            )}

                            {bus.total_routes > 0 && <p className="routes-count">Available on {bus.total_routes} route{pluralSuffix(bus.total_routes)}</p>}
                            <div className={`status ${bus.is_active ? 'active' : 'inactive'}`}>{bus.is_active ? 'Active' : 'Inactive'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {expandedVendors.has(vendor.vendor_id) && (!vendor.buses || vendor.buses.length === 0) && (
                  <div className="no-buses"><p>No buses available at the moment</p></div>
                )}
              </div>
            ))}
          </div>
        )}

        {pagination.total_pages > 1 && (
          <div className="pagination">
            <button className="pagination-btn" onClick={() => goToPage(pagination.current_page - 1)} disabled={!pagination.has_prev || loading}>Previous</button>
            <div className="pagination-info"><span className="page-info">Page {pagination.current_page} of {pagination.total_pages}</span></div>
            <button className="pagination-btn" onClick={() => goToPage(pagination.current_page + 1)} disabled={!pagination.has_next || loading}>Next</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VendorList
