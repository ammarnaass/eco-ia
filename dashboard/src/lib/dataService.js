/**
 * dataService — طبقة وسيطة موحدة للوصول للبيانات
 *
 * الاستراتيجية المختلطة:
 *   - READ  (GET)    → Supabase مباشرة (سريع، بسيط)
 *   - WRITE (POST/PUT/DELETE) + منطق معقد (AI, PDF, Email)
 *                    → Backend (crm-bot) عبر api.js
 *
 * في حال فشل Supabase (RLS, network) → fallback تلقائي على Backend.
 */

import { supabase, isSupabaseConfigured } from '../utils/supabase.js'
import { api } from '../api.js'

const notConfigured = () => {
  throw new Error('Supabase غير مهيأ — تأكد من VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY')
}

async function withFallback(supabaseCall, backendCall) {
  if (!isSupabaseConfigured) {
    return backendCall()
  }
  try {
    const result = await supabaseCall()
    if (result.error) throw result.error
    return { data: result.data, source: 'supabase' }
  } catch (e) {
    console.warn('[dataService] Supabase failed, falling back to Backend:', e.message)
    const data = await backendCall()
    return { data, source: 'backend' }
  }
}

export const dataService = {
  // ─── Products ─────────────────────────────────────────────
  products: {
    list: () => withFallback(
      () => supabase.from('products').select('*').order('id'),
      () => api.getProducts()
    ),
    get: (id) => withFallback(
      () => supabase.from('products').select('*').eq('id', id).single(),
      () => api.getProducts().then(arr => arr.find(p => p.id === id))
    ),
    create: (data) => api.createProduct(data),
    update: (id, data) => api.updateProduct(id, data),
    delete: (id) => api.deleteProduct(id),
  },

  // ─── Orders ───────────────────────────────────────────────
  orders: {
    list: () => withFallback(
      () => supabase.from('orders').select('*').order('created_at', { ascending: false }),
      () => api.getOrders()
    ),
    get: (id) => withFallback(
      () => supabase.from('orders').select('*').eq('id', id).single(),
      () => api.getOrders().then(arr => arr.find(o => o.id === id))
    ),
    update: (id, data) => api.updateOrder(id, data),
    sendWhatsApp: (id) => api.sendOrderWhatsApp(id),
    sendEmail: (id, email) => api.sendOrderEmail(id, email),
  },

  // ─── Conversations ────────────────────────────────────────
  conversations: {
    list: () => withFallback(
      () => supabase.from('conversations').select('*').order('updated_at', { ascending: false }),
      () => api.getConversations()
    ),
    sendManualReply: (customerId, message, platform) =>
      api.sendManualReply(customerId, message, platform),
    sendAIReply: (customerId, message, platform) =>
      api.sendAIReply(customerId, message, platform),
  },

  // ─── Customers ────────────────────────────────────────────
  customers: {
    list: () => withFallback(
      () => supabase.from('customers').select('*').order('created_at', { ascending: false }),
      () => Promise.resolve([])
    ),
  },

  // ─── Tokens / Analytics ───────────────────────────────────
  // (تذهب عبر Backend دائماً — تتطلب حسابات مُجمّعة)
  analytics: {
    dashboard: () => api.getDashboardStats(),
    summary:   (from, to) => api.getTokenSummary(from, to),
    byModel:   () => api.getTokensByModel(),
    byPlatform:() => api.getTokensByPlatform(),
  },

  // ─── Config / Settings ────────────────────────────────────
  config: {
    get: () => api.getConfig(),
    save: (entries) => api.saveConfig(entries),
  },

  // ─── WhatsApp accounts (encrypted in Backend only) ────────
  whatsapp: {
    list:   () => api.getWhatsAppAccounts(),
    get:    (id) => api.getWhatsAppAccount(id),
    create: (data) => api.createWhatsAppAccount(data),
    delete: (id) => api.deleteWhatsAppAccount(id),
  },

  // ─── Status ───────────────────────────────────────────────
  isOnline: isSupabaseConfigured,
}

export { supabase, isSupabaseConfigured }
export default dataService
