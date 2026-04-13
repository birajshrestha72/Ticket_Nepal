import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { createRoute, deleteRoute, setRouteStatus, updateRoute } from '../../api/adminApi'
import TablePagination from '../../components/TablePagination'

const PAGE_SIZE = 10

const emptyRouteForm = {
  from_city: '',
  to_city: '',
  distance_km: '',
}

const RoutesCrudSection = ({ routes, onDataChanged, showError, showSuccess }) => {
  const [routeForm, setRouteForm] = useState(emptyRouteForm)
  const [editingRouteId, setEditingRouteId] = useState(null)
  const [editForm, setEditForm] = useState(emptyRouteForm)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('distance')
  const [sortDir, setSortDir] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const visibleRoutes = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = routes.filter((route) => {
      const statusPass = statusFilter === 'all'
        || (statusFilter === 'active' && route.is_active)
        || (statusFilter === 'inactive' && !route.is_active)
      if (!statusPass) return false
      if (!q) return true
      const text = `${route.from_city || ''} ${route.to_city || ''} ${route.distance_km || ''}`.toLowerCase()
      return text.includes(q)
    })

    const order = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((left, right) => {
      if (sortBy === 'distance') {
        return (Number(left.distance_km || 0) - Number(right.distance_km || 0)) * order
      }
      if (sortBy === 'from') {
        return String(left.from_city || '').localeCompare(String(right.from_city || ''), 'en', { sensitivity: 'base' }) * order
      }
      if (sortBy === 'to') {
        return String(left.to_city || '').localeCompare(String(right.to_city || ''), 'en', { sensitivity: 'base' }) * order
      }
      return (Number(left.route_id || 0) - Number(right.route_id || 0)) * order
    })
  }, [routes, query, statusFilter, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(visibleRoutes.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRoutes = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return visibleRoutes.slice(start, start + PAGE_SIZE)
  }, [safePage, visibleRoutes])

  const resetAddForm = () => setRouteForm(emptyRouteForm)

  const resetEditForm = () => {
    setEditingRouteId(null)
    setEditForm(emptyRouteForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      from_city: routeForm.from_city,
      to_city: routeForm.to_city,
      distance_km: Number(routeForm.distance_km),
    }

    try {
      await createRoute(payload)
      showSuccess('Route created successfully')
      resetAddForm()
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleEdit = (route) => {
    setEditingRouteId(route.route_id)
    setEditForm({
      from_city: route.from_city,
      to_city: route.to_city,
      distance_km: String(route.distance_km),
    })
  }

  const handleUpdate = async (routeId) => {
    try {
      await updateRoute(routeId, {
        from_city: editForm.from_city,
        to_city: editForm.to_city,
        distance_km: Number(editForm.distance_km),
      })
      showSuccess('Route updated successfully')
      resetEditForm()
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleDelete = async (routeId) => {
    try {
      await deleteRoute(routeId)
      showSuccess('Route deleted successfully')
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleStatus = async (route) => {
    try {
      await setRouteStatus(route.route_id, !route.is_active)
      showSuccess('Route status updated')
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  return (
    <div className="admin-section route-section-bato">
      <h2>Routes</h2>
      <form className="admin-form route-form-yojana" onSubmit={handleSubmit}>
        <input
          placeholder="From City"
          value={routeForm.from_city}
          onChange={(e) => setRouteForm((prev) => ({ ...prev, from_city: e.target.value }))}
          required
        />
        <input
          placeholder="To City"
          value={routeForm.to_city}
          onChange={(e) => setRouteForm((prev) => ({ ...prev, to_city: e.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Distance (km)"
          value={routeForm.distance_km}
          onChange={(e) => setRouteForm((prev) => ({ ...prev, distance_km: e.target.value }))}
          required
        />
        <button type="submit">Add Route</button>
      </form>

      <div className="admin-table-wrap route-table-talika-wrap">
        <div className="table-filter-row">
          <input
            type="text"
            placeholder="Search from/to city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="distance">Sort by distance</option>
            <option value="from">Sort by from city</option>
            <option value="to">Sort by to city</option>
            <option value="id">Sort by id</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <table className="admin-table route-table-talika">
          <thead>
            <tr>
              <th>ID</th>
              <th>From</th>
              <th>To</th>
              <th>Distance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
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
                  ) : `${route.distance_km} km`}
                </td>
                <td>{route.is_active ? 'Active' : 'Inactive'}</td>
                <td className="row-actions route-actions-karbahi">
                  {editingRouteId === route.route_id ? (
                    <>
                      <button
                        type="button"
                        className="save"
                        onClick={() => handleUpdate(route.route_id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={resetEditForm}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => handleEdit(route)}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="warn"
                    onClick={() => handleDelete(route.route_id)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus(route)}
                  >
                    {route.is_active ? 'Set Inactive' : 'Set Active'}
                  </button>
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
    </div>
  )
}

export default RoutesCrudSection

const routeShape = PropTypes.shape({
  route_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  from_city: PropTypes.string,
  to_city: PropTypes.string,
  distance_km: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  is_active: PropTypes.bool,
})

RoutesCrudSection.propTypes = {
  routes: PropTypes.arrayOf(routeShape).isRequired,
  onDataChanged: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
}
