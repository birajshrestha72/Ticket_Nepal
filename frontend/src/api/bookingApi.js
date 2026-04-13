// ============================================================================
// Booking API Client / Booking API Ko Layer
// ============================================================================
// Yo file ma booking related backend calls rakheko chha.
// This file keeps booking-related HTTP requests in one API layer.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export const fetchActiveBuses = async () => {
  const response = await fetch(`${API_BASE}/api/buses`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load buses')
  }
  return Array.isArray(data) ? data : (data.buses || [])
}

export const fetchSearchLocations = async () => {
  const response = await fetch(`${API_BASE}/api/buses/locations`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load search locations')
  }
  return Array.isArray(data) ? data : (data.locations || [])
}

export const fetchSeatAvailability = async (busId, journeyDate, bookingId = null, userId = null) => {
  const params = new URLSearchParams({
    bus_id: String(busId),
    journey_date: String(journeyDate),
  })
  if (bookingId) {
    params.set('booking_id', String(bookingId))
  }
  if (userId) {
    params.set('user_id', String(userId))
  }

  const response = await fetch(`${API_BASE}/api/bookings/seat-availability?${params.toString()}`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load seat availability')
  }
  return data.availability
}

export const fetchUserBookings = async (userId) => {
  const response = await fetch(`${API_BASE}/api/bookings?user_id=${userId}`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load bookings')
  }
  return Array.isArray(data) ? data : []
}

export const replaceBookingSeats = async (bookingId, payload) => {
  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/seats/replace`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update seat selection')
  }
  return data
}

export const fetchRefundEstimate = async (bookingId, userId, removeSeatLabels = []) => {
  const params = new URLSearchParams({ user_id: String(userId) })
  if (removeSeatLabels.length > 0) {
    params.set('remove_seat_labels', removeSeatLabels.join(','))
  }

  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/refund-estimate?${params.toString()}`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load refund estimate')
  }
  return data.estimate
}

export const createBooking = async (payload) => {
  const response = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to create booking')
  }
  return data.booking
}

export const confirmBookingPayment = async (bookingId, payload) => {
  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update payment')
  }
  return data.booking
}

export const verifyEsewaPayment = async (bookingId, payload) => {
  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/payment/esewa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to verify eSewa payment')
  }
  return data
}

export const verifyKhaltiPayment = async (bookingId, payload) => {
  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/payment/khalti/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to verify Khalti payment')
  }
  return data
}

export const downloadTicketPdf = async (bookingId, userId) => {
  const url = new URL(`${API_BASE}/api/bookings/${bookingId}/ticket.pdf`)
  url.searchParams.set('user_id', String(userId))

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Failed to download ticket')
  }

  const blob = await response.blob()
  const downloadUrl = globalThis.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `ticket_BK${bookingId}.pdf`
  globalThis.document.body.appendChild(link)
  link.click()
  link.remove()
  globalThis.URL.revokeObjectURL(downloadUrl)
}

export const initiateEsewaPayment = async (bookingId, payload) => {
  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/payment/esewa/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to initiate eSewa payment')
  }
  return data
}

export const initiateKhaltiPayment = async (bookingId, payload) => {
  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/payment/khalti/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to initiate Khalti payment')
  }
  return data
}

export const createPaymentOrder = async (payload) => {
  const response = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to create payment order')
  }
  return data.order
}

export const initiateKhaltiOrder = async (payload) => {
  const response = await fetch(`${API_BASE}/api/payments/khalti/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to initiate Khalti checkout')
  }
  return data.payment
}

export const verifyKhaltiOrderByPidx = async (pidx) => {
  const response = await fetch(`${API_BASE}/api/payment/khalti/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pidx }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to verify Khalti checkout')
  }
  return data.payment || data
}

export const initiateEsewaOrder = async (payload) => {
  const response = await fetch(`${API_BASE}/api/payments/esewa/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to initiate eSewa checkout')
  }
  return data.payment
}

export const simulateRefund = async (payload) => {
  const response = await fetch(`${API_BASE}/api/payments/refund-simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to simulate refund')
  }
  return data.refund
}