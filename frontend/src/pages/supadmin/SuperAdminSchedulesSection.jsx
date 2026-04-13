import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import {
  createSchedule,
  deleteSchedule,
  setScheduleStatus,
  updateSchedule,
} from '../../api/superadminApi'
import TablePagination from '../../components/TablePagination'

const PAGE_SIZE = 10

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

const scheduleFormShape = PropTypes.shape({
  bus_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  route_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  departure_time: PropTypes.string,
  arrival_time: PropTypes.string,
  fare: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
})

const SuperAdminSchedulesSection = ({
  scheduleForm,
  setScheduleForm,
  schedules,
  buses,
  routes,
  saving,
  withAction,
}) => {
  const [editingScheduleId, setEditingScheduleId] = useState(null)
  const [editForm, setEditForm] = useState({
    bus_id: '',
    route_id: '',
    departure_time: '',
    arrival_time: '',
    fare: '',
  })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const visibleSchedules = useMemo(() => {
    const q = query.trim().toLowerCase()
    return schedules.filter((item) => {
      const status = item.is_active ? 'active' : 'inactive'
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      if (!matchesStatus) return false
      if (!q) return true

      const text = `${item.schedule_id || ''} ${item.bus_id || ''} ${item.route_id || ''} ${item.fare || ''}`.toLowerCase()
      return text.includes(q)
    })
  }, [query, schedules, statusFilter])

  const totalPages = Math.max(1, Math.ceil(visibleSchedules.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedSchedules = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return visibleSchedules.slice(start, start + PAGE_SIZE)
  }, [safePage, visibleSchedules])

  const startEdit = (schedule) => {
    setEditingScheduleId(schedule.schedule_id)
    setEditForm({
      bus_id: String(schedule.bus_id || ''),
      route_id: String(schedule.route_id || ''),
      departure_time: schedule.departure_time || '',
      arrival_time: schedule.arrival_time || '',
      fare: String(schedule.fare || ''),
    })
  }

  const cancelEdit = () => {
    setEditingScheduleId(null)
    setEditForm({
      bus_id: '',
      route_id: '',
      departure_time: '',
      arrival_time: '',
      fare: '',
    })
  }

  return (
    <section className="admin-section">
      <h2>Schedule Management</h2>
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault()
          withAction(
            () => createSchedule({
              bus_id: Number(scheduleForm.bus_id),
              route_id: Number(scheduleForm.route_id),
              departure_time: scheduleForm.departure_time,
              arrival_time: scheduleForm.arrival_time,
              fare: Number(scheduleForm.fare),
            }),
            'Schedule created.',
          )
        }}
      >
        <select
          value={scheduleForm.bus_id}
          onChange={(e) => setScheduleForm((prev) => ({ ...prev, bus_id: e.target.value }))}
          required
        >
          <option value="" disabled>
            Select bus
          </option>
          {buses.map((item) => (
            <option key={item.bus_id} value={item.bus_id}>
              {item.bus_name}
            </option>
          ))}
        </select>
        <select
          value={scheduleForm.route_id}
          onChange={(e) => setScheduleForm((prev) => ({ ...prev, route_id: e.target.value }))}
          required
        >
          <option value="" disabled>
            Select route
          </option>
          {routes.map((item) => (
            <option key={item.route_id} value={item.route_id}>
              {item.from_city} {'->'} {item.to_city}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={scheduleForm.departure_time}
          onChange={(e) => setScheduleForm((prev) => ({ ...prev, departure_time: e.target.value }))}
          required
        />
        <input
          type="time"
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
        <button type="submit" disabled={saving}>
          Add Schedule
        </button>
      </form>
      <div className="admin-table-wrap">
        <div className="table-filter-row">
          <input
            type="text"
            placeholder="Search schedule/bus/route"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Bus</th>
              <th>Route ID</th>
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
                      {buses.map((item) => (
                        <option key={item.bus_id} value={String(item.bus_id)}>{item.bus_name}</option>
                      ))}
                    </select>
                  ) : schedule.bus_id}
                </td>
                <td>
                  {editingScheduleId === schedule.schedule_id ? (
                    <select
                      value={editForm.route_id}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, route_id: e.target.value }))}
                    >
                      {routes.map((item) => (
                        <option key={item.route_id} value={String(item.route_id)}>{item.from_city} {'->'} {item.to_city}</option>
                      ))}
                    </select>
                  ) : schedule.route_id}
                </td>
                <td>
                  {editingScheduleId === schedule.schedule_id ? (
                    <input
                      type="time"
                      value={editForm.departure_time}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, departure_time: e.target.value }))}
                    />
                  ) : (schedule.departure_time?.slice(11, 16) || '--:--')}
                </td>
                <td>
                  {editingScheduleId === schedule.schedule_id ? (
                    <input
                      type="time"
                      value={editForm.arrival_time}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, arrival_time: e.target.value }))}
                    />
                  ) : (schedule.arrival_time?.slice(11, 16) || '--:--')}
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
                <td>
                  <span className={`vendor-status ${schedule.is_active ? 'verified' : 'pending'}`}>
                    {schedule.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {editingScheduleId === schedule.schedule_id ? (
                      <>
                        <button
                          type="button"
                          className="save"
                          onClick={() => withAction(
                            () => updateSchedule(schedule.schedule_id, {
                              bus_id: Number(editForm.bus_id),
                              route_id: Number(editForm.route_id),
                              departure_time: editForm.departure_time,
                              arrival_time: editForm.arrival_time,
                              fare: Number(editForm.fare),
                            }),
                            'Schedule updated.',
                          ).then(cancelEdit)}
                        >
                          Save
                        </button>
                        <button type="button" className="ghost" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => startEdit(schedule)}>
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => withAction(
                        () => setScheduleStatus(schedule.schedule_id, !schedule.is_active),
                        schedule.is_active ? 'Schedule deactivated.' : 'Schedule activated.',
                      )}
                    >
                      {schedule.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="warn"
                      onClick={() => withAction(() => deleteSchedule(schedule.schedule_id), 'Schedule deleted.')}
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
        totalItems={visibleSchedules.length}
        onPageChange={setCurrentPage}
        itemLabel="schedules"
      />
    </section>
  )
}

SuperAdminSchedulesSection.propTypes = {
  scheduleForm: scheduleFormShape.isRequired,
  setScheduleForm: PropTypes.func.isRequired,
  schedules: PropTypes.arrayOf(scheduleShape).isRequired,
  buses: PropTypes.arrayOf(busShape).isRequired,
  routes: PropTypes.arrayOf(routeShape).isRequired,
  saving: PropTypes.bool.isRequired,
  withAction: PropTypes.func.isRequired,
}

export default SuperAdminSchedulesSection
