/**
 * dataService — طبقة وسيطة موحدة للوصول للبيانات
 *
 * الاستراتيجية:
 *   - READ (GET) → Backend (crm-bot) — يعمل دائماً، يدعم joins/computed
 *   - WRITE (POST/PUT/DELETE) → Supabase مباشرة (أسرع) + Backend fallback
 *   - المنطق المعقد (AI, PDF, Email, WhatsApp) → Backend دائماً
 *
 * في حال فشل أي مصدر → fallback تلقائي.
 */

import { api } from '../api.js'
import { supabase, isSupabaseConfigured } from '../utils/supabase.js'

// ── Helper: Read (Backend primary, no fallback needed) ──────────────────
// Backend uses SERVICE_ROLE (bypasses RLS) so it always returns real data.
// We just call it directly — simpler and more reliable.
const read = (backendCall) => async () => {
  try {
    const data = await backendCall()
    return { data, source: 'backend' }
  } catch (e) {
    console.error('[dataService] Backend read failed:', e.message)
    throw e
  }
}

// ── Helper: Write (Direct Supabase → Backend fallback) ───────────────────
async function writeWithFallback(supabaseCall, backendCall) {
  if (!isSupabaseConfigured) {
    const data = await backendCall()
    return { data, source: 'backend' }
  }
  try {
    const result = await supabaseCall()
    if (result.error) throw result.error
    return { data: result.data, source: 'supabase' }
  } catch (e) {
    console.warn('[dataService] Supabase write failed, falling back to Backend:', e.message)
    try {
      const data = await backendCall()
      return { data, source: 'backend' }
    } catch (backendError) {
      throw backendError
    }
  }
}

export const dataService = {
  // ════════════════════════════════════════════════════════════════════════
  // 📦 PRODUCTS — قراءة من Backend (دائماً تعمل)، كتابة على Supabase
  // ════════════════════════════════════════════════════════════════════════
  products: {
    list: read(() => api.getProducts()),
    get: (id) => read(() => api.getProducts().then(arr => arr.find(p => p.id === id))),
    create: (data) => writeWithFallback(
      () => supabase.from('products').insert(data).select().single(),
      () => api.createProduct(data)
    ),
    update: (id, data) => writeWithFallback(
      () => supabase.from('products').update(data).eq('id', id).select().single(),
      () => api.updateProduct(id, data)
    ),
    delete: (id) => writeWithFallback(
      () => supabase.from('products').delete().eq('id', id),
      () => api.deleteProduct(id)
    ),
  },

  // ════════════════════════════════════════════════════════════════════════
  // 🛒 ORDERS — قراءة من Backend، كتابة على Supabase
  // ════════════════════════════════════════════════════════════════════════
  orders: {
    list: read(() => api.getOrders()),
    get: (id) => read(() => api.getOrders().then(arr => arr.find(o => o.id === id))),
    update: (id, data) => writeWithFallback(
      () => supabase.from('orders').update(data).eq('id', id).select().single(),
      () => api.updateOrder(id, data)
    ),
    // تنفيذ الطلبات يبقى عبر Backend (يحتاج PDF + Email + WhatsApp)
    sendWhatsApp: (id) => api.sendOrderWhatsApp(id),
    sendEmail: (id, email) => api.sendOrderEmail(id, email),
  },

  // ════════════════════════════════════════════════════════════════════════
  // 💬 CONVERSATIONS — قراءة من Backend، ردود من Backend (AI)
  // ════════════════════════════════════════════════════════════════════════
  conversations: {
    list: read(() => api.getConversations()),
    // الردود عبر Backend (AI يحتاج مفاتيح + منطق + SSE broadcast)
    sendManualReply: (customerId, message, platform) =>
      api.sendManualReply(customerId, message, platform),
    sendAIReply: (customerId, message, platform) =>
      api.sendAIReply(customerId, message, platform),
  },

  // ════════════════════════════════════════════════════════════════════════
  // 👥 CUSTOMERS — قراءة من Backend
  // ════════════════════════════════════════════════════════════════════════
  customers: {
    list: read(() => Promise.resolve([])),
  },

  // ════════════════════════════════════════════════════════════════════════
  // 📊 TOKENS / ANALYTICS — عبر Backend (حسابات مُجمّعة + AI tracking)
  // ════════════════════════════════════════════════════════════════════════
  analytics: {
    dashboard: () => api.getDashboardStats(),
    summary:    (from, to) => api.getTokenSummary(from, to),
    byModel:    () => api.getTokensByModel(),
    byPlatform: () => api.getTokensByPlatform(),
  },

  // ════════════════════════════════════════════════════════════════════════
  // ⚙️ CONFIG / SETTINGS — عبر Backend (آمن + تشفير)
  // ════════════════════════════════════════════════════════════════════════
  config: {
    get: () => api.getConfig(),
    save: (entries) => api.saveConfig(entries),
  },

  // ════════════════════════════════════════════════════════════════════════
  // 📱 WHATSAPP ACCOUNTS — عبر Backend (مشفّر AES-256-GCM)
  // ════════════════════════════════════════════════════════════════════════
  whatsapp: {
    list:   () => api.getWhatsAppAccounts(),
    get:    (id) => api.getWhatsAppAccount(id),
    create: (data) => api.createWhatsAppAccount(data),
    delete: (id) => api.deleteWhatsAppAccount(id),
  },

  // ── Status ─────────────────────────────────────────────────
  isOnline: isSupabaseConfigured,
}

export { supabase, isSupabaseConfigured }
export default dataService
