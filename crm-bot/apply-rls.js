/**
 * apply-rls.js — تطبيق RLS Policies + Schema Fixes تلقائياً
 *
 * الاستخدام: node apply-rls.js
 * يتطلب: SUPABASE_SERVICE_ROLE_KEY في .env
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// SQL statements to execute individually (PostgREST doesn't support multi-statement)
const statements = [
  // Enable RLS
  "ALTER TABLE products         ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE orders           ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE conversations    ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE customers        ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE token_usage      ENABLE ROW LEVEL SECURITY",

  // Drop old policies
  `DROP POLICY IF EXISTS "anon_read_products"       ON products`,
  `DROP POLICY IF EXISTS "anon_write_products"      ON products`,
  `DROP POLICY IF EXISTS "anon_read_orders"         ON orders`,
  `DROP POLICY IF EXISTS "anon_write_orders"        ON orders`,
  `DROP POLICY IF EXISTS "anon_read_conversations"  ON conversations`,
  `DROP POLICY IF EXISTS "anon_write_conversations" ON conversations`,
  `DROP POLICY IF EXISTS "anon_read_customers"      ON customers`,
  `DROP POLICY IF EXISTS "anon_read_token_usage"    ON token_usage`,
  `DROP POLICY IF EXISTS "anon_all_products"        ON products`,
  `DROP POLICY IF EXISTS "anon_all_orders"          ON orders`,
  `DROP POLICY IF EXISTS "anon_all_conversations"   ON conversations`,
  `DROP POLICY IF EXISTS "anon_all_customers"       ON customers`,
  `DROP POLICY IF EXISTS "anon_all_token_usage"     ON token_usage`,
  `DROP POLICY IF EXISTS "anon_read_app_config"     ON app_config`,
  `DROP POLICY IF EXISTS "anon_read_whatsapp_accounts" ON whatsapp_accounts`,

  // Create new policies
  `CREATE POLICY "anon_all_products" ON products FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_orders" ON orders FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_conversations" ON conversations FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_customers" ON customers FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_read_token_usage" ON token_usage FOR SELECT TO anon USING (true)`,
  `CREATE POLICY "anon_read_app_config" ON app_config FOR SELECT TO anon USING (true)`,
  `CREATE POLICY "anon_read_whatsapp_accounts" ON whatsapp_accounts FOR SELECT TO anon USING (true)`,

  // Fix ID length
  `ALTER TABLE products ALTER COLUMN id TYPE VARCHAR(20)`,
];

async function execSql(sql) {
  // Try using rpc first
  try {
    const { error } = await client.rpc('exec_sql', { sql_query: sql });
    if (!error) return { ok: true, method: 'rpc' };
  } catch (e) { /* fall through */ }

  // Fallback: try direct query (only works for some statements)
  // For most DDL, this won't work via PostgREST — user must use Dashboard
  return { ok: false, method: 'none', sql };
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  RLS Policies + Schema Fixes — eco-ia CRM');
  console.log('═'.repeat(60));
  console.log('');

  console.log(`Executing ${statements.length} SQL statements...`);
  console.log('');

  let success = 0;
  let failed = 0;
  const failedStatements = [];

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    const result = await execSql(sql);
    if (result.ok) {
      success++;
      console.log(`✓ [${i + 1}/${statements.length}] OK`);
    } else {
      failed++;
      failedStatements.push(sql);
      console.log(`✗ [${i + 1}/${statements.length}] FAILED (needs Dashboard)`);
    }
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log(`  Results: ${success} success, ${failed} failed`);
  console.log('═'.repeat(60));

  if (failed > 0) {
    console.log('');
    console.log('⚠️  بعض العمليات تتطلب تنفيذها يدوياً في Supabase Dashboard:');
    console.log('   1. افتح https://supabase.com/dashboard/project/_/sql');
    console.log('   2. انسخ محتوى الملف: crm-bot/db/enable-rls-for-frontend.sql');
    console.log('   3. الصقه في SQL Editor واضغط Run');
    console.log('');
    console.log('📄 الملف جاهز في: crm-bot/db/enable-rls-for-frontend.sql');
  } else {
    console.log('');
    console.log('✅ تم تطبيق جميع السياسات بنجاح!');

    // Test ANON access
    console.log('');
    console.log('Testing ANON access...');
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    const { data, error } = await anonClient.from('products').select('id, name_ar').order('id');
    if (error) {
      console.log('✗ ANON test FAILED:', error.message);
    } else {
      console.log(`✓ ANON can now read ${data.length} products`);
      console.log('  IDs:', data.map(p => p.id).join(', '));
    }
  }
}

main().catch(console.error);
