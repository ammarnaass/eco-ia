const supabase = require('../lib/supabase');

// In-memory live cache that refreshes whenever config is loaded or saved
let _liveConfig = {};

async function getAllConfig() {
  const { data, error } = await supabase.from('app_config').select('key, value');
  if (error) {
    console.warn('config_store: app_config table not available —', error.message);
    return _liveConfig;
  }
  const map = {};
  for (const row of data || []) map[row.key] = row.value;
  _liveConfig = map;
  return map;
}

// Sensitive keys that should ALWAYS prefer .env over Supabase cache
// (e.g., META_APP_SECRET is a server-side secret and must match Meta Developer Portal)
const ENV_PRIORITY_KEYS = new Set([
  'META_APP_SECRET',
  'ENCRYPTION_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_URL',
  'SMTP_PASS',
  'GOOGLE_SERVICE_ACCOUNT_KEY',
  'YALIDINE_KEY',
  'MAYSTRO_KEY',
  'ADMIN_PHONE',
  'ADMIN_EMAIL',
]);

// Forward declaration so loadConfigIntoProcessEnv can use it
const _ENV_PRIORITY_KEYS_REF = ENV_PRIORITY_KEYS;

function getConfig(key, fallback = undefined) {
  // Sensitive keys: ALWAYS prefer process.env (.env) to avoid mismatch with Meta Developer
  if (ENV_PRIORITY_KEYS.has(key)) {
    const envVal = process.env[key];
    if (envVal !== undefined && envVal !== null && envVal !== '') return envVal;
    // Fallback to live cache only if .env is missing
    const live = _liveConfig[key];
    if (live !== undefined && live !== null && live !== '') return live;
    return fallback;
  }

  // Other keys: Prefer live cache (UI-editable), then process.env, then fallback
  const live = _liveConfig[key];
  if (live !== undefined && live !== null && live !== '') return live;
  const envVal = process.env[key];
  if (envVal !== undefined && envVal !== null && envVal !== '') return envVal;
  return fallback;
}

async function setConfig(key, value) {
  const { data, error } = await supabase.from('app_config').upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  ).select().single();
  if (error) throw error;
  _liveConfig[key] = value;
  return data;
}

async function setManyConfig(entries) {
  const rows = entries.map(({ key, value }) => ({
    key, value, updated_at: new Date().toISOString()
  }));
  const { error } = await supabase.from('app_config').upsert(rows, { onConflict: 'key' });
  if (error) {
    console.warn('config_store: upsert failed —', error.message);
    throw error;
  }
  for (const { key, value } of entries) {
    _liveConfig[key] = value;
  }
}

async function loadConfigIntoProcessEnv() {
  try {
    const config = await getAllConfig();
    for (const [key, value] of Object.entries(config)) {
      // Skip empty/null values — don't override valid env vars with empty strings from Supabase
      if (value === undefined || value === null || value === '') continue;
      // Don't override sensitive keys that already have a .env value
      if (ENV_PRIORITY_KEYS.has(key) && process.env[key] && process.env[key] !== '') {
        continue;
      }
      process.env[key] = value.toString();
    }
  } catch (e) {
    console.error('config_store: Failed to load config into process.env —', e.message);
  }
}

module.exports = { getAllConfig, getConfig, setConfig, setManyConfig, loadConfigIntoProcessEnv };
