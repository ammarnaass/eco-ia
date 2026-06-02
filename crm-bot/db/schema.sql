-- CRM Database Schema
-- PostgreSQL 16

CREATE TABLE IF NOT EXISTS customers (
  id            SERIAL PRIMARY KEY,
  platform      VARCHAR(20),
  platform_id   VARCHAR(100) UNIQUE,
  name          VARCHAR(200),
  phone         VARCHAR(20),
  wilaya        VARCHAR(50),
  address       TEXT,
  total_orders  INTEGER DEFAULT 0,
  total_spent   DECIMAL(12,2) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER REFERENCES customers(id),
  platform      VARCHAR(20),
  status        VARCHAR(20) DEFAULT 'open',
  ai_model      VARCHAR(50),
  messages      JSONB DEFAULT '[]',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id             VARCHAR(20) PRIMARY KEY,
  customer_id    INTEGER REFERENCES customers(id),
  platform       VARCHAR(20),
  status         VARCHAR(20) DEFAULT 'CONFIRMED',
  items          JSONB,
  items_total    DECIMAL(10,2),
  shipping_cost  DECIMAL(8,2),
  grand_total    DECIMAL(10,2),
  wilaya         VARCHAR(50),
  address        TEXT,
  phone          VARCHAR(20),
  tracking_code  VARCHAR(100),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id            VARCHAR(20) PRIMARY KEY,
  name_ar       VARCHAR(200),
  name_fr       VARCHAR(200),
  price_dzd     DECIMAL(10,2),
  stock         INTEGER DEFAULT 0,
  active        BOOLEAN DEFAULT true,
  category      VARCHAR(100),
  weight_kg     DECIMAL(5,2),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_usage (
  id              SERIAL PRIMARY KEY,
  timestamp       TIMESTAMP DEFAULT NOW(),
  provider        VARCHAR(20),
  model           VARCHAR(50),
  input_tokens    INTEGER,
  output_tokens   INTEGER,
  total_tokens    INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd        DECIMAL(10,6),
  platform        VARCHAR(20),
  customer_id     VARCHAR(100),
  message_type    VARCHAR(30)
);

CREATE INDEX idx_token_usage_date     ON token_usage(timestamp);
CREATE INDEX idx_token_usage_provider ON token_usage(provider);
CREATE INDEX idx_token_usage_platform ON token_usage(platform);
CREATE INDEX idx_orders_status        ON orders(status);
CREATE INDEX idx_customers_platform   ON customers(platform, platform_id);
