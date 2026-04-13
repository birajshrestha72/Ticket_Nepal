// ============================================================================
// Superadmin API Client / Superadmin API Ko Layer
// ============================================================================
// Yo file system-level admin ko backend calls lai separate rakchha.
// This file keeps system admin HTTP calls in one API module.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const SUPERADMIN_API = `${API_BASE}/api/superadmin`

const request = async (path, method = 'GET', body = null) => {
  const response = await fetch(`${SUPERADMIN_API}${path}`, {
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

const requestRoot = async (path, method = 'GET', body = null) => {
  const response = await fetch(`${API_BASE}${path}`, {
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

export const fetchSuperadminData = async () => {
  const [vendorsRes, busesRes, routesRes, schedulesRes, analyticsRes, bookingsRes] = await Promise.all([
    request('/vendors'),
    request('/buses'),
    request('/routes'),
    request('/schedules'),
    request('/analytics'),
    requestRoot('/api/bookings'),
  ])

  return {
    vendors: vendorsRes.vendors || [],
    buses: busesRes.buses || [],
    routes: routesRes.routes || [],
    schedules: schedulesRes.schedules || [],
    analytics: analyticsRes.analytics || null,
    bookings: Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes.bookings || []),
  }
}

export const createVendor = async (payload) => request('/vendors', 'POST', payload)
export const updateVendor = async (vendorId, payload) => request(`/vendors/${vendorId}`, 'PUT', payload)
export const verifyVendor = async (vendorId, isActive) =>
  request(`/vendors/${vendorId}/verify`, 'PATCH', { is_active: isActive })
export const deleteVendor = async (vendorId) => request(`/vendors/${vendorId}`, 'DELETE')

export const createBus = async (payload) => request('/buses', 'POST', payload)
export const updateBus = async (busId, payload) => request(`/buses/${busId}`, 'PUT', payload)
export const deleteBus = async (busId) => request(`/buses/${busId}`, 'DELETE')
export const setBusStatus = async (busId, isActive) =>
  request(`/buses/${busId}/status`, 'PATCH', { is_active: isActive })

export const createRoute = async (payload) => request('/routes', 'POST', payload)
export const updateRoute = async (routeId, payload) => request(`/routes/${routeId}`, 'PUT', payload)
export const deleteRoute = async (routeId) => request(`/routes/${routeId}`, 'DELETE')
export const setRouteStatus = async (routeId, isActive) =>
  request(`/routes/${routeId}/status`, 'PATCH', { is_active: isActive })

export const createSchedule = async (payload) => request('/schedules', 'POST', payload)
export const updateSchedule = async (scheduleId, payload) => request(`/schedules/${scheduleId}`, 'PUT', payload)
export const deleteSchedule = async (scheduleId) => request(`/schedules/${scheduleId}`, 'DELETE')
export const setScheduleStatus = async (scheduleId, isActive) =>
  request(`/schedules/${scheduleId}/status`, 'PATCH', { is_active: isActive })