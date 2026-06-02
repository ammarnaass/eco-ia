/**
 * dataService — طبقة وسيطة موحدة للوصول للبيانات
 *
 * الاستراتيجية المختلطة الذكية:
 *   - Supabase (مباشر): المنتجات CRUD + الطلبات CRUD + استعلامات التوكنز
 *   - Backend: AI، تنفيذ الطلبات (PDF/Email/WhatsApp)، ردود، روابط منصات التوكنز
 *
 * في حال فشل Supabase (RLS, network) → fallback تلقائي على Backend.
 */

import { supabase, isSupabaseConfigured } from '../utils/supabase.js'
import { api } from '../api.js'

// ── Helper: Read with Supabase → Backend fallback ────────────────────────
async function withFallback(supabaseCall, backendCall) {
  if (!isSupabaseConfigured) {
    const data = await backendCall()
    return { data, source: 'backend' }
  }
  try {
    const result = await supabaseCall()
    if (result.error) throw result.error
    return { data: result.data, source: 'supabase' }
  } catch (e) {
    console.warn('[dataService] Supabase read failed, falling back to Backend:', e.message)
    const data = await backendCall()
    return { data, source: 'backend' }
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
  // 📦 PRODUCTS — عبر Supabase مباشرة (CRUD كامل)
  // ════════════════════════════════════════════════════════════════════════
  products: {
    list: () => withFallback(
      () => supabase.from('products').select('*').order('id'),
      () => api.getProducts()
    ),
    get: (id) => withFallback(
      () => supabase.from('products').select('*').eq('id', id).maybeSingle(),
      () => api.getProducts().then(arr => arr.find(p => p.id === id))
    ),
    create: (data) => writeWithFallback(
      () => supabase.from('products').insert(data).select().single(),
      () => api.createProduct(data)
    ),
    update: (id, data) => writeWithFallback(
      () => supabase.from('products').update(data).eq('id', id).select().single(),
      () => api.updateProduct(id, data)
    ),
    delete: (id) => writeWithFallback(
      () => supabase.from('products').delete().eq('id', id).select().single(),
      () => api.deleteProduct(id)
    ),
  },

  // ════════════════════════════════════════════════════════════════════════
  // 🛒 ORDERS — عبر Supabase للقراءة/التعديل، Backend للتنفيذ
  // ════════════════════════════════════════════════════════════════════════
  orders: {
    list: () => withFallback(
      () => supabase.from('orders').select('*').order('created_at', { ascending: false }),
      () => api.getOrders()
    ),
    get: (id) => withFallback(
      () => supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      () => api.getOrders().then(arr => arr.find(o => o.id === id))
    ),
    update: (id, data) => writeWithFallback(
      () => supabase.from('orders').update(data).eq('id', id).select().single(),
      () => api.updateOrder(id, data)
    ),
    // تنفيذ الطلبات يبقى عبر Backend (يحتاج PDF + Email + WhatsApp)
    sendWhatsApp: (id) => api.sendOrderWhatsApp(id),
    sendEmail: (id, email) => api.sendOrderEmail(id, email),
  },

  // ════════════════════════════════════════════════════════════════════════
  // 💬 CONVERSATIONS — قراءة من Supabase، ردود من Backend
  // ════════════════════════════════════════════════════════════════════════
  conversations: {
    list: () => withFallback(
      () => supabase.from('conversations').select('*').order('updated_at', { ascending: false }),
      () => api.getConversations()
    ),
    // الردود عبر Backend (AI يحتاج مفاتيح + منطق + SSE broadcast)
    sendManualReply: (customerId, message, platform) =>
      api.sendManualReply(customerId, message, platform),
    sendAIReply: (customerId, message, platform) =>
      api.sendAIReply(customerId, message, platform),
  },

  // ════════════════════════════════════════════════════════════════════════
  // 👥 CUSTOMERS — قراءة من Supabase
  // ════════════════════════════════════════════════════════════════════════
  customers: {
    list: () => withFallback(
      () => supabase.from('customers').select('*').order('created_at', { ascending: false }),
      () => Promise.resolve([])
    ),
  },

  // ════════════════════════════════════════════════════════════════════════
  // 📊 TOKENS / ANALYTICS — عبر Backend (حسابات مُجمّعة + روابط منصات)
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
