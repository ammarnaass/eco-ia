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

function getConfig(key, fallback = undefined) {
  // Prefer live cache, then process.env, then fallback
  if (_liveConfig[key] !== undefined) return _liveConfig[key];
  if (process.env[key] !== undefined) return process.env[key];
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
      if (value !== undefined && value !== null) {
        process.env[key] = value.toString();
      }
    }
  } catch (e) {
    console.error('config_store: Failed to load config into process.env —', e.message);
  }
}

module.exports = { getAllConfig, getConfig, setConfig, setManyConfig, loadConfigIntoProcessEnv };
