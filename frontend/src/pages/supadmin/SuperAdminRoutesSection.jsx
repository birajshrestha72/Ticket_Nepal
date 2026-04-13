import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import {
  createRoute,
  deleteRoute,
  setRouteStatus,
  updateRoute,
} from '../../api/superadminApi'
import TablePagination from '../../components/TablePagination'

const PAGE_SIZE = 10

const SuperAdminRoutesSection = ({
  routeForm,
  setRouteForm,
  routes,
  saving,
  withAction,
}) => {
  const [editingRouteId, setEditingRouteId] = useState(null)
  const [editForm, setEditForm] = useState({ from_city: '', to_city: '', distance_km: '' })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('origin')
  const [sortDir, setSortDir] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const visibleRoutes = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = routes.filter((route) => {
      const matchesQuery =
        !q ||
        `${route.from_city || ''} ${route.to_city || ''} ${route.distance_km || ''}`
          .toLowerCase()
          .includes(q)
      const status = route.is_active ? 'active' : 'inactive'
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      return matchesQuery && matchesStatus
    })

    const order = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((left, right) => {
      if (sortBy === 'destination') {
        return String(left.to_city || '').localeCompare(String(right.to_city || ''), 'en', {
          sensitivity: 'base',
        }) * order
      }
      if (sortBy === 'distance') {
        return (Number(left.distance_km || 0) - Number(right.distance_km || 0)) * order
      }
      return String(left.from_city || '').localeCompare(String(right.from_city || ''), 'en', {
        sensitivity: 'base',
      }) * order
    })
  }, [query, routes, sortBy, sortDir, statusFilter])

  const totalPages = Math.max(1, Math.ceil(visibleRoutes.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRoutes = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return visibleRoutes.slice(start, start + PAGE_SIZE)
  }, [safePage, visibleRoutes])

  const startEdit = (route) => {
    setEditingRouteId(route.route_id)
    setEditForm({
      from_city: route.from_city || '',
      to_city: route.to_city || '',
      distance_km: String(route.distance_km || ''),
    })
  }

  const cancelEdit = () => {
    setEditingRouteId(null)
    setEditForm({ from_city: '', to_city: '', distance_km: '' })
  }

  return (
    <section className="admin-section">
      <h2>Route Management</h2>
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault()
          withAction(
            () => createRoute({
              ...routeForm,
              distance_km: Number(routeForm.distance_km),
            }),
            'Route created.',
          )
        }}
      >
        <input placeholder="From" value={routeForm.from_city} onChange={(e) => setRouteForm((p) => ({ ...p, from_city: e.target.value }))} required />
        <input placeholder="To" value={routeForm.to_city} onChange={(e) => setRouteForm((p) => ({ ...p, to_city: e.target.value }))} required />
        <input placeholder="Distance (km)" type="number" value={routeForm.distance_km} onChange={(e) => setRouteForm((p) => ({ ...p, distance_km: e.target.value }))} required />
        <button type="submit" disabled={saving}>Add Route</button>
      </form>
      <div className="admin-table-wrap">
        <div className="table-filter-row">
          <input
            type="text"
            placeholder="Search origin/destination"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="origin">Sort by origin</option>
            <option value="destination">Sort by destination</option>
            <option value="distance">Sort by distance</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <table className="admin-table">
          <thead><tr><th>ID</th><th>From</th><th>To</th><th>Distance</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {paginatedRoutes.map((route) => (
              <tr key={route.route_id}>
                <td>{route.route_id}</td>
                <td>
                  {editingRouteId === route.route_id ? (
                    <input
                      value={editForm.from_city}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, from_city: e.target.value }))}
                    />
                  ) : route.from_city}
                </td>
                <td>
                  {editingRouteId === route.route_id ? (
                    <input
                      value={editForm.to_city}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, to_city: e.target.value }))}
                    />
                  ) : route.to_city}
                </td>
                <td>
                  {editingRouteId === route.route_id ? (
                    <input
                      type="number"
                      value={editForm.distance_km}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, distance_km: e.target.value }))}
                    />
                  ) : route.distance_km}
                </td>
                <td>
                  <span className={`vendor-status ${route.is_active ? 'verified' : 'pending'}`}>
                    {route.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {editingRouteId === route.route_id ? (
                      <>
                        <button
                          type="button"
                          className="save"
                          onClick={() => withAction(
                            () => updateRoute(route.route_id, {
                              from_city: editForm.from_city,
                              to_city: editForm.to_city,
                              distance_km: Number(editForm.distance_km),
                            }),
                            'Route updated.',
                          ).then(cancelEdit)}
                        >
                          Save
                        </button>
                        <button type="button" className="ghost" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => startEdit(route)}>
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => withAction(
                        () => setRouteStatus(route.route_id, !route.is_active),
                        route.is_active ? 'Route deactivated.' : 'Route activated.',
                      )}
                    >
                      {route.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="warn" onClick={() => withAction(() => deleteRoute(route.route_id), 'Route deleted.')}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        currentPage={safePage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        totalItems={visibleRoutes.length}
        onPageChange={setCurrentPage}
        itemLabel="routes"
      />
    </section>
  )
}

export default SuperAdminRoutesSection

const routeShape = PropTypes.shape({
  route_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  from_city: PropTypes.string,
  to_city: PropTypes.string,
  distance_km: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  is_active: PropTypes.bool,
})

const routeFormShape = PropTypes.shape({
  from_city: PropTypes.string,
  to_city: PropTypes.string,
  distance_km: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
})

SuperAdminRoutesSection.propTypes = {
  routeForm: routeFormShape.isRequired,
  setRouteForm: PropTypes.func.isRequired,
  routes: PropTypes.arrayOf(routeShape).isRequired,
  saving: PropTypes.bool.isRequired,
  withAction: PropTypes.func.isRequired,
}
