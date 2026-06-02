// Meta Webhooks and API integration tests
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

// Mock env
process.env.FB_VERIFY_TOKEN = 'test_verify_token';
process.env.FB_PAGE_TOKEN = 'test_page_token';
process.env.INSTAGRAM_BUSINESS_ID = 'test_instagram_id';
process.env.MOCK_META = 'true';

// ── 1. Webhook GET Verification tests ──────────────────────────
console.log('\n📋 Webhook GET Verification');
const facebookRouter = require('../routes/facebook');
const instagramRouter = require('../routes/instagram');

// Simulate Express request/response
function mockResponse() {
  const res = {
    statusCode: 200,
    sentData: null,
    sendStatus: function(code) {
      this.statusCode = code;
      return this;
    },
    send: function(data) {
      this.sentData = data;
      return this;
    }
  };
  return res;
}

test('Facebook webhook verification: valid token', () => {
  const req = {
    method: 'GET',
    query: {
      'hub.verify_token': 'test_verify_token',
      'hub.challenge': 'fb_challenge_123'
    }
  };
  const res = mockResponse();
  
  // Find the GET handler manually from the router stack
  const getRoute = facebookRouter.stack.find(s => s.route && s.route.methods.get);
  const handler = getRoute.route.stack[0].handle;
  
  handler(req, res);
  assert.strictEqual(res.sentData, 'fb_challenge_123');
});

test('Facebook webhook verification: invalid token', () => {
  const req = {
    method: 'GET',
    query: {
      'hub.verify_token': 'wrong_token',
      'hub.challenge': 'fb_challenge_123'
    }
  };
  const res = mockResponse();
  
  const getRoute = facebookRouter.stack.find(s => s.route && s.route.methods.get);
  const handler = getRoute.route.stack[0].handle;
  
  handler(req, res);
  assert.strictEqual(res.statusCode, 403);
});

test('Instagram webhook verification: valid token', () => {
  const req = {
    method: 'GET',
    query: {
      'hub.verify_token': 'test_verify_token',
      'hub.challenge': 'ig_challenge_456'
    }
  };
  const res = mockResponse();
  
  const getRoute = instagramRouter.stack.find(s => s.route && s.route.methods.get);
  const handler = getRoute.route.stack[0].handle;
  
  handler(req, res);
  assert.strictEqual(res.sentData, 'ig_challenge_456');
});

// ── 2. Message Sending Utility tests ──────────────────────────
console.log('\n✉️ Message Sending Utility');
const { sendFacebookReply, sendInstagramReply } = require('../utils/meta');

testAsync('sendFacebookReply under MOCK_META=true', async () => {
  const success = await sendFacebookReply('123456', 'Hello from test');
  assert.strictEqual(success, true);
});

testAsync('sendInstagramReply under MOCK_META=true', async () => {
  const success = await sendInstagramReply('789012', 'Hello Instagram from test');
  assert.strictEqual(success, true);
});

// Summary
setTimeout(() => {
  console.log(`\n${'━'.repeat(40)}`);
  console.log(`Meta Tests Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}, 200);
