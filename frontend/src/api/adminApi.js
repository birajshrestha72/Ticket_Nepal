// ============================================================================
// Admin API Client / Admin API Ko Layer
// ============================================================================
// Yo file vendor admin dashboard ko backend calls ko lagi ho.
// This file keeps vendor admin HTTP calls in a dedicated API layer.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const ADMIN_API = `${API_BASE}/api/admin`

const request = async (path, method = 'GET', body = null) => {
  const response = await fetch(`${ADMIN_API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Request failed')
  }

  return data
}

export const fetchAdminDashboardData = async () => {
  const [bookingsRes, busesRes, routesRes, schedulesRes, analyticsRes, reviewsRes] = await Promise.all([
    request('/bookings'),
    request('/buses'),
    request('/routes'),
    request('/schedules'),
    request('/analytics'),
    request('/reviews'),
  ])

  return {
    bookings: bookingsRes.bookings || [],
    buses: busesRes.buses || [],
    routes: routesRes.routes || [],
    schedules: schedulesRes.schedules || [],
    analytics: analyticsRes.analytics || null,
    reviews: reviewsRes.reviews || [],
  }
}

export const createBus = async (payload) => request('/buses', 'POST', payload)
export const updateBus = async (busId, payload) => request(`/buses/${busId}`, 'PUT', payload)
export const deleteBus = async (busId) => request(`/buses/${busId}`, 'DELETE')
export const setBusStatus = async (busId, isActive) =>
  request(`/buses/${busId}/status`, 'PATCH', { is_active: isActive })
export const fetchBusSeatLayout = async (busId) => request(`/buses/${busId}/seats`)
export const saveBusSeatLayout = async (busId, payload) =>
  request(`/buses/${busId}/seats`, 'PUT', payload)

export const createRoute = async (payload) => request('/routes', 'POST', payload)
export const updateRoute = async (routeId, payload) => request(`/routes/${routeId}`, 'PUT', payload)
export const deleteRoute = async (routeId) => request(`/routes/${routeId}`, 'DELETE')
export const setRouteStatus = async (routeId, isActive) =>
  request(`/routes/${routeId}/status`, 'PATCH', { is_active: isActive })

export const createSchedule = async (payload) => request('/schedules', 'POST', payload)
export const updateSchedule = async (scheduleId, payload) =>
  request(`/schedules/${scheduleId}`, 'PUT', payload)
export const deleteSchedule = async (scheduleId) => request(`/schedules/${scheduleId}`, 'DELETE')
export const setScheduleStatus = async (scheduleId, isActive) =>
  request(`/schedules/${scheduleId}/status`, 'PATCH', { is_active: isActive })