// Test that signature verification works
require('dotenv').config({ override: true });
const crypto = require('crypto');
const http = require('http');

const body = '{"test":"hello"}';
const secret = process.env.META_APP_SECRET;

console.log('Secret:', secret);
console.log('Secret length:', secret?.length);

const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
const signature = 'sha256=' + expected;

console.log('Sending with signature:', signature);
console.log('Body:', body);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/whatsapp/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body, 'utf8'),
    'X-Hub-Signature-256': signature,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('\n=== Response ===');
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
