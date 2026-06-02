-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies for Supabase — eco-ia CRM
-- ═══════════════════════════════════════════════════════════════════════════
-- شغّل هذا الملف في Supabase Dashboard → SQL Editor
--
-- يُمكّن الواجهة الأمامية (React Dashboard) من الوصول المباشر لـ Supabase
-- باستخدام Anon Key (آمن + محدود الصلاحيات)
--
-- ⚠️ للـ production: استبدل `true` بـ RLS أكثر تقييداً (مثلاً: auth.uid() = user_id)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. تأكد من تفعيل RLS على الجداول
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage      ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. حذف الـ policies القديمة (إذا وُجدت) لتجنب التعارض
-- ─────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_read_products"       ON products;
DROP POLICY IF EXISTS "anon_write_products"      ON products;
DROP POLICY IF EXISTS "anon_read_orders"         ON orders;
DROP POLICY IF EXISTS "anon_write_orders"        ON orders;
DROP POLICY IF EXISTS "anon_read_conversations"  ON conversations;
DROP POLICY IF EXISTS "anon_write_conversations" ON conversations;
DROP POLICY IF EXISTS "anon_read_customers"      ON customers;
DROP POLICY IF EXISTS "anon_read_token_usage"    ON token_usage;
DROP POLICY IF EXISTS "anon_all_products"        ON products;
DROP POLICY IF EXISTS "anon_all_orders"          ON orders;
DROP POLICY IF EXISTS "anon_all_conversations"   ON conversations;
DROP POLICY IF EXISTS "anon_all_customers"       ON customers;
DROP POLICY IF EXISTS "anon_all_token_usage"     ON token_usage;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. 📦 PRODUCTS — CRUD كامل (anon role)
-- ─────────────────────────────────────────────────────────────────────────
CREATE POLICY "anon_all_products" ON products
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. 🛒 ORDERS — CRUD كامل (anon role)
-- ─────────────────────────────────────────────────────────────────────────
CREATE POLICY "anon_all_orders" ON orders
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. 💬 CONVERSATIONS — CRUD كامل (anon role)
-- ─────────────────────────────────────────────────────────────────────────
CREATE POLICY "anon_all_conversations" ON conversations
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. 👥 CUSTOMERS — قراءة + كتابة (anon role)
-- ─────────────────────────────────────────────────────────────────────────
CREATE POLICY "anon_all_customers" ON customers
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. 📊 TOKEN_USAGE — قراءة فقط (anon role)
-- ⚠️ الكتابة فقط عبر Backend (تحتاج SERVICE_ROLE)
-- ─────────────────────────────────────────────────────────────────────────
CREATE POLICY "anon_read_token_usage" ON token_usage
  FOR SELECT TO anon
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. ⚙️ APP_CONFIG — قراءة فقط (anon role)
-- ─────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_read_app_config" ON app_config;
CREATE POLICY "anon_read_app_config" ON app_config
  FOR SELECT TO anon
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 9. 📱 WHATSAPP_ACCOUNTS — قراءة فقط (anon role)
-- ⚠️ الكتابة فقط عبر Backend (تحتاج SERVICE_ROLE + encryption)
-- ─────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_read_whatsapp_accounts" ON whatsapp_accounts;
CREATE POLICY "anon_read_whatsapp_accounts" ON whatsapp_accounts
  FOR SELECT TO anon
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 10. زيادة طول عمود ID من VARCHAR(10) إلى VARCHAR(20)
-- لإصلاح خطأ "value too long for type character varying(10)"
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE products ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE orders   ALTER COLUMN id TYPE VARCHAR(30);

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ تم! الواجهة الآن تستطيع الوصول المباشر لـ Supabase
-- ═══════════════════════════════════════════════════════════════════════════
