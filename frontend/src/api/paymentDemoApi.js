const DEMO_API_BASE = import.meta.env.VITE_PAYMENT_DEMO_API_BASE || 'http://localhost:8000'

const readError = async (response) => {
  try {
    const body = await response.json()
    return body.detail || 'Request failed'
  } catch {
    return 'Request failed'
  }
}

const request = async (path, options) => {
  const { headers: customHeaders, ...restOptions } = options || {}
  const response = await fetch(`${DEMO_API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    ...restOptions,
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return response.json()
}

export const initiateKhaltiDemo = (payload) => request('/api/payment/khalti/initiate', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const verifyKhaltiDemo = (pidx) => request('/api/payment/khalti/verify', {
  method: 'POST',
  body: JSON.stringify({ pidx }),
})

export const initiateEsewaDemo = (payload) => request('/api/payment/esewa/initiate', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const verifyEsewaDemo = (transactionUuid, totalAmount) => request(
  `/api/payment/esewa/verify?transaction_uuid=${encodeURIComponent(transactionUuid)}&total_amount=${encodeURIComponent(totalAmount)}`,
)

export const manualConfirmDemo = (transactionId) => request('/api/payment/manual/confirm', {
  method: 'POST',
  body: JSON.stringify({ transaction_id: transactionId }),
})
