const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function fetchJSON(url, options) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json()
}

export const api = {
  getConfig: () => fetchJSON('/config'),
  saveConfig: (entries) => fetchJSON('/config', { method: 'POST', body: JSON.stringify({ entries }) }),
  getDashboardStats: () => fetchJSON('/dashboard/stats'),
  getProducts: () => fetchJSON('/products'),
  createProduct: (data) => fetchJSON('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => fetchJSON(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => fetchJSON(`/products/${id}`, { method: 'DELETE' }),
  getShipping: () => fetchJSON('/shipping'),
  getConversations: () => fetchJSON('/conversations'),
  getOrders: () => fetchJSON('/orders'),
  getTokenSummary: (from, to) => fetchJSON(`/tokens/summary${from ? `?from=${from}&to=${to || ''}` : ''}`),
  getTokensByModel: () => fetchJSON('/tokens/by-model'),
  getTokensByPlatform: () => fetchJSON('/tokens/by-platform'),
  sendAIReply: (customerId, message, platform) =>
    fetchJSON('/ai-reply', { method: 'POST', body: JSON.stringify({ customer_id: customerId, message, platform }) }),
  sendManualReply: (customerId, message, platform) =>
    fetchJSON(`/conversations/${customerId}/reply`, { method: 'POST', body: JSON.stringify({ message, platform }) }),
  // WhatsApp account management
  getWhatsAppAccounts: () => fetchJSON('/whatsapp/accounts'),
  getWhatsAppAccount: (id) => fetchJSON(`/whatsapp/accounts/${id}`),
  createWhatsAppAccount: (data) =>
    fetchJSON('/whatsapp/accounts', { method: 'POST', body: JSON.stringify(data) }),
  deleteWhatsAppAccount: (id) =>
    fetchJSON(`/whatsapp/accounts/${id}`, { method: 'DELETE' }),
  // Order management
  updateOrder: (id, data) =>
    fetchJSON(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendOrderWhatsApp: (id) =>
    fetchJSON(`/orders/${id}/send-whatsapp`, { method: 'POST' }),
  sendOrderEmail: (id, email) =>
    fetchJSON(`/orders/${id}/send-email`, { method: 'POST', body: JSON.stringify({ email }) }),
  // Meta connection test (for Facebook/Instagram)
  testConnection: (platform) =>
    fetchJSON(`/test-connection?platform=${platform}`, { method: 'POST' }),
  // WhatsApp info + test
  getWhatsAppInfo: () => fetchJSON('/whatsapp/info'),
  testWhatsAppConnection: () => fetchJSON('/whatsapp/test-connection', { method: 'POST' }),
  sendWhatsAppTest: (data) => fetchJSON('/whatsapp/send-test', { method: 'POST', body: JSON.stringify(data) }),
}
