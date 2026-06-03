require('dotenv').config({ override: true });
const { getConfig, loadConfigIntoProcessEnv } = require('./core/config_store');

(async () => {
  await loadConfigIntoProcessEnv();
  await new Promise(r => setTimeout(r, 500));
  const secret = getConfig('META_APP_SECRET');
  console.log('getConfig META_APP_SECRET:', JSON.stringify(secret));
  console.log('process.env META_APP_SECRET:', JSON.stringify(process.env.META_APP_SECRET));
  console.log('MATCH:', secret === process.env.META_APP_SECRET);

  // Now compute HMAC with what getConfig returns
  const crypto = require('crypto');
  const body = '{"test":"hello"}';
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  console.log('HMAC with getConfig secret:', 'sha256=' + expected);
  process.exit(0);
})();
