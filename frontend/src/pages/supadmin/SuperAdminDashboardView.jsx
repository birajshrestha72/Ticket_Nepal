import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import '../../css/adminDashboard.css'
import '../../css/superadmin.css'
import {
  createVendor,
  deleteVendor,
  fetchSuperadminData,
  updateVendor,
  verifyVendor,
} from '../../api/superadminApi'
import BookingsSection from '../admin/BookingsSection'
import VendorAnalyticsView from '../admin/VendorAnalyticsView'
import SuperAdminBusesSection from './SuperAdminBusesSection'
import SuperAdminRoutesSection from './SuperAdminRoutesSection'
import SuperAdminSchedulesSection from './SuperAdminSchedulesSection'
import TablePagination from '../../components/TablePagination'

const VENDORS_PAGE_SIZE = 10

const tabs = [
  { key: 'analytics', label: 'Analytics' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'buses', label: 'Buses' },
  { key: 'routes', label: 'Routes' },
  { key: 'schedules', label: 'Schedules' },
]

const SuperAdminDashboardView = () => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('analytics')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewDocument, setPreviewDocument] = useState(null)

  const [analytics, setAnalytics] = useState(null)
  const [bookings, setBookings] = useState([])
  const [vendors, setVendors] = useState([])
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [schedules, setSchedules] = useState([])
  const [vendorPage, setVendorPage] = useState(1)

  const [vendorForm, setVendorForm] = useState({ name: '', email: '', password: '' })
  const [busForm, setBusForm] = useState({ bus_name: '', bus_type: 'Standard', from_city: '', to_city: '', price: '', seat_capacity: 40 })
  const [routeForm, setRouteForm] = useState({ from_city: '', to_city: '', distance_km: '' })
  const [scheduleForm, setScheduleForm] = useState({ bus_id: '', route_id: '', departure_time: '07:00', arrival_time: '10:00', fare: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSuperadminData()
      setAnalytics(data.analytics)
      setBookings(data.bookings)
      setVendors(data.vendors)
      setBuses(data.buses)
      setRoutes(data.routes)
      setSchedules(data.schedules)
      setScheduleForm((prev) => {
        const next = { ...prev }
        if (!next.bus_id && data.buses.length > 0) {
          next.bus_id = String(data.buses[0].bus_id)
        }
        if (!next.route_id && data.routes.length > 0) {
          next.route_id = String(data.routes[0].route_id)
        }
        return next
      })
    } catch (err) {
      setError(err.message || 'Failed to load superadmin data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (!tab) return
    if (tabs.some((item) => item.key === tab)) {
      setActiveTab(tab)
    }
  }, [location.search])

  const withAction = async (action, successMessage) => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await action()
      setSuccess(successMessage)
      await loadData()
    } catch (err) {
      setError(err.message || 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  const vendorTotalPages = Math.max(1, Math.ceil(vendors.length / VENDORS_PAGE_SIZE))
  const safeVendorPage = Math.min(vendorPage, vendorTotalPages)
  const paginatedVendors = useMemo(() => {
    const start = (safeVendorPage - 1) * VENDORS_PAGE_SIZE
    return vendors.slice(start, start + VENDORS_PAGE_SIZE)
  }, [safeVendorPage, vendors])

  return (
    <section className="container page-shell admin-dashboard superadmin-shell">
      <aside className="superadmin-sidebar">
        <div className="superadmin-brand">
          <h1>Ticket Nepal</h1>
          <p>Superadmin Control Center</p>
        </div>
        <nav className="side-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`superadmin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="superadmin-main">
        {loading && <p className="admin-info">Loading superadmin dashboard...</p>}
        {error && <p className="admin-error">{error}</p>}
        {success && <p className="admin-success">{success}</p>}

        {activeTab === 'analytics' && analytics && (
          <section className="admin-section">
            <h2>Platform Analytics</h2>
            <VendorAnalyticsView
              mode="system"
              embedded
              analyticsData={analytics}
              bookingsData={bookings}
              busesData={buses}
              routesData={routes}
              schedulesData={schedules}
              vendorsData={vendors}
            />
          </section>
        )}

        {activeTab === 'bookings' && <BookingsSection bookings={bookings} />}

        {activeTab === 'vendors' && (
          <section className="admin-section">
            <h2>Vendor Verification & Management</h2>
            <form
              className="admin-form"
              onSubmit={(e) => {
                e.preventDefault()
                withAction(
                  () => createVendor(vendorForm),
                  'Vendor created in pending state.',
                )
              }}
            >
              <input placeholder="Vendor name" value={vendorForm.name} onChange={(e) => setVendorForm((p) => ({ ...p, name: e.target.value }))} required />
              <input placeholder="Vendor email" type="email" value={vendorForm.email} onChange={(e) => setVendorForm((p) => ({ ...p, email: e.target.value }))} required />
              <input placeholder="Temporary password" type="text" value={vendorForm.password} onChange={(e) => setVendorForm((p) => ({ ...p, password: e.target.value }))} required />
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Vendor'}</button>
            </form>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Document</th>
                    <th>Document Status</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVendors.map((vendor) => {
                    return (
                    <tr key={vendor.vendor_id}>
                      <td>{vendor.vendor_id}</td>
                      <td>{vendor.name}</td>
                      <td>{vendor.email}</td>
                      <td>
                        {vendor.company_registration_document_url ? (
                          <div className="doc-actions">
                            <button
                              type="button"
                              className="doc-link-btn"
                              onClick={() => setPreviewDocument({
                                name: vendor.name,
                                url: `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}${vendor.company_registration_document_url}`,
                              })}
                            >
                              View document
                            </button>
                            <a
                              href={`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}${vendor.company_registration_document_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="doc-link"
                            >
                              Open in new tab
                            </a>
                          </div>
                        ) : (
                          <span className="doc-missing">Not uploaded</span>
                        )}
                      </td>
                      <td>
                        <span className={`vendor-status ${vendor.document_status === 'approved' ? 'verified' : 'pending'}`}>
                          {vendor.document_status || 'missing'}
                        </span>
                      </td>
                      <td>
                        <span className={`vendor-status ${vendor.is_verified ? 'verified' : 'pending'}`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            onClick={() => withAction(
                              () => verifyVendor(vendor.vendor_id, true),
                              'Vendor verified.',
                            )}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => withAction(
                              () => verifyVendor(vendor.vendor_id, false),
                              'Vendor set to pending.',
                            )}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const name = globalThis.prompt('New vendor name', vendor.name)
                              if (!name) return
                              withAction(
                                () => updateVendor(vendor.vendor_id, { name }),
                                'Vendor updated.',
                              )
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="warn"
                            onClick={() => withAction(
                              () => deleteVendor(vendor.vendor_id),
                              'Vendor deactivated.',
                            )}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={safeVendorPage}
              totalPages={vendorTotalPages}
              pageSize={VENDORS_PAGE_SIZE}
              totalItems={vendors.length}
              onPageChange={setVendorPage}
              itemLabel="vendors"
            />
          </section>
        )}

        {previewDocument && (
          <div className="doc-modal-backdrop">
            <div className="doc-modal">
              <div className="doc-modal-head">
                <div>
                  <h3>Vendor Document</h3>
                  <p>{previewDocument.name}</p>
                </div>
                <button type="button" className="doc-modal-close" onClick={() => setPreviewDocument(null)}>
                  Close
                </button>
              </div>
              <div className="doc-modal-body">
                <iframe
                  title={`${previewDocument.name} document preview`}
                  src={previewDocument.url}
                  className="doc-preview-frame"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'buses' && (
          <SuperAdminBusesSection
            busForm={busForm}
            setBusForm={setBusForm}
            buses={buses}
            saving={saving}
            withAction={withAction}
          />
        )}

        {activeTab === 'routes' && (
          <SuperAdminRoutesSection
            routeForm={routeForm}
            setRouteForm={setRouteForm}
            routes={routes}
            saving={saving}
            withAction={withAction}
          />
        )}

        {activeTab === 'schedules' && (
          <SuperAdminSchedulesSection
            scheduleForm={scheduleForm}
            setScheduleForm={setScheduleForm}
            schedules={schedules}
            buses={buses}
            routes={routes}
            saving={saving}
            withAction={withAction}
          />
        )}
      </div>
    </section>
  )
}

export default SuperAdminDashboardView
