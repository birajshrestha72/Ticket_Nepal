import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import {
  createSchedule,
  deleteSchedule,
  setScheduleStatus,
  updateSchedule,
} from '../../api/adminApi'
import TablePagination from '../../components/TablePagination'

const PAGE_SIZE = 10

const emptyScheduleForm = {
  bus_id: '',
  route_id: '',
  departure_time: '',
  arrival_time: '',
  fare: '',
}

const SchedulesCrudSection = ({ schedules, buses, routes, onDataChanged, showError, showSuccess }) => {
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm)
  const [editingScheduleId, setEditingScheduleId] = useState(null)
  const [editForm, setEditForm] = useState(emptyScheduleForm)
  const [currentPage, setCurrentPage] = useState(1)

  const busNameMap = useMemo(() => {
    return Object.fromEntries(buses.map((bus) => [bus.bus_id, bus.bus_name]))
  }, [buses])

  const routeNameMap = useMemo(() => {
    return Object.fromEntries(
      routes.map((route) => [route.route_id, `${route.from_city} -> ${route.to_city}`]),
    )
  }, [routes])

  const totalPages = Math.max(1, Math.ceil(schedules.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedSchedules = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return schedules.slice(start, start + PAGE_SIZE)
  }, [safePage, schedules])

  const resetAddForm = () => setScheduleForm(emptyScheduleForm)

  const resetEditForm = () => {
    setEditingScheduleId(null)
    setEditForm(emptyScheduleForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      bus_id: Number(scheduleForm.bus_id),
      route_id: Number(scheduleForm.route_id),
      departure_time: scheduleForm.departure_time,
      arrival_time: scheduleForm.arrival_time,
      fare: Number(scheduleForm.fare),
    }

    try {
      await createSchedule(payload)
      showSuccess('Schedule created successfully')
      resetAddForm()
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleEdit = (schedule) => {
    setEditingScheduleId(schedule.schedule_id)
    setEditForm({
      bus_id: String(schedule.bus_id),
      route_id: String(schedule.route_id),
      departure_time: schedule.departure_time,
      arrival_time: schedule.arrival_time,
      fare: String(schedule.fare),
    })
  }

  const handleUpdate = async (scheduleId) => {
    try {
      await updateSchedule(scheduleId, {
        bus_id: Number(editForm.bus_id),
        route_id: Number(editForm.route_id),
        departure_time: editForm.departure_time,
        arrival_time: editForm.arrival_time,
        fare: Number(editForm.fare),
      })
      showSuccess('Schedule updated successfully')
      resetEditForm()
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleDelete = async (scheduleId) => {
    try {
      await deleteSchedule(scheduleId)
      showSuccess('Schedule deleted successfully')
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  const handleStatus = async (schedule) => {
    try {
      await setScheduleStatus(schedule.schedule_id, !schedule.is_active)
      showSuccess('Schedule status updated')
      await onDataChanged()
    } catch (err) {
      showError(err.message)
    }
  }

  return (
    <div className="admin-section">
      <h2>Schedules</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <select
          value={scheduleForm.bus_id}
          onChange={(e) => setScheduleForm((prev) => ({ ...prev, bus_id: e.target.value }))}
          required
        >
          <option value="">Select Bus</option>
          {buses.map((bus) => (
            <option key={bus.bus_id} value={bus.bus_id}>
              {bus.bus_name}
            </option>
          ))}
        </select>
        <select
          value={scheduleForm.route_id}
          onChange={(e) => setScheduleForm((prev) => ({ ...prev, route_id: e.target.value }))}
          required
        >
          <option value="">Select Route</option>
          {routes.map((route) => (
            <option key={route.route_id} value={route.route_id}>
              {route.from_city}
              {' -> '}
              {route.to_city}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={scheduleForm.departure_time}
          onChange={(e) =>
            setScheduleForm((prev) => ({ ...prev, departure_time: e.target.value }))
          }
          required
        />
        <input
          type="datetime-local"
          value={scheduleForm.arrival_time}
          onChange={(e) => setScheduleForm((prev) => ({ ...prev, arrival_time: e.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Fare"
          value={scheduleForm.fare}
          onChange={(e) => setScheduleForm((prev) => ({ ...prev, fare: e.target.value }))}
          required
        />
        <button type="submit">Add Schedule</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Bus</th>
              <th>Route</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Fare</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSchedules.map((schedule) => (
              <tr key={schedule.schedule_id}>
                <td>{schedule.schedule_id}</td>
                <td>
                  {editingScheduleId === schedule.schedule_id ? (
                    <select
                      value={editForm.bus_id}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, bus_id: e.target.value }))}
                    >
                      {buses.map((bus) => (
                        <option key={bus.bus_id} value={String(bus.bus_id)}>{bus.bus_name}</option>
                      ))}
                    </select>
                  ) : (busNameMap[schedule.bus_id] || schedule.bus_id)}
                </td>
                <td>
                  {editingScheduleId === schedule.schedule_id ? (
                    <select
                      value={editForm.route_id}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, route_id: e.target.value }))}
                    >
                      {routes.map((route) => (
                        <option key={route.route_id} value={String(route.route_id)}>
                          {route.from_city} {'->'} {route.to_city}
                        </option>
                      ))}
                    </select>
                  ) : (routeNameMap[schedule.route_id] || schedule.route_id)}
                </td>
                <td>
                  {editingScheduleId === schedule.schedule_id ? (
                    <input
                      type="datetime-local"
                      value={editForm.departure_time}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, departure_time: e.target.value }))}
                    />
                  ) : schedule.departure_time}
                </td>
                <td>
                  {editingScheduleId === schedule.schedule_id ? (
                    <input
                      type="datetime-local"
                      value={editForm.arrival_time}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, arrival_time: e.target.value }))}
                    />
                  ) : schedule.arrival_time}
                </td>
                <td>
                  {editingScheduleId === schedule.schedule_id ? (
                    <input
                      type="number"
                      value={editForm.fare}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, fare: e.target.value }))}
                    />
                  ) : schedule.fare}
                </td>
                <td>{schedule.is_active ? 'Active' : 'Inactive'}</td>
                <td className="row-actions">
                  {editingScheduleId === schedule.schedule_id ? (
                    <>
                      <button type="button" className="save" onClick={() => handleUpdate(schedule.schedule_id)}>Save</button>
                      <button type="button" className="ghost" onClick={resetEditForm}>Cancel</button>
                    </>
                  ) : (
                    <button type="button" className="ghost" onClick={() => handleEdit(schedule)}>
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="warn"
                    onClick={() => handleDelete(schedule.schedule_id)}
                  >
                    Delete
                  </button>
                  <button type="button" onClick={() => handleStatus(schedule)}>
                    {schedule.is_active ? 'Set Inactive' : 'Set Active'}
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
        totalItems={schedules.length}
        onPageChange={setCurrentPage}
        itemLabel="schedules"
      />
    </div>
  )
}

export default SchedulesCrudSection

const scheduleShape = PropTypes.shape({
  schedule_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  bus_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  route_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  departure_time: PropTypes.string,
  arrival_time: PropTypes.string,
  fare: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  is_active: PropTypes.bool,
})

const busShape = PropTypes.shape({
  bus_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  bus_name: PropTypes.string,
})

const routeShape = PropTypes.shape({
  route_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  from_city: PropTypes.string,
  to_city: PropTypes.string,
})

SchedulesCrudSection.propTypes = {
  schedules: PropTypes.arrayOf(scheduleShape).isRequired,
  buses: PropTypes.arrayOf(busShape).isRequired,
  routes: PropTypes.arrayOf(routeShape).isRequired,
  onDataChanged: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
}
