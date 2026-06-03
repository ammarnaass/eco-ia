require('dotenv').config({ override: true });
const { getConfig, loadConfigIntoProcessEnv } = require('./core/config_store');

(async () => {
  // Wait for config to load
  await loadConfigIntoProcessEnv();
  await new Promise(r => setTimeout(r, 500));

  const secret = getConfig('META_APP_SECRET');
  console.log('After loadConfigIntoProcessEnv:');
  console.log('  getConfig(META_APP_SECRET):', JSON.stringify(secret));
  console.log('  Length:', secret?.length);
  console.log('  process.env.META_APP_SECRET:', JSON.stringify(process.env.META_APP_SECRET));

  // Test signature
  const crypto = require('crypto');
  const testBody = '{"test":"hello"}';
  const expected = crypto.createHmac('sha256', secret).update(testBody).digest('hex');
  console.log('  Test HMAC:', 'sha256=' + expected);

  process.exit(0);
})();
