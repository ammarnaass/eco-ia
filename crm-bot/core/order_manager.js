const { generateShippingLabel } = require('./shipping_label');
const logger = require('../utils/logger');
const supabase = require('../lib/supabase');

// ── Optimized column selections (avoid `select('*')`) ──────────────────────
const COLS = {
  ORDERS_LIST: 'id, customer_id, platform, status, items, items_total, shipping_cost, grand_total, wilaya, address, phone, tracking_code, created_at, updated_at',
  PRODUCTS: 'id, name_ar, name_fr, price_dzd, stock, active, category, weight_kg, created_at',
  SHIPPING_ZONES: 'zone_id, name, price, wilayas, created_at',
};

function extractOrderItems(text) {
  const items = [];
  const lineRegex = /(.*?)\s+x(\d+)\s+—\s+(\d+)/g;
  let match;
  while ((match = lineRegex.exec(text)) !== null) items.push({ name: match[1].trim(), qty: parseInt(match[2]), price: parseInt(match[3]) });
  if (items.length === 0) items.push({ name: 'Unknown', qty: 1, price: 0 });
  return items;
}

function extractShippingInfo(text) {
  const nameMatch = text.match(/(?:الاسم|name|اسم)[:\s]+(.+)/i);
  const phoneMatch = text.match(/(?:هاتف|phone|رقم)[:\s]+(\d+)/i);
  const addressMatch = text.match(/(?:عنوان|address|العنوان)[:\s]+(.+)/i);
  return {
    name: nameMatch ? nameMatch[1].trim() : 'Unknown',
    phone: phoneMatch ? phoneMatch[1].trim() : 'Unknown',
    address: addressMatch ? addressMatch[1].trim() : 'Unknown',
  };
}

function extractTotal(text) {
  const totalMatch = text.match(/(?:المجموع|total|المجموع الكلي)[:\s]*(\d+)/i);
  return totalMatch ? parseInt(totalMatch[1]) : 0;
}

async function saveOrder(customerId, platform, confirmMessage) {
  const orderId = `ORD-${Date.now().toString().slice(-5)}`;
  const shipping = extractShippingInfo(confirmMessage);
  const items = extractOrderItems(confirmMessage);
  const total = extractTotal(confirmMessage);

  const order = { id: orderId, customer_id: customerId, platform, status: 'CONFIRMED', items, grand_total: total, phone: shipping.phone, address: shipping.address, created_at: new Date().toISOString() };

  const { error } = await supabase.from('orders').insert({
    id: orderId, customer_id: customerId, platform, status: 'CONFIRMED',
    items: JSON.stringify(items), grand_total: total,
    phone: shipping.phone, address: `${shipping.name}, ${shipping.address}`,
  });
  if (error) logger.error(`order insert: ${error.message}`);

  await generateShippingLabel({
    order_id: orderId,
    shipping,
    items,
    total
  });
  logger.info(`Order saved: ${orderId}`, { order_id: orderId, platform, customer_id: customerId });
  return orderId;
}

// ── Optimized reads (specific columns + smaller payloads) ──────────────────
async function getProducts() {
  const start = Date.now();
  const { data, error } = await supabase
    .from('products')
    .select(COLS.PRODUCTS)
    .order('id');
  if (error) { logger.error(`products select: ${error.message}`); return []; }
  logger.debug(`getProducts: ${data?.length || 0} rows in ${Date.now() - start}ms`);
  return data || [];
}

async function getShippingZones() {
  const { data, error } = await supabase
    .from('shipping_zones')
    .select(COLS.SHIPPING_ZONES);
  if (error) return [];

  return (data || []).map(zone => {
    const keyHome = `${zone.zone_id.toUpperCase()}_PRICE_HOME`;
    const keyDesk = `${zone.zone_id.toUpperCase()}_PRICE_DESK`;
    return {
      ...zone,
      price_home: process.env[keyHome] ? parseInt(process.env[keyHome]) : zone.price,
      price_desk: process.env[keyDesk] ? parseInt(process.env[keyDesk]) : Math.max(0, zone.price - 200)
    };
  });
}

async function getOrders() {
  const start = Date.now();
  const { data, error } = await supabase
    .from('orders')
    .select(COLS.ORDERS_LIST)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return [];
  logger.debug(`getOrders: ${data?.length || 0} rows in ${Date.now() - start}ms`);
  return data || [];
}

async function addProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select(COLS.PRODUCTS)
    .single();
  if (error) throw error;
  return data;
}

async function updateProduct(id, product) {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select(COLS.PRODUCTS)
    .single();
  if (error) throw error;
  return data;
}

async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
}

module.exports = {
  saveOrder,
  getOrders,
  getProducts,
  getShippingZones,
  extractOrderItems,
  extractShippingInfo,
  extractTotal,
  addProduct,
  updateProduct,
  deleteProduct
};
