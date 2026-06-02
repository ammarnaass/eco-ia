-- CRM Database Schema — PostgreSQL 16 (Supabase)
-- Run in Supabase SQL Editor

-- WhatsApp accounts (encrypted tokens)
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id TEXT NOT NULL,
  waba_id         TEXT DEFAULT '',
  label           TEXT DEFAULT 'Default',
  access_token    TEXT NOT NULL,        -- encrypted via utils/encryption.js
  verify_token    TEXT NOT NULL,        -- encrypted via utils/encryption.js
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      VARCHAR(20),
  platform_id   VARCHAR(100) UNIQUE,
  name          VARCHAR(200),
  phone         VARCHAR(20),
  wilaya        VARCHAR(50),
  address       TEXT,
  total_orders  INTEGER DEFAULT 0,
  total_spent   DECIMAL(12,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID REFERENCES customers(id) ON DELETE CASCADE,
  platform      VARCHAR(20),
  status        VARCHAR(20) DEFAULT 'open',
  ai_model      VARCHAR(50),
  messages      JSONB DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id             VARCHAR(20) PRIMARY KEY,
  customer_id    UUID REFERENCES customers(id),
  platform       VARCHAR(20),
  status         VARCHAR(20) DEFAULT 'CONFIRMED',
  items          JSONB DEFAULT '[]'::jsonb,
  items_total    DECIMAL(10,2) DEFAULT 0,
  shipping_cost  DECIMAL(8,2) DEFAULT 0,
  grand_total    DECIMAL(10,2) DEFAULT 0,
  wilaya         VARCHAR(50),
  address        TEXT,
  phone          VARCHAR(20),
  tracking_code  VARCHAR(100),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id            VARCHAR(10) PRIMARY KEY,
  name_ar       VARCHAR(200),
  name_fr       VARCHAR(200),
  price_dzd     DECIMAL(10,2) DEFAULT 0,
  stock         INTEGER DEFAULT 0,
  active        BOOLEAN DEFAULT true,
  category      VARCHAR(100),
  weight_kg     DECIMAL(5,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Token usage tracking
CREATE TABLE IF NOT EXISTS token_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp       TIMESTAMPTZ DEFAULT NOW(),
  provider        VARCHAR(20),
  model           VARCHAR(50),
  input_tokens    INTEGER DEFAULT 0,
  output_tokens   INTEGER DEFAULT 0,
  cost_usd        DECIMAL(10,6) DEFAULT 0,
  platform        VARCHAR(20),
  customer_id     VARCHAR(100)
);

-- Shipping zones
CREATE TABLE IF NOT EXISTS shipping_zones (
  zone_id   VARCHAR(10) PRIMARY KEY,
  name      VARCHAR(100),
  price     INTEGER DEFAULT 0,
  wilayas   TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App configuration (key-value store)
CREATE TABLE IF NOT EXISTS app_config (
  key       TEXT PRIMARY KEY,
  value     TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_verify ON whatsapp_accounts(verify_token);
CREATE INDEX IF NOT EXISTS idx_customers_platform ON customers(platform, platform_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_date ON token_usage(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_provider ON token_usage(provider);
CREATE INDEX IF NOT EXISTS idx_token_usage_platform ON token_usage(platform);

-- Seed products
INSERT INTO products (id, name_ar, name_fr, price_dzd, stock, category) VALUES
  ('P01', 'حذاء رياضي أبيض', 'Basket Blanc', 3500, 45, 'أحذية'),
  ('P02', 'قميص كلاسيكي أزرق', 'Chemise Bleue', 2800, 30, 'ملابس'),
  ('P03', 'حقيبة جلد بنية', 'Sac Cuir Brun', 5200, 12, 'إكسسوارات'),
  ('P04', 'ساعة ذكية سوداء', 'Montre Smart', 8900, 8, 'إلكترونيات'),
  ('P05', 'نظارة شمسية', 'Lunettes Soleil', 1900, 60, 'إكسسوارات')
ON CONFLICT (id) DO NOTHING;

-- Seed shipping zones
INSERT INTO shipping_zones (zone_id, name, price, wilayas) VALUES
  ('Z1', 'المركز',  400, ARRAY['16','09','42']),
  ('Z2', 'الشرق',   500, ARRAY['25','23','19']),
  ('Z3', 'الغرب',   500, ARRAY['31','13','22']),
  ('Z4', 'الجنوب',  700, ARRAY['07','30','01']),
  ('Z5', 'الهضاب',  550, ARRAY['28','05','34'])
ON CONFLICT (zone_id) DO NOTHING;
