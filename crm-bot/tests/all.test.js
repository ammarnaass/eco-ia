// Integration tests for CRM Bot
// Run: node tests/all.test.js

const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

async function testAsync(name, fn) {
  try { await fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

// ── 1. classifyIntent ──────────────────────────────────────
console.log('\n📋 Intent Classification');
const { classifyIntent } = require('../core/message_processor');

test('ORDER intent: "بغيت الحذاء الأبيض"', () => {
  assert.strictEqual(classifyIntent('بغيت الحذاء الأبيض').type, 'ORDER');
});

test('ORDER intent: "نطلب حذاء"', () => {
  assert.strictEqual(classifyIntent('نطلب حذاء رياضي').type, 'ORDER');
});

test('COMPLAINT intent: "طلب ما وصلش"', () => {
  const r = classifyIntent('طلبي ما وصلش ولا 5 أيام');
  assert.strictEqual(r.type, 'COMPLAINT');
  assert.strictEqual(r.sentiment, 'NEGATIVE');
});

test('QUERY intent: "واش عندكم حذاء؟"', () => {
  assert.strictEqual(classifyIntent('واش عندكم حذاء رياضي').type, 'QUERY');
});

test('SHIPPING_QUERY intent: "كاش يوصل لقسنطينة"', () => {
  assert.strictEqual(classifyIntent('كاش يوصل لقسنطينة').type, 'SHIPPING_QUERY');
});

test('GENERAL intent: "السلام عليكم"', () => {
  assert.strictEqual(classifyIntent('السلام عليكم').type, 'GENERAL');
});

// ── 2. selectModel (AI Router) ────────────────────────────
console.log('\n🤖 AI Router');
const { selectModel } = require('../core/unified_ai');

// Save original env
const origAnthropic = process.env.ANTHROPIC_API_KEY;
const origGoogle = process.env.GOOGLE_AI_API_KEY;
const origOpenAI = process.env.OPENAI_API_KEY;
const origClaudeModel = process.env.CLAUDE_DEFAULT_MODEL;
const origGoogleModel = process.env.GOOGLE_DEFAULT_MODEL;
const origOpenAIModel = process.env.OPENAI_DEFAULT_MODEL;

// Setup mock env
process.env.ANTHROPIC_API_KEY = 'mock-key';
process.env.GOOGLE_AI_API_KEY = 'mock-key';
process.env.OPENAI_API_KEY = 'mock-key';
process.env.CLAUDE_DEFAULT_MODEL = 'claude-sonnet-4-5';
process.env.GOOGLE_DEFAULT_MODEL = 'gemini-1.5-flash';
process.env.OPENAI_DEFAULT_MODEL = 'gpt-4o';

test('order confirmation → Claude Sonnet', () => {
  assert.deepStrictEqual(selectModel('', { stage: 'ORDER_CONFIRMATION' }), { provider: 'anthropic', model: 'claude-sonnet-4-5' });
});

test('simple query → Gemini Flash', () => {
  assert.deepStrictEqual(selectModel('', { message_type: 'SIMPLE_QUERY' }), { provider: 'google', model: 'gemini-1.5-flash' });
});

test('negative sentiment → GPT-4o', () => {
  assert.deepStrictEqual(selectModel('', { sentiment: 'NEGATIVE', complexity: 'HIGH' }), { provider: 'openai', model: 'gpt-4o' });
});

test('default → Claude Sonnet', () => {
  const gKey = process.env.GOOGLE_AI_API_KEY;
  const oKey = process.env.OPENAI_API_KEY;
  delete process.env.GOOGLE_AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  
  assert.deepStrictEqual(selectModel('', {}).provider, 'anthropic');
  
  process.env.GOOGLE_AI_API_KEY = gKey;
  process.env.OPENAI_API_KEY = oKey;
});

// Restore original env
process.env.ANTHROPIC_API_KEY = origAnthropic;
process.env.GOOGLE_AI_API_KEY = origGoogle;
process.env.OPENAI_API_KEY = origOpenAI;
process.env.CLAUDE_DEFAULT_MODEL = origClaudeModel;
process.env.GOOGLE_DEFAULT_MODEL = origGoogleModel;
process.env.OPENAI_DEFAULT_MODEL = origOpenAIModel;

// ── 3. token_cost ─────────────────────────────────────────
console.log('\n💰 Token Cost');
const { calculateCost } = require('../utils/token_cost');

test('Claude Sonnet 1000 input + 200 output tokens', () => {
  assert.strictEqual(calculateCost('anthropic', 'claude-sonnet-4-5', 1000, 200), (1000/1e6)*3 + (200/1e6)*15);
});

test('Gemini Flash 5000 input + 1000 output tokens', () => {
  assert.strictEqual(calculateCost('google', 'gemini-1.5-flash', 5000, 1000), (5000/1e6)*0.075 + (1000/1e6)*0.30);
});

test('Unknown model returns 0', () => {
  assert.strictEqual(calculateCost('anthropic', 'unknown-model', 100, 100), 0);
});

// ── 4. logger ─────────────────────────────────────────────
console.log('\n📝 Logger');
const logger = require('../utils/logger');

test('logger.info does not throw', () => { logger.info('test message', { key: 'value' }); });
test('logger.error does not throw', () => { logger.error('test error', { code: 500 }); });

// ── 5. order_manager extractors ──────────────────────────
console.log('\n📦 Order Manager extractors');
const { extractOrderItems, extractShippingInfo, extractTotal } = require('../core/order_manager');

test('extractOrderItems from AI text', () => {
  const items = extractOrderItems('👟 حذاء رياضي أبيض x1 — 3500');
  assert.strictEqual(items.length, 1);
});

test('extractShippingInfo with Arabic fields', () => {
  const info = extractShippingInfo('الاسم: أحمد بن علي\nهاتف: 0555123456\nعنوان: الجزائر');
  assert.strictEqual(info.name, 'أحمد بن علي');
  assert.strictEqual(info.phone, '0555123456');
});

test('extractTotal with Arabic label', () => {
  assert.strictEqual(extractTotal('المجموع الكلي: 3900 دج'), 3900);
});

// ── 6. encryption ────────────────────────────────────────
console.log('\n🔐 Encryption');
const { encrypt, decrypt } = require('../utils/encryption');

test('encrypt/decrypt roundtrip', () => {
  process.env.ENCRYPTION_KEY = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
  const original = 'my-secret-token-12345';
  const encrypted = encrypt(original);
  assert.notStrictEqual(encrypted, original);
  assert.strictEqual(decrypt(encrypted), original);
});

// ── Summary ──────────────────────────────────────────────
console.log(`\n${'━'.repeat(40)}`);
console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
