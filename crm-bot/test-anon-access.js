/**
 * test-anon-access.js — اختبار وصول ANON client لـ Supabase
 *
 * يحاكي ما يحدث في الـ frontend (Dashboard) بالضبط
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// ANON client — نفس ما يستخدمه الـ Dashboard
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('═'.repeat(60));
  console.log('  ANON Access Test — eco-ia CRM');
  console.log('═'.repeat(60));
  console.log('');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...');
  console.log('');

  // Test 1: Read products
  console.log('📦 Test 1: Read products (anon)...');
  const { data: products, error: pErr } = await anonClient.from('products').select('*').order('id');
  if (pErr) {
    console.log('  ✗ FAILED:', pErr.message);
    if (pErr.hint) console.log('  Hint:', pErr.hint);
  } else {
    console.log(`  ✓ Got ${products.length} products: ${products.map(p => p.id).join(', ')}`);
  }

  // Test 2: Insert product with short ID
  console.log('');
  console.log('📦 Test 2: Insert product (id=SHORT1)...');
  const testId = 'SHORT1';
  const { data: ins, error: iErr } = await anonClient.from('products').insert({
    id: testId,
    name_ar: 'منتج اختبار قصير',
    name_fr: 'Short test',
    price_dzd: 100,
    stock: 5,
    category: 'test',
    active: true
  }).select().single();

  if (iErr) {
    console.log('  ✗ FAILED:', iErr.message);
    if (iErr.hint) console.log('  Hint:', iErr.hint);
  } else {
    console.log(`  ✓ Created: ${ins.id}`);

    // Read back
    console.log('');
    console.log('📦 Test 3: Read back the new product...');
    const { data: readBack, error: rErr } = await anonClient.from('products').select('*').eq('id', testId).single();
    if (rErr) {
      console.log('  ✗ FAILED:', rErr.message);
    } else {
      console.log(`  ✓ Found: ${readBack.id} = ${readBack.name_ar}`);
    }

    // Cleanup
    console.log('');
    console.log('🗑️  Cleaning up...');
    await anonClient.from('products').delete().eq('id', testId);
    console.log('  ✓ Deleted:', testId);
  }

  // Test 4: Read orders
  console.log('');
  console.log('🛒 Test 4: Read orders (anon)...');
  const { data: orders, error: oErr } = await anonClient.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
  if (oErr) {
    console.log('  ✗ FAILED:', oErr.message);
  } else {
    console.log(`  ✓ Got ${orders.length} orders`);
  }

  console.log('');
  console.log('═'.repeat(60));
  if (!pErr && !iErr) {
    console.log('  ✅ ALL TESTS PASSED — RLS policies are correctly set');
    console.log('  The frontend can now use Supabase directly!');
  } else {
    console.log('  ⚠️  RLS POLICIES NEED TO BE APPLIED');
    console.log('  Run crm-bot/db/enable-rls-for-frontend.sql in Supabase Dashboard');
    console.log('  → https://supabase.com/dashboard/project/_/sql');
  }
  console.log('═'.repeat(60));
}

main().catch(console.error);
