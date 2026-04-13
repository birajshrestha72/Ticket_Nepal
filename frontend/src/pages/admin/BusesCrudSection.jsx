import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { createBus, deleteBus, setBusStatus, updateBus } from '../../api/adminApi'
import TablePagination from '../../components/TablePagination'

const PAGE_SIZE = 10

const emptyBusForm = {
  bus_name: '',
  bus_type: 'Standard',
  from_city: '',
  to_city: '',
  price: '',
  seat_capacity: '40',
}

const BusesCrudSection = ({ buses, onDataChanged, showError, showSuccess }) => {
  const [busForm, setBusForm] = useState(emptyBusForm)
  const [editingBusId, setEditingBusId] = useState(null)
  const [editForm, setEditForm] = useState(emptyBusForm)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const visibleBuses = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = buses.filter((bus) => {
      const statusPass = statusFilter === 'all'
        || (statusFilter === 'active' && bus.is_active)
        || (statusFilter === 'inactive' && !bus.is_active)
      if (!statusPass) return false
      if (!q) return true
      const text = `${bus.bus_name || ''} ${bus.bus_type || ''} ${bus.from_city || ''} ${bus.to_city || ''}`.toLowerCase()
      return text.includes(q)
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
  }, [buses, query, statusFilter, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(visibleBuses.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedBuses = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return visibleBuses.slice(start, start + PAGE_SIZE)
  }, [safePage, visibleBuses])

  const resetAddForm = () => setBusForm(emptyBusForm)

  const resetEditForm = () => {
    setEditingBusId(null)
    setEditForm(emptyBusForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      bus_name: busForm.bus_name,
      bus_type: busForm.bus_type,
      from_city: busForm.from_city,
      to_city: busForm.to_city,
      price: Number(busForm.price),
      seat_capacity: Number(busForm.seat_capacity),
    }

    try {
      await createBus(payload)
      showSuccess('Bus created successfully')
      resetAddForm()
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleEdit = (bus) => {
    setEditingBusId(bus.bus_id)
    setEditForm({
      bus_name: bus.bus_name,
      bus_type: bus.bus_type || 'Standard',
      from_city: bus.from_city,
      to_city: bus.to_city,
      price: String(bus.price),
      seat_capacity: String(bus.seat_capacity || 40),
    })
  }

  const handleUpdate = async (busId) => {
    try {
      await updateBus(busId, {
        bus_name: editForm.bus_name,
        bus_type: editForm.bus_type,
        from_city: editForm.from_city,
        to_city: editForm.to_city,
        price: Number(editForm.price),
        seat_capacity: Number(editForm.seat_capacity),
      })
      showSuccess('Bus updated successfully')
      resetEditForm()
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleDelete = async (busId) => {
    try {
      await deleteBus(busId)
      showSuccess('Bus deleted successfully')
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleStatus = async (bus) => {
    try {
      await setBusStatus(bus.bus_id, !bus.is_active)
      showSuccess('Bus status updated')
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  return (
    <div className="admin-section">
      <h2>Buses</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <input
          placeholder="Bus Name"
          value={busForm.bus_name}
          onChange={(e) => setBusForm((prev) => ({ ...prev, bus_name: e.target.value }))}
          required
        />
        <input
          placeholder="From City"
          value={busForm.from_city}
          onChange={(e) => setBusForm((prev) => ({ ...prev, from_city: e.target.value }))}
          required
        />
        <select
          value={busForm.bus_type}
          onChange={(e) => setBusForm((prev) => ({ ...prev, bus_type: e.target.value }))}
          required
        >
          <option value="Standard">Standard</option>
          <option value="Deluxe">Deluxe</option>
          <option value="Sleeper">Sleeper</option>
          <option value="Mini">Mini</option>
        </select>
        <input
          placeholder="To City"
          value={busForm.to_city}
          onChange={(e) => setBusForm((prev) => ({ ...prev, to_city: e.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={busForm.price}
          onChange={(e) => setBusForm((prev) => ({ ...prev, price: e.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Seat Capacity"
          value={busForm.seat_capacity}
          onChange={(e) => setBusForm((prev) => ({ ...prev, seat_capacity: e.target.value }))}
          required
        />
        <button type="submit">Add Bus</button>
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
            <option value="all">All statuses</option>
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
                    <select
                      value={editForm.bus_type}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, bus_type: e.target.value }))}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Sleeper">Sleeper</option>
                      <option value="Mini">Mini</option>
                    </select>
                  ) : (bus.bus_type || 'Standard')}
                </td>
                <td>
                  {editingBusId === bus.bus_id ? (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <input
                        value={editForm.from_city}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, from_city: e.target.value }))}
                        placeholder="From"
                      />
                      <input
                        value={editForm.to_city}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, to_city: e.target.value }))}
                        placeholder="To"
                      />
                    </div>
                  ) : (
                    <>
                      {bus.from_city}
                      {' -> '}
                      {bus.to_city}
                    </>
                  )}
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
                <td>{bus.is_active ? 'Active' : 'Inactive'}</td>
                <td className="row-actions">
                  {editingBusId === bus.bus_id ? (
                    <>
                      <button type="button" className="save" onClick={() => handleUpdate(bus.bus_id)}>Save</button>
                      <button type="button" className="ghost" onClick={resetEditForm}>Cancel</button>
                    </>
                  ) : (
                    <button type="button" className="ghost" onClick={() => handleEdit(bus)}>
                      Edit
                    </button>
                  )}
                  <button type="button" className="warn" onClick={() => handleDelete(bus.bus_id)}>
                    Delete
                  </button>
                  <button type="button" onClick={() => handleStatus(bus)}>
                    {bus.is_active ? 'Set Inactive' : 'Set Active'}
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
        totalItems={visibleBuses.length}
        onPageChange={setCurrentPage}
        itemLabel="buses"
      />
    </div>
  )
}

export default BusesCrudSection

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

BusesCrudSection.propTypes = {
  buses: PropTypes.arrayOf(busShape).isRequired,
  onDataChanged: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
}
