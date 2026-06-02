// Automated test for the new Dynamic Algerian Dialect Fallback Engine
// Run: node tests/fallback_bot.test.js

const assert = require('assert');
const { chat } = require('../core/unified_ai');
const logger = require('../utils/logger');

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

async function runTests() {
  console.log('\n🧪 Testing Dynamic Fallback Bot Conversational Logic');

  // Set MOCK_AI=false so that the actual chat function is evaluated
  process.env.MOCK_AI = 'false';
  // Clear API keys to trigger the ultimate fallback
  const origGoogleKey = process.env.GOOGLE_AI_API_KEY;
  const origOpenaiKey = process.env.OPENAI_API_KEY;
  const origAnthropicKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.GOOGLE_AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  const mockProducts = [
    { id: 'P01', name_ar: 'حذاء رياضي أبيض', price_dzd: 3500 },
    { id: 'P02', name_ar: 'قميص أزرق كلاسيكي', price_dzd: 2800 }
  ];
  const mockShipping = [
    { zone_id: 'Z1', name: 'المركز', price: 400, price_home: 450, price_desk: 250, wilayas: ['16', '09', '42'] }
  ];

  const systemPrompt = `=== قاعدة المنتجات ===
${JSON.stringify(mockProducts, null, 2)}

=== أسعار الشحن ===
${JSON.stringify(mockShipping, null, 2)}`;

  // Test 1: General Greeting
  await test('Greeting lists available products', async () => {
    const history = [{ role: 'user', content: 'سلام عليكم واش عندكم؟' }];
    const res = await chat('google', 'gemini-2.0-flash', history, systemPrompt);
    assert.ok(res.text.includes('حذاء رياضي أبيض'), 'Response should mention the white sneakers');
    assert.ok(res.text.includes('قميص أزرق كلاسيكي'), 'Response should mention the blue shirt');
    assert.ok(res.text.includes('3500') && res.text.includes('2800'), 'Response should list prices');
  });

  // Test 2: Order Intent without product
  await test('Order intent without specifying product asks what they want', async () => {
    const history = [{ role: 'user', content: 'حاب نشري حاجة' }];
    const res = await chat('google', 'gemini-2.0-flash', history, systemPrompt);
    assert.ok(res.text.includes('المعلومات التالية') || res.text.includes('حذاء رياضي أبيض'), 'Response should guide user to order details');
  });

  // Test 3: Product interest + Missing details
  await test('Specifying a product asks for missing details', async () => {
    const history = [
      { role: 'user', content: 'عجبني قميص أزرق كلاسيكي وبغيت نطلبو' }
    ];
    const res = await chat('google', 'gemini-2.0-flash', history, systemPrompt);
    assert.ok(res.text.includes('الاسم الكامل'), 'Should ask for full name');
    assert.ok(res.text.includes('رقم الهاتف'), 'Should ask for phone number');
    assert.ok(res.text.includes('الولاية'), 'Should ask for wilaya');
    assert.ok(res.text.includes('العنوان'), 'Should ask for address');
    assert.ok(res.text.includes('نوع التوصيل'), 'Should ask for delivery type');
  });

  // Test 4: Partially providing details
  await test('Providing name and phone number extracts them and asks for remaining info', async () => {
    const history = [
      { role: 'user', content: 'عجبني قميص أزرق كلاسيكي وبغيت نطلبو' },
      { role: 'assistant', content: 'بكل سرور يرجى تزويدنا بالاسم ورقم الهاتف والولاية والعنوان ونوع التوصيل' },
      { role: 'user', content: 'اسمي محمد أمين وهاتفي هو 0555123456' }
    ];
    const res = await chat('google', 'gemini-2.0-flash', history, systemPrompt);
    assert.ok(res.text.includes('الولاية'), 'Should ask for wilaya');
    assert.ok(res.text.includes('العنوان'), 'Should ask for address');
    assert.ok(res.text.includes('نوع التوصيل'), 'Should ask for delivery type');
    assert.ok(!res.text.includes('الاسم الكامل'), 'Should not ask for full name since it is provided');
    assert.ok(!res.text.includes('رقم الهاتف'), 'Should not ask for phone since it is provided');
  });

  // Test 5: Fully providing details for Home Delivery calculates price_home (450)
  await test('Providing all details with Home Delivery extracts them and calculates home shipping (450 DZD)', async () => {
    const history = [
      { role: 'user', content: 'عجبني قميص أزرق كلاسيكي وبغيت نطلبو' },
      { role: 'assistant', content: 'يرجى تقديم التفاصيل' },
      { role: 'user', content: 'محمد أمين، 0555123456، ولاية البليدة، حي السلام، شحن للمنزل' }
    ];
    const res = await chat('google', 'gemini-2.0-flash', history, systemPrompt);
    assert.ok(res.text.includes('البليدة'), 'Should mention Blida');
    assert.ok(res.text.includes('450 دج'), 'Should show Blida zone Z1 Home shipping rate of 450 dzd');
    assert.ok(res.text.includes('المجموع الكلي'), 'Should show total cost');
    assert.ok(res.text.includes('3250'), 'Total cost should be shirt price 2800 + shipping 450 = 3250');
    assert.ok(res.text.includes('توصيل للمنزل'), 'Should mention home delivery');
    assert.ok(res.text.includes('هل تؤكد هذا الطلب'), 'Should ask for confirmation');
  });

  // Test 5b: Fully providing details for Stop Desk Delivery calculates price_desk (250)
  await test('Providing all details with Stop Desk Delivery extracts them and calculates desk shipping (250 DZD)', async () => {
    const history = [
      { role: 'user', content: 'عجبني قميص أزرق كلاسيكي وبغيت نطلبو' },
      { role: 'assistant', content: 'يرجى تقديم التفاصيل' },
      { role: 'user', content: 'محمد أمين، 0555123456، ولاية البليدة، مكتب ياليدين' }
    ];
    const res = await chat('google', 'gemini-2.0-flash', history, systemPrompt);
    assert.ok(res.text.includes('البليدة'), 'Should mention Blida');
    assert.ok(res.text.includes('250 دج'), 'Should show Blida zone Z1 Desk shipping rate of 250 dzd');
    assert.ok(res.text.includes('3050'), 'Total cost should be shirt price 2800 + shipping 250 = 3050');
    assert.ok(res.text.includes('مكتب التوصيل'), 'Should mention stop desk delivery');
  });

  // Test 6: Final order confirmation generates #ORD-XXXXX in exact CRM format
  await test('Final confirmation generates #ORD-XXXXX order number and correctly formatted confirmation details', async () => {
    const history = [
      { role: 'user', content: 'عجبني قميص أزرق كلاسيكي وبغيت نطلبو' },
      { role: 'assistant', content: 'يرجى تقديم التفاصيل' },
      { role: 'user', content: 'محمد أمين، 0555123456، البليدة، مكتب ياليدين' },
      { role: 'assistant', content: 'هل تؤكد هذا الطلب لتسجيله؟' },
      { role: 'user', content: 'نعم، أكد الطلب' }
    ];
    const res = await chat('google', 'gemini-2.0-flash', history, systemPrompt);
    assert.ok(res.text.includes('#ORD-'), 'Should contain order number');
    assert.ok(res.text.includes('الاسم: محمد أمين'), 'Should print correct name');
    assert.ok(res.text.includes('الهاتف: 0555123456'), 'Should print phone');
    assert.ok(res.text.includes('العنوان: البليدة، مكتب ياليدين'), 'Should print full address');
    assert.ok(res.text.includes('نوع التوصيل: استلام من مكتب التوصيل'), 'Should print stop desk');
    assert.ok(res.text.includes('قميص أزرق كلاسيكي x1 — 2800 دج'), 'Should print correct product line');
    assert.ok(res.text.includes('المجموع الكلي: 3050'), 'Should print correct grand total');
  });

  // Test 7: Dynamic individual wilaya shipping pricing via JSON
  await test('Custom dynamic individual wilaya pricing in JSON is correctly parsed and evaluated (e.g. Blida 09 -> Home 990, Desk 880)', async () => {
    process.env.WILAYA_SHIPPING_PRICES = JSON.stringify({
      "09": { name: "البليدة المحدثة", price_home: 990, price_desk: 880 }
    });

    const historyHome = [
      { role: 'user', content: 'عجبني قميص أزرق كلاسيكي وبغيت نطلبو' },
      { role: 'assistant', content: 'يرجى تقديم التفاصيل' },
      { role: 'user', content: 'محمد أمين، 0555123456، ولاية البليدة، حي السلام، شحن للمنزل' }
    ];
    const resHome = await chat('google', 'gemini-2.0-flash', historyHome, systemPrompt);
    assert.ok(resHome.text.includes('990 دج'), 'Should use custom dynamic home price of 990');
    assert.ok(resHome.text.includes('3790'), 'Total should be shirt price 2800 + shipping 990 = 3790');

    const historyDesk = [
      { role: 'user', content: 'عجبني قميص أزرق كلاسيكي وبغيت نطلبو' },
      { role: 'assistant', content: 'يرجى تقديم التفاصيل' },
      { role: 'user', content: 'محمد أمين، 0555123456، ولاية البليدة، مكتب ياليدين' }
    ];
    const resDesk = await chat('google', 'gemini-2.0-flash', historyDesk, systemPrompt);
    assert.ok(resDesk.text.includes('880 دج'), 'Should use custom dynamic desk price of 880');
    assert.ok(resDesk.text.includes('3680'), 'Total should be shirt price 2800 + shipping 880 = 3680');

    // Clean up
    delete process.env.WILAYA_SHIPPING_PRICES;
  });

  // Restore keys
  process.env.GOOGLE_AI_API_KEY = origGoogleKey;
  process.env.OPENAI_API_KEY = origOpenaiKey;
  process.env.ANTHROPIC_API_KEY = origAnthropicKey;

  console.log(`\n📊 Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Test runner failed: ', e);
  process.exit(1);
});
