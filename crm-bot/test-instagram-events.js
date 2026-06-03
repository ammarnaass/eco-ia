// Test all Instagram webhook event types
require('dotenv').config();
const http = require('http');
const crypto = require('crypto');

const secret = process.env.META_APP_SECRET;
const port = 3000;
const path = '/api/instagram/webhook';

function sendWebhook(body) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(body);
    const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(json).digest('hex');
    const options = {
      hostname: 'localhost',
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(json, 'utf8'),
        'X-Hub-Signature-256': sig,
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(json);
    req.end();
  });
}

const scenarios = [
  {
    name: '1. Text message (standard)',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_1' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), message: { mid: 'm1', text: 'مرحبا' } }] }] },
  },
  {
    name: '2. Image attachment',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_2' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), message: { mid: 'm2', attachments: [{ type: 'image', payload: { url: 'https://example.com/img.jpg' } }] } }] }] },
  },
  {
    name: '3. Echo (our own message)',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGID_1' }, recipient: { id: 'IGSID_3' }, timestamp: Date.now(), message: { mid: 'm3', text: 'رد منا', is_echo: true } }] }] },
  },
  {
    name: '4. Reaction (love)',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_4' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), reaction: { mid: 'm1', action: 'react', reaction: 'love' } }] }] },
  },
  {
    name: '5. Postback (quick_reply)',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_5' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), postback: { mid: 'm5', title: 'GET_STARTED', payload: 'START_ORDER' } }] }] },
  },
  {
    name: '6. Read receipt',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_6' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), read: { mid: 'm1', watermark: Date.now() } }] }] },
  },
  {
    name: '7. Referral (ad CTD)',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_7' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), message: { mid: 'm7', text: 'مرحبا من الإعلان' }, referral: { source: 'ADS', type: 'OPEN_THREAD', ad_id: 'AD_123' } }] }] },
  },
  {
    name: '8. Standby (other app handles)',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_8' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), standby: [{ sender: { id: 'IGSID_8' }, recipient: { id: 'IGID_1' } }] }] }] },
  },
  {
    name: '9. Deleted message',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_9' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), message: { mid: 'm9', is_deleted: true } }] }] },
  },
  {
    name: '10. Unsupported (GIF)',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_10' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), message: { mid: 'm10', is_unsupported: true } }] }] },
  },
  {
    name: '11. Ephemeral media (no URL)',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_11' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), message: { mid: 'm11', attachments: [{ type: 'ephemeral' }] } }] }] },
  },
  {
    name: '12. Inline reply (reply_to.mid)',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), messaging: [{ sender: { id: 'IGSID_12' }, recipient: { id: 'IGID_1' }, timestamp: Date.now(), message: { mid: 'm12', text: 'هذا رد', reply_to: { mid: 'm1' } } }] }] },
  },
  {
    name: '13. Comment on post',
    body: { object: 'instagram', entry: [{ id: 'IGID_1', time: Date.now(), changes: [{ field: 'comments', value: { id: 'c1', text: 'منتج رائع!', from: { id: 'IGSID_13', username: 'commenter' }, media: { id: 'media_1' } } }] }] },
  },
  {
    name: '14. Wrong object (should ignore)',
    body: { object: 'page', entry: [{ id: 'X' }] },
  },
];

(async () => {
  for (const s of scenarios) {
    const r = await sendWebhook(s.body);
    console.log(`\n${s.name}`);
    console.log(`  Status: ${r.status}`);
    if (r.status !== 200) console.log(`  Body: ${r.body}`);
  }
  process.exit(0);
})();
