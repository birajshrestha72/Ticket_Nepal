import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import {
  createBus,
  deleteBus,
  setBusStatus,
  updateBus,
} from '../../api/superadminApi'
import TablePagination from '../../components/TablePagination'

const PAGE_SIZE = 10

const busShape = PropTypes.shape({
  bus_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  bus_name: PropTypes.string,
  bus_type: PropTypes.string,
  from_city: PropTypes.string,
  to_city: PropTypes.string,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  seat_capacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  is_active: PropTypes.bool,
})

const busFormShape = PropTypes.shape({
  bus_name: PropTypes.string,
  bus_type: PropTypes.string,
  from_city: PropTypes.string,
  to_city: PropTypes.string,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  seat_capacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
})

const SuperAdminBusesSection = ({
  busForm,
  setBusForm,
  buses,
  saving,
  withAction,
}) => {
  const [editingBusId, setEditingBusId] = useState(null)
  const [editForm, setEditForm] = useState({
    bus_name: '',
    bus_type: 'Standard',
    from_city: '',
    to_city: '',
    price: '',
    seat_capacity: '40',
  })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const visibleBuses = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = buses.filter((bus) => {
      if (!q) return true
      const text = `${bus.bus_name || ''} ${bus.bus_type || ''} ${bus.from_city || ''} ${bus.to_city || ''}`.toLowerCase()
      const matchesQuery = text.includes(q)
      const status = bus.is_active ? 'active' : 'inactive'
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      return matchesQuery && matchesStatus
    })

    const order = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((left, right) => {
      if (sortBy === 'price') {
        return (Number(left.price || 0) - Number(right.price || 0)) * order
      }
      if (sortBy === 'seats') {
        return (Number(left.seat_capacity || 0) - Number(right.seat_capacity || 0)) * order
      }
      if (sortBy === 'route') {
        const l = `${left.from_city || ''} ${left.to_city || ''}`
        const r = `${right.from_city || ''} ${right.to_city || ''}`
        return String(l).localeCompare(String(r), 'en', { sensitivity: 'base' }) * order
      }
      return String(left.bus_name || '').localeCompare(String(right.bus_name || ''), 'en', { sensitivity: 'base' }) * order
    })
  }, [buses, query, sortBy, sortDir, statusFilter])

  const totalPages = Math.max(1, Math.ceil(visibleBuses.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedBuses = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return visibleBuses.slice(start, start + PAGE_SIZE)
  }, [safePage, visibleBuses])

  const startEdit = (bus) => {
    setEditingBusId(bus.bus_id)
    setEditForm({
      bus_name: bus.bus_name || '',
      bus_type: bus.bus_type || 'Standard',
      from_city: bus.from_city || '',
      to_city: bus.to_city || '',
      price: String(bus.price || ''),
      seat_capacity: String(bus.seat_capacity || 40),
    })
  }

  const cancelEdit = () => {
    setEditingBusId(null)
    setEditForm({
      bus_name: '',
      bus_type: 'Standard',
      from_city: '',
      to_city: '',
      price: '',
      seat_capacity: '40',
    })
  }

  const saveEdit = async (busId) => {
    await withAction(
      () => updateBus(busId, {
        bus_name: editForm.bus_name,
        bus_type: editForm.bus_type,
        from_city: editForm.from_city,
        to_city: editForm.to_city,
        price: Number(editForm.price),
        seat_capacity: Number(editForm.seat_capacity),
      }),
      'Bus updated.',
    )
    cancelEdit()
  }

  const toggleBusStatus = async (bus) => {
    await withAction(
      () => setBusStatus(bus.bus_id, !bus.is_active),
      bus.is_active ? 'Bus deactivated.' : 'Bus activated.',
    )
  }

  return (
    <section className="admin-section">
      <h2>Bus Management</h2>
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault()
          withAction(
            () => createBus({
              ...busForm,
              price: Number(busForm.price),
              seat_capacity: Number(busForm.seat_capacity),
            }),
            'Bus created.',
          )
        }}
      >
        <input
          placeholder="Bus name"
          value={busForm.bus_name}
          onChange={(e) => setBusForm((prev) => ({ ...prev, bus_name: e.target.value }))}
          required
        />
        <input
          placeholder="Type"
          value={busForm.bus_type}
          onChange={(e) => setBusForm((prev) => ({ ...prev, bus_type: e.target.value }))}
          required
        />
        <input
          placeholder="From"
          value={busForm.from_city}
          onChange={(e) => setBusForm((prev) => ({ ...prev, from_city: e.target.value }))}
          required
        />
        <input
          placeholder="To"
          value={busForm.to_city}
          onChange={(e) => setBusForm((prev) => ({ ...prev, to_city: e.target.value }))}
          required
        />
        <input
          placeholder="Price"
          type="number"
          value={busForm.price}
          onChange={(e) => setBusForm((prev) => ({ ...prev, price: e.target.value }))}
          required
        />
        <input
          placeholder="Seat capacity"
          type="number"
          min="7"
          max="80"
          value={busForm.seat_capacity}
          onChange={(e) => setBusForm((prev) => ({ ...prev, seat_capacity: e.target.value }))}
          required
        />
        <button type="submit" disabled={saving}>
          Add Bus
        </button>
      </form>
      <div className="admin-table-wrap">
        <div className="table-filter-row">
          <input
            type="text"
            placeholder="Search bus/type/route"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Sort by name</option>
            <option value="route">Sort by route</option>
            <option value="price">Sort by price</option>
            <option value="seats">Sort by seats</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Route</th>
              <th>Price</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBuses.map((bus) => (
              <tr key={bus.bus_id}>
                <td>{bus.bus_id}</td>
                <td>
                  {editingBusId === bus.bus_id ? (
                    <input
                      value={editForm.bus_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, bus_name: e.target.value }))}
                    />
                  ) : bus.bus_name}
                </td>
                <td>
                  {editingBusId === bus.bus_id ? (
                    <input
                      value={editForm.bus_type}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, bus_type: e.target.value }))}
                    />
                  ) : bus.bus_type}
                </td>
                <td>
                  {editingBusId === bus.bus_id ? (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <input
                        value={editForm.from_city}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, from_city: e.target.value }))}
                      />
                      <input
                        value={editForm.to_city}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, to_city: e.target.value }))}
                      />
                    </div>
                  ) : <>{bus.from_city} {'->'} {bus.to_city}</>}
                </td>
                <td>
                  {editingBusId === bus.bus_id ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
                    />
                  ) : bus.price}
                </td>
                <td>
                  {editingBusId === bus.bus_id ? (
                    <input
                      type="number"
                      value={editForm.seat_capacity}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, seat_capacity: e.target.value }))}
                    />
                  ) : bus.seat_capacity}
                </td>
                <td>
                  <span className={`vendor-status ${bus.is_active ? 'verified' : 'pending'}`}>
                    {bus.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {editingBusId === bus.bus_id ? (
                      <>
                        <button
                          type="button"
                          className="save"
                          onClick={() => saveEdit(bus.bus_id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(bus)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleBusStatus(bus)}
                    >
                      {bus.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="warn"
                      onClick={() => withAction(() => deleteBus(bus.bus_id), 'Bus deleted.')}
                    >
                      Delete
                    </button>
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
        totalItems={visibleBuses.length}
        onPageChange={setCurrentPage}
        itemLabel="buses"
      />
    </section>
  )
}

SuperAdminBusesSection.propTypes = {
  busForm: busFormShape.isRequired,
  setBusForm: PropTypes.func.isRequired,
  buses: PropTypes.arrayOf(busShape).isRequired,
  saving: PropTypes.bool.isRequired,
  withAction: PropTypes.func.isRequired,
}

export default SuperAdminBusesSection
